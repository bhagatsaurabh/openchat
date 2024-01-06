import { ref } from 'vue';
import { defineStore } from 'pinia';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

import { remoteDB } from '@/config/firebase';
import * as local from '@/database/driver';
import { Queue } from '@/utils/queue';
import { useAuthStore } from './auth';

export const useUsersStore = defineStore('users', () => {
  const auth = useAuthStore();
  const users = ref({});
  const unsubFns = ref([]);
  const busy = ref(false);
  const queue = new Queue();

  const listener = (snapshot) => {
    if (snapshot.exists()) {
      queue.push(snapshot.data());
      process();
    }
  };
  const process = async () => {
    if (busy.value) return;
    else {
      busy.value = true;
      let user;
      while ((user = queue.pop()) !== null) {
        await handleUser(user);
      }
      busy.value = false;
    }
  };
  const handleUser = async (user) => {
    await local.updateProfile(user);
    users.value[user.id] = user;
  };
  const handleError = (error) => console.log({ ...error });

  async function listen() {
    const localGroups = await local.getAllGroups(auth.user.uid);
    const userIds = localGroups
      .filter((group) => group.type === 'private' && group.id !== 'self')
      .map((group) => group.members[1]);

    userIds.forEach((id) => {
      const unsubscribe = onSnapshot(doc(remoteDB, 'users', id), listener, handleError);
      unsubFns.value.push(unsubscribe);
    });
  }
  function stop() {
    unsubFns.value.forEach((unsubscribe) => unsubscribe());
  }
  function attachListener(uid) {
    const unsubscribe = onSnapshot(doc(remoteDB, 'users', uid), listener, handleError);
    unsubFns.value.push(unsubscribe);
  }

  async function saveProfiles(uids = []) {
    const newUids = uids.filter((uid) => !users.value[uid]);
    let newUsers = await Promise.all(newUids.map((uid) => getDoc(doc(remoteDB, 'users', uid))));
    newUsers = newUsers.map((user) => user.data());
    await Promise.all(newUsers.map((user) => handleUser(user)));
  }
  function getNamesFromUIDs(userIds = []) {
    return userIds.map((uid) => users.value[uid].name);
  }

  return {
    users,
    saveProfiles,
    getNamesFromUIDs,
    listen,
    stop,
    attachListener
  };
});
