import { defineStore } from 'pinia';
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { remoteDB } from '@/config/firebase';
import { useAuthStore } from './auth';
import { fetchUsers } from '@/services/user-search';

export const useRemoteDBStore = defineStore('database', () => {
  const auth = useAuthStore();

  async function storeUserInfo(userInfo) {
    if (!userInfo.phone) delete userInfo.phone;
    try {
      await setDoc(doc(remoteDB, 'users', auth.user.uid), userInfo);
    } catch (e) {
      console.log(e);
    }
  }
  async function updateProfile(profile) {
    try {
      await updateDoc(doc(remoteDB, 'users', auth.user.uid), profile);
      return true;
    } catch (error) {
      console.log(error);
    }
    return false;
  }
  async function storePublicKey(publicKey) {
    try {
      await setDoc(doc(remoteDB, 'publicKeys', auth.user.uid), publicKey);
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
  async function getPublicKey(id) {
    try {
      const snap = await getDoc(doc(remoteDB, 'publicKeys', id));
      return snap.data();
    } catch (error) {
      console.log(error);
    }
  }
  async function createGroup({ type, members, admins }) {
    const { id } = await addDoc(collection(remoteDB, 'groups'), {
      members,
      admins,
      active: true,
      type,
      seen: { [auth.user.uid]: serverTimestamp() },
      timestamp: serverTimestamp()
    });
    return id;
  }
  async function notifyUserAdded({ uid, groupId, encryptedKey }) {
    const { id } = await addDoc(collection(remoteDB, 'users', uid, 'notify'), {
      type: 'group:add',
      payload: {
        id: groupId,
        encryptedKey
      },
      by: auth.user.uid
    });
    return id;
  }

  return {
    storePublicKey,
    storeUserInfo,
    searchUsers,
    updateProfile,
    getPublicKey,
    createGroup,
    notifyUserAdded
  };
});
