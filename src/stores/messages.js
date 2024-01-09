import { ref } from 'vue';
import { defineStore } from 'pinia';

import { useAuthStore } from './auth';
import * as local from '@/database/driver';
import { useRemoteDBStore } from './remote';
import { Queue } from '@/utils/queue';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { deleteMessageFunction, remoteDB } from '@/config/firebase';
import { LinkedList } from '@/utils/linked-list';
import { msInAnHour } from '@/utils/constants';
import { useGroupsStore } from './groups';

export const useMessagesStore = defineStore('messages', () => {
  const auth = useAuthStore();
  const remote = useRemoteDBStore();
  const groups = useGroupsStore();
  const messages = ref({});
  const messageIdx = ref({});
  const unsubFns = ref({});
  const busy = ref(false);
  const cursor = ref(null);
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
  const handleMessage = async (message) => {
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
  function startLoad(groupId) {
    if (cursor.value) stopLoad();
    // TODO
  }
  function loadNext() {
    if (!cursor.value) return;
    // TODO
  }
  function stopLoad() {
    if (!cursor.value) return;
    // TODO
  }

  return {
    stop,
    attachListener,
    startLoad,
    stopLoad,
    loadNext
  };
});
