import { ref } from 'vue';
import { defineStore } from 'pinia';

import { useAuthStore } from './auth';
import * as local from '@/database/driver';
import { useRemoteDBStore } from './remote';
import { Queue } from '@/utils/queue';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { remoteDB } from '@/config/firebase';
import { useUsersStore } from './users';

export const useMessagesStore = defineStore('messages', () => {
  const auth = useAuthStore();
  const remote = useRemoteDBStore();
  const users = useUsersStore();
  const messages = ref([]);
  const messageIdxs = ref({});
  const unsubFns = ref([]);
  const busy = ref(false);
  const queue = new Queue();

  const listener = (snapshot) => {
    const changes = snapshot.docChanges().filter((change) => change.type === 'added');
    changes.forEach((change) => {
      const data = change.doc.data();
      data.id = change.doc.id;
      data.groupId = change.doc.ref.path.substring(change.doc.ref.path.indexOf('messages'));
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
    if (message.type === 'meta:edit') {
      // Edit Message
    } else if (message.type === 'meta:delete') {
      // Delete Message
    } else {
      local.storeMessage(message, message.groupId);
      // Store in memory
      // Update seen timestamp in remote group document
    }
  };
  const handleError = (error) => console.log({ ...error });

  async function listen() {
    const localGroups = await local.getAllGroups(auth.user.uid);
    localGroups
      .filter((group) => group.active && group.id !== 'self')
      .forEach((group) => {
        const unsubscribe = onSnapshot(
          query(collection(remoteDB, 'groups', group.id, 'messages')),
          listener,
          handleError
        );
        unsubFns.value.push(unsubscribe);
      });
  }
  function stop() {
    unsubFns.value.forEach((unsubscribe) => unsubscribe());
  }

  return {
    listen,
    stop
  };
});
