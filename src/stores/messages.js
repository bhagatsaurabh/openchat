import { capitalize, ref } from 'vue';
import { defineStore } from 'pinia';
import { Timestamp, collection, doc, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';

import { useAuthStore } from './auth';
import { useRemoteDBStore } from './remote';
import { useGroupsStore } from './groups';
import { useFilesStore } from './files';
import { useUsersStore } from './users';
import * as local from '@/database/driver';
import { Queue } from '@/utils/queue';
import { getIconFromFileType } from '@/utils/utils';
import { LinkedList } from '@/utils/linked-list';
import { msInAnHour } from '@/utils/constants';
import { decryptFile, decryptText, encryptFile, encryptText } from '@/utils/crypto';
import { deleteMessageFunction, remoteDB } from '@/config/firebase';
import { stream } from '@/database/database';

export const useMessagesStore = defineStore('messages', () => {
  const auth = useAuthStore();
  const remote = useRemoteDBStore();
  const groups = useGroupsStore();
  const filesStore = useFilesStore();
  const usersStore = useUsersStore();
  const messages = ref({});
  const messageIdx = ref({});
  const unsubFns = ref({});
  const busy = ref(false);
  const outBusy = ref(false);
  const streams = ref({});
  const outQueueIdx = ref({});
  const outQueue = new Queue();
  const queue = new Queue();

  const listener = (snapshot) => {
    const changes = snapshot.docChanges().filter((change) => change.type === 'added');
    changes.forEach((change) => {
      const data = change.doc.data();
      data.id = change.doc.id;
      data.groupId = change.doc.ref.path.substring(
        change.doc.ref.path.indexOf('/') + 1,
        change.doc.ref.path.indexOf('/messages')
      );
      queue.push(data);
      process();
    });
  };
  const process = async () => {
    if (busy.value) return;
    else {
      busy.value = true;
      let message;
      while ((message = queue.pop()) !== null) {
        await handleMessage(message);
      }
      busy.value = false;
    }
  };
  const processOutQueue = async () => {
    if (outBusy.value) return;
    else {
      outBusy.value = true;
      let message;
      while ((message = outQueue.pop()) !== null) {
        await handleOutMessage(message);
      }
      outBusy.value = false;
    }
  };
  const handleOutMessage = async (message) => {
    const msg = {
      by: message.by,
      timestamp: message.groupId === 'self' ? new Date() : serverTimestamp(),
      text: message.text,
      type: message.type
    };
    if (msg.type === 'file') msg.mimetype = message.mimetype;

    if (message.groupId !== 'self') {
      msg.expiry = Timestamp.fromDate(new Date(Date.now() + 864000000));
      await remote.addNewMessage(message.local.docRef, msg);
    } else {
      msg.id = message.id;
      msg.groupId = groups.activeGroup.id;
      await local.storeMessage(msg);
      loadOldMessage(msg);
    }
  };
  const handleMessage = async (message) => {
    message.timestamp = message.timestamp ? message.timestamp.toDate() : new Date();

    if (!['meta:edit', 'meta:delete'].includes(message.type)) {
      await setLastMessage(message);
    }

    if (outQueueIdx.value[message.id]) {
      if (!message.type.startsWith('meta')) {
        messageIdx.value[message.groupId][message.id].value.local = null;
        await local.storeMessage(message);
      }
      outQueueIdx.value[message.id] = undefined;
      await updateSeenAndSync(message);
      return;
    }

    if (['meta:edit', 'meta:delete'].includes(message.type)) {
      const existingMsg = await local.getMessage(message.ref, message.groupId);
      if (existingMsg && (message.timestamp - existingMsg.timestamp) / msInAnHour <= 24) {
        if (message.type === 'meta:edit') existingMsg.text = message.text;
        existingMsg[message.type === 'meta:delete' ? 'deleted' : 'edited'] = true;
        await local.storeMessage(existingMsg);
        updateMessage(existingMsg, true);
      }
    } else {
      await local.storeMessage(message);
      addMessage(message);
    }

    await handleSync(message);
  };
  const handleError = (error) => console.log({ ...error });
  function stop() {
    Object.values(unsubFns.value).forEach((unsubscribe) => unsubscribe());
  }
  function clear() {
    messages.value = {};
    messageIdx.value = {};
    busy.value = false;
    outBusy.value = false;
    streams.value = {};
    outQueueIdx.value = {};
    outQueue.clear();
    queue.clear();
  }
  function attachListener(groupId) {
    if (!unsubFns.value[groupId]) {
      const mySyncTS = Timestamp.fromDate(
        groups.groups[groupId]?.sync[auth.user.uid] ?? groups.groups[groupId].joinedAt
      );
      const unsubscribe = onSnapshot(
        query(collection(remoteDB, 'groups', groupId, 'messages'), where('timestamp', '>', mySyncTS)),
        listener,
        handleError
      );
      unsubFns.value[groupId] = unsubscribe;
    }
  }
  function stopListener(groupId) {
    unsubFns.value[groupId]?.();
    unsubFns.value[groupId] = undefined;
  }
  function addMessage(message) {
    setStatus(message);
    const list = messages.value[message.groupId];
    const index = messageIdx.value[message.groupId];
    if (!list || !index) {
      messages.value[message.groupId] = new LinkedList();
      messageIdx.value[message.groupId] = {};
    }
    const node = messages.value[message.groupId].pushTail(message);
    messageIdx.value[message.groupId][message.id] = node;
  }
  function loadOldMessage(message) {
    setStatus(message);
    const list = messages.value[message.groupId];
    const index = messageIdx.value[message.groupId];
    if (!list || !index) {
      messages.value[message.groupId] = new LinkedList();
      messageIdx.value[message.groupId] = {};
    }
    if (!messageIdx.value[message.groupId][message.id]) {
      const node = messages.value[message.groupId].pushHead(message);
      messageIdx.value[message.groupId][message.id] = node;
    } else {
      messageIdx.value[message.groupId][message.id].value = message;
    }
  }
  function updateMessage(message, forceRender = false) {
    const list = messages.value[message.groupId];
    const existingMsgNode = messageIdx.value[message.groupId]?.[message.id];
    if (list && existingMsgNode) {
      if (forceRender) {
        delete message[message.force];
        message.force = (message.force ?? 0) + 1;
        message[message.force] = null;
      }
      existingMsgNode.value = message;
    }
  }
  function isSynced(message) {
    const group = groups.getGroupByID(message.groupId);
    let numMembers = group.members.length - 1;
    group.members.forEach((memberId) => {
      if (memberId !== auth.user.uid && group.sync[memberId] >= message.timestamp) {
        numMembers -= 1;
      }
    });
    return numMembers <= 0;
  }
  async function handleSync(message) {
    // For text messages, update sync info right-away
    // For messages with files, update sync info only when downloaded successfully
    if (message.type === 'text') {
      if (groups.activeGroup?.id === message.groupId) await updateSeenAndSync(message);
      else await updateSync(message);
    }
  }
  async function updateSync(message) {
    if (message.groupId === 'self') return;
    await remote.updateSyncTimestamp(auth.user.uid, message.groupId, groups.groups[message.groupId].type);
    if (isSynced(message)) {
      try {
        await deleteMessageFunction({ messageId: message.id, groupId: message.groupId });
      } catch (error) {
        // This client may fail to delete the file when another client is also trying to delete simultaneously
      }
    }
  }
  async function updateSeenAndSync(message) {
    if (message.groupId === 'self') return;
    await remote.updateSeenAndSyncTimestamp(
      auth.user.uid,
      message.groupId,
      groups.groups[message.groupId].type
    );
    if (isSynced(message)) {
      try {
        await deleteMessageFunction({ messageId: message.id, groupId: message.groupId });
      } catch (error) {
        // This client may fail to delete the file when another client is also trying to delete simultaneously
      }
    }
  }
  async function openStream(groupId) {
    const iterator = stream(`messages:${groupId}`, 'timestamp');
    streams.value[groupId] = iterator;
    await loadChunk(groupId);
  }
  async function loadChunk(groupId) {
    if (!streams.value[groupId]) return;

    const chunk = await streams.value[groupId].next();
    if (!chunk.done) {
      chunk.value.forEach((message) => loadOldMessage(message));
    } else {
      streams.value[groupId] = null;
    }
  }
  function unload(groupId) {
    messages.value[groupId] = undefined;
    messageIdx.value[groupId] = undefined;
    streams.value[groupId] = null;
  }
  async function encrypt(message) {
    const key =
      message.groupId === groups.activeGroup?.id
        ? groups.activeGroupKey
        : await local.getGroupKey(auth.user.uid, message.groupId);

    if (message.type === 'text') {
      return await encryptText(message.text, key);
    } else {
      return await encryptFile(message.file, key);
    }
  }
  async function decrypt(message) {
    const key =
      message.groupId === groups.activeGroup?.id
        ? groups.activeGroupKey
        : await local.getGroupKey(auth.user.uid, message.groupId);

    if (message.type === 'text') {
      return await decryptText(message.text, key);
    } else {
      // Assume the file is already present in cache
      if (filesStore.files[message.id].decrypted) {
        return filesStore.files[message.id].file;
      } else {
        return await decryptFile(filesStore.files[message.id], key);
      }
    }
  }
  async function send(type, value) {
    const docRef = doc(collection(remoteDB, 'groups', groups.activeGroup.id, 'messages'));
    let message = {
      id: docRef.id,
      groupId: groups.activeGroup.id,
      by: auth.user.uid,
      timestamp: new Date(),
      type,
      local: { status: 'pending', docRef }
    };

    message[type === 'text' ? 'text' : 'file'] = value;
    if (type === 'file') message.mimetype = value.type;

    addMessage(message);
    await local.storeMessage(message);
  }
  function pushToOutQueue(message) {
    outQueue.push(message);
    outQueueIdx.value[message.local.docRef.id] = message;
    processOutQueue();
  }
  async function setLastMessage(message) {
    let text, type;
    if (message.type === 'text') {
      text = !message.by.startsWith('system') ? await decrypt(message) : message.text;
      type = 'text';
    } else {
      type = getIconFromFileType(message.mimetype);
      text = capitalize(type);
    }

    const lastMsg = {
      timestamp: message.timestamp,
      text,
      by: message.by,
      type
    };
    await local.updateGroup(auth.user.uid, message.groupId, { lastMsg });
    groups.groups[message.groupId].lastMsg = lastMsg;
  }
  function parseSysMsg(text) {
    let parsed = text;
    const instances = text.matchAll(/##.[a-zA-Z0-9]+/g);
    let curr;
    while (!(curr = instances.next()).done) {
      parsed = parsed.replace(curr.value[0], usersStore.users[curr.value[0].substring(2)].name);
    }
    return parsed;
  }
  function setStatus(message) {
    if (message.by === auth.user.uid) {
      let status;
      if (message.local?.status === 'pending') status = 'wait';
      else if (!isDelivered(message)) status = 'sent';
      else if (!isSeen(message)) status = 'delivered';
      else status = 'seen';
      message.status = status;
    }
  }
  function isDelivered(message) {
    const group = groups.groups[message.groupId];
    return group.members.reduce((prev, id) => prev && group.sync[id] >= message.timestamp, true);
  }
  function isSeen(message) {
    const group = groups.groups[message.groupId];
    return group.members.reduce((prev, id) => prev && group.seen[id] >= message.timestamp, true);
  }
  async function modifyMessage(type, message, newText) {
    let cipher;
    if (type === 'meta:edit') cipher = await encryptText(newText, groups.activeGroupKey);
    const msg = {
      by: auth.user.uid,
      timestamp: message.groupId === 'self' ? new Date() : serverTimestamp(),
      expiry: Timestamp.fromDate(new Date(Date.now() + 864000000)),
      type,
      ref: message.id
    };
    if (type === 'meta:edit') msg.text = cipher;
    await remote.addMetaMessage(msg, message.id, message.groupId);
  }

  return {
    messages,
    messageIdx,
    stop,
    attachListener,
    stopListener,
    openStream,
    loadChunk,
    unload,
    encrypt,
    decrypt,
    send,
    pushToOutQueue,
    updateSync,
    updateSeenAndSync,
    parseSysMsg,
    modifyMessage,
    addMessage,
    clear
  };
});
