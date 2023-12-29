import { defineStore } from 'pinia';
import {
  doc,
  setDoc,
  collection,
  where,
  query,
  getDocs,
  or,
  orderBy,
  limit,
  startAfter
} from 'firebase/firestore';

import { remoteDB } from '@/config/firebase';
import { useAuthStore } from './auth';

export const useRemoteDBStore = defineStore('database', () => {
  const authStore = useAuthStore();

  async function storeUserInfo(userInfo) {
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
  async function searchUsers(searchQ, lastDoc) {
    let q;
    if (lastDoc) {
      q = query(
        collection(remoteDB, 'users'),
        or(where('profile.name', '==', searchQ), where('profile.phone', '==', searchQ)),
        orderBy('profile.name'),
        startAfter(lastDoc),
        limit(10)
      );
    } else {
      q = query(
        collection(remoteDB, 'users'),
        or(where('profile.name', '==', searchQ), where('profile.phone', '==', searchQ)),
        orderBy('profile.name'),
        limit(10)
      );
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot;
  }

  return {
    storePublicKey,
    storeUserInfo,
    searchUsers
  };
});
