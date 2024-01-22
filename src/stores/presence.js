import { ref } from 'vue';
import { defineStore } from 'pinia';
import { serverTimestamp, ref as rtdbRef, onValue, onDisconnect, set } from 'firebase/database';

import { useAuthStore } from './auth';
import { rtdb } from '@/config/firebase';

export const usePresenceStore = defineStore('presence', () => {
  const auth = useAuthStore();
  const isOnline = ref(false);

  function listen() {
    const uid = auth.user.uid;
    const userStatusDatabaseRef = rtdbRef(rtdb, '/status/' + uid);

    const isOfflineForDatabase = {
      state: 'offline',
      last_changed: serverTimestamp()
    };
    const isOnlineForDatabase = {
      state: 'online',
      last_changed: serverTimestamp()
    };

    onValue(rtdbRef(rtdb, '.info/connected'), (snapshot) => {
      isOnline.value = snapshot.val();
      if (!isOnline.value) return;

      onDisconnect(userStatusDatabaseRef)
        .set(isOfflineForDatabase)
        .then(() => {
          isOnline.value = true;
          set(userStatusDatabaseRef, isOnlineForDatabase);
        });
    });
  }

  return {
    isOnline,
    listen
  };
});
