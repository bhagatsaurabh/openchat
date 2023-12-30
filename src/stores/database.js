import { defineStore } from 'pinia';
import { doc, setDoc } from 'firebase/firestore';

import { remoteDB } from '@/config/firebase';
import { useAuthStore } from './auth';
import { fetchUsers } from '@/services/user-search';

export const useRemoteDBStore = defineStore('database', () => {
  const authStore = useAuthStore();

  async function storeUserInfo(userInfo) {
    if (!userInfo.phone) delete userInfo.phone;
    try {
      await setDoc(doc(remoteDB, 'users', authStore.user.uid), userInfo);
    } catch (e) {
      console.log(e);
    }
  }
  async function storePublicKey(publicKey) {
    try {
      await setDoc(doc(remoteDB, 'publicKeys', authStore.user.uid), publicKey);
    } catch (e) {
      console.error(e);
    }
  }
  async function searchUsers(searchQ, page) {
    try {
      const data = await (await fetchUsers(searchQ, page)).json();
      return { users: data.hits, nbPages: data.nbPages };
    } catch (error) {
      console.log(error);
    }
  }

  return {
    storePublicKey,
    storeUserInfo,
    searchUsers
  };
});
