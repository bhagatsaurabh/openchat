import { defineStore } from 'pinia';
import { doc, setDoc } from 'firebase/firestore';

import { remoteDB } from '@/config/firebase';
import { useAuthStore } from './auth';

export const useRemoteDBStore = defineStore('database', () => {
  const authStore = useAuthStore();

  async function storePublicKey(publicKey) {
    try {
      await setDoc(doc(remoteDB, 'publicKeys', authStore.user.uid), publicKey);
    } catch (e) {
      console.error(e);
    }
  }

  return {
    storePublicKey
  };
});
