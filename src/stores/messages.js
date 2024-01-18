import { capitalize, ref } from 'vue';
import { defineStore } from 'pinia';

import { useAuthStore } from './auth';
import * as local from '@/database/driver';
import { useRemoteDBStore } from './remote';
import { Queue } from '@/utils/queue';
import { Timestamp, collection, doc, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import { deleteMessageFunction, remoteDB } from '@/config/firebase';
import { LinkedList } from '@/utils/linked-list';
import { msInAnHour } from '@/utils/constants';
import { useGroupsStore } from './groups';
import { stream } from '@/database/database';
import { decryptFile, decryptText, encryptFile, encryptText } from '@/utils/crypto';
import { useFilesStore } from './files';
import { getIconFromFileType } from '@/utils/utils';

export const useMessagesStore = defineStore('messages', () => {
  const auth = useAuthStore();
  const remote = useRemoteDBStore();
  const groups = useGroupsStore();
  const filesStore = useFilesStore();
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
    await setLastMessage(message);

    if (outQueueIdx.value[message.id]) {
      if (!message.type.startsWith('meta')) {
        messageIdx.value[message.groupId][message.id].value.local = null;
        await local.storeMessage(message);
      }
      outQueueIdx.value[message.id] = undefined;
      if (message.type === 'text') await updateSync(message);
      return;
    }

    if (message.type === 'meta:edit') {
      const existingMsg = await local.getMessage(message.ref, message.groupId);
      if (existingMsg && (message.timestamp - existingMsg.timestamp) / msInAnHour <= 24) {
        await local.storeMessage(message);
        updateMessage(message);
      }
    } else if (message.type === 'meta:delete') {
      const existingMsg = await local.getMessage(message.ref, message.groupId);
      if (existingMsg && (message.timestamp - existingMsg.timestamp) / msInAnHour <= 24) {
        await local.deleteMessage(message.ref, message.groupId);
        removeMessage(message);
      }
    } else {
      await local.storeMessage(message);
      addMessage(message);
    }
    // For text messages, update sync info right-away
    // For messages with files, update sync info only when downloaded successfully
    if (message.type === 'text') await updateSync(message);
  };
  const handleError = (error) => console.log({ ...error });
  function stop() {
    Object.values(unsubFns.value).forEach((unsubscribe) => unsubscribe());
  }
  function attachListener(groupId) {
    if (!unsubFns.value[groupId]) {
      const mySyncTS = Timestamp.fromDate(groups.groups[groupId]?.sync[auth.user.uid] ?? new Date(0));
      const unsubscribe = onSnapshot(
        query(collection(remoteDB, 'groups', groupId, 'messages'), where('timestamp', '>', mySyncTS)),
        listener,
        handleError
      );
      unsubFns.value[groupId] = unsubscribe;
    }
  }
  function addMessage(message) {
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
  function updateMessage(message) {
    const list = messages.value[message.groupId];
    const existingMsgNode = messageIdx.value[message.groupId]?.[message.id];
    if (list && existingMsgNode) {
      existingMsgNode.value = message;
    }
  }
  function removeMessage(message) {
    const list = messages.value[message.groupId];
    const existingMsgNode = messageIdx.value[message.groupId]?.[message.id];
    if (list && existingMsgNode) {
      list.delete(existingMsgNode);
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
  async function updateSync(message) {
    if (message.groupId === 'self') return;
    await remote.updateSyncTimestamp(auth.user.uid, message.groupId);
    if (isSynced(message)) {
      await deleteMessageFunction({ messageId: message.id, groupId: message.groupId });
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
      text = await decrypt(message);
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

  return {
    messages,
    messageIdx,
    stop,
    attachListener,
    openStream,
    loadChunk,
    unload,
    encrypt,
    decrypt,
    send,
    pushToOutQueue,
    updateSync
  };
});
