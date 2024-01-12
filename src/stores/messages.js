import { ref } from 'vue';
import { defineStore } from 'pinia';

import { useAuthStore } from './auth';
import * as local from '@/database/driver';
import { useRemoteDBStore } from './remote';
import { Queue } from '@/utils/queue';
import { Timestamp, collection, doc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { deleteMessageFunction, remoteDB } from '@/config/firebase';
import { LinkedList } from '@/utils/linked-list';
import { msInAnHour } from '@/utils/constants';
import { useGroupsStore } from './groups';
import { stream } from '@/database/database';
import { decryptText, encryptText } from '@/utils/crypto';

export const useMessagesStore = defineStore('messages', () => {
  const auth = useAuthStore();
  const remote = useRemoteDBStore();
  const groups = useGroupsStore();
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
      while ((message = queue.pop()) !== null) {
        await handleOutMessage(message);
      }
      outBusy.value = false;
    }
  };
  const handleOutMessage = async (message) => {
    message.text = await encrypt(message.type, message.text);
    const msg = {
      by: message.by,
      timestamp: message.groupId === 'self' ? new Date() : serverTimestamp(),
      text: message.text,
      type: message.type
    };
    if (message.groupId !== 'self') {
      msg.expiry = Timestamp.fromDate(new Date(Date.now() + 864000000));
      await remote.addNewMessage(message.docRef, msg);
    } else {
      msg.id = message.id;
      await local.storeMessage(msg, groups.activeGroup.id);
    }
  };
  const handleMessage = async (message) => {
    if (outQueueIdx.value[message.id]) {
      if (!message.type.startsWith('meta')) {
        messageIdx.value[message.groupId][message.id].local = null;
        await local.storeMessage(message);
      }
      outQueueIdx.value[message.id] = undefined;
      return;
    }
    message.timestamp = message.timestamp?.toDate();
    if (message.type === 'meta:edit') {
      const existingMsg = await local.getMessage(message.ref, message.groupId);
      if (existingMsg && (message.timestamp - existingMsg.timestamp) / msInAnHour <= 24) {
        await local.storeMessage(message, message.groupId);
        updateMessage(message);
      }
    } else if (message.type === 'meta:delete') {
      const existingMsg = await local.getMessage(message.ref, message.groupId);
      if (existingMsg && (message.timestamp - existingMsg.timestamp) / msInAnHour <= 24) {
        await local.deleteMessage(message.ref, message.groupId);
        removeMessage(message);
      }
    } else {
      await local.storeMessage(message, message.groupId);
      addMessage(message);
    }
    await remote.updateSyncTimestamp(auth.user.uid, message.groupId);
    if (isSynced(message)) {
      await deleteMessageFunction({ messageId: message.id, groupId: message.groupId });
    }
  };
  const handleError = (error) => console.log({ ...error });
  function stop() {
    Object.values(unsubFns.value).forEach((unsubscribe) => unsubscribe());
  }
  function attachListener(groupId) {
    if (!unsubFns.value[groupId]) {
      const unsubscribe = onSnapshot(
        query(collection(remoteDB, 'groups', groupId, 'messages')),
        listener,
        handleError
      );
      unsubFns.value[groupId] = unsubscribe;
    }
  }
  function addMessage(message) {
    const list = messages.value[message.groupId];
    const index = messageIdx.value[message.groupId];
    if (list && index) {
      const node = messages.value[message.groupId].pushTail(message);
      messageIdx.value[message.groupId][message.id] = node;
    } else {
      messages.value[message.groupId] = new LinkedList();
      messageIdx.value[message.groupId] = {};
      const node = messages.value[message.groupId].pushTail(message);
      messageIdx.value[message.groupId][message.id] = node;
    }
  }
  function loadOldMessage(message) {
    const list = messages.value[message.groupId];
    const index = messageIdx.value[message.groupId];
    if (list && index) {
      const node = messages.value[message.groupId].pushHead(message);
      messageIdx.value[message.groupId][message.id] = node;
    } else {
      messages.value[message.groupId] = new LinkedList();
      messageIdx.value[message.groupId] = {};
      const node = messages.value[message.groupId].pushHead(message);
      messageIdx.value[message.groupId][message.id] = node;
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
  async function openStream(groupId) {
    const iterator = stream(`messages:${groupId}`, 'timestamp');
    streams.value[groupId] = iterator;
    await loadChunk();
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
  async function encrypt(type, value) {
    if (type === 'text') {
      return await encryptText(value, groups.activeGroupKey);
    }
  }
  async function decrypt(type, cipher) {
    if (type === 'text') {
      return await decryptText(cipher, groups.activeGroupKey);
    }
  }
  async function send(type, value) {
    const docRef = doc(collection(remoteDB, 'groups', groups.activeGroup.id, 'messages'));
    const message = {
      id: docRef.id,
      groupId: groups.activeGroup.id,
      by: auth.user.uid,
      timestamp: new Date(),
      type,
      text: value,
      local: { status: 'pending', docRef }
    };
    if (type === 'text') {
      addMessage(message);
      await local.storeMessage(message, groups.activeGroup.id);
      outQueue.push(message);
      outQueueIdx.value[docRef.id] = message;
      processOutQueue();
    }
  }

  return {
    messages,
    messageIdx,
    stop,
    attachListener,
    openStream,
    encrypt,
    decrypt,
    send
  };
});
