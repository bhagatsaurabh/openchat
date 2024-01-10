import { ref } from 'vue';
import { defineStore } from 'pinia';
import { collection, onSnapshot, query } from 'firebase/firestore';

import { useAuthStore } from './auth';
import { remoteDB } from '@/config/firebase';
import { Queue } from '@/utils/queue';
import { useGroupsStore } from './groups';

export const useEventsStore = defineStore('events', () => {
  const auth = useAuthStore();
  const groups = useGroupsStore();
  const unsubscribe = ref(() => {});
  const busy = ref(false);
  const queue = new Queue();

  const listener = (snapshot) => {
    const changes = snapshot.docChanges().filter((change) => change.type === 'added');
    for (const change of changes) {
      const data = change.doc.data();
      data.id = change.doc.id;
      queue.push(data);
    }
    process();
  };
  const process = async () => {
    if (busy.value) return;
    else {
      busy.value = true;
      let notification;
      while ((notification = queue.pop()) !== null) {
        await handleNotification(notification);
      }
      busy.value = false;
    }
  };
  const handleNotification = async (notification) => {
    if (notification.type === 'group:add') {
      await groups.userAdded(notification);
    } else if (notification.type === 'group:remove') {
      await groups.userRemoved(notification);
    }
  };
  const handleError = (error) => console.log({ ...error });

  function listen() {
    const unsub = onSnapshot(
      query(collection(remoteDB, 'users', auth.user.uid, 'notify')),
      listener,
      handleError
    );
    unsubscribe.value = unsub;
  }
  function stop() {
    unsubscribe.value();
  }

  return {
    listen,
    stop
  };
});
