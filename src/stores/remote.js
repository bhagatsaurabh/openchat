import { defineStore } from 'pinia';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';

import { remoteDB } from '@/config/firebase';
import { useAuthStore } from './auth';
import { fetchUsers } from '@/services/user-search';
import * as local from '@/database/driver';

export const useRemoteDBStore = defineStore('remote', () => {
  const auth = useAuthStore();

  async function storeUserInfo(userInfo) {
    if (!userInfo.phone) delete userInfo.phone;
    try {
      await setDoc(doc(remoteDB, 'users', auth.user.uid), userInfo);
      await local.updateProfile(userInfo);
    } catch (e) {
      console.log(e);
    }
  }
  async function updateProfile(profile) {
    try {
      await updateDoc(doc(remoteDB, 'users', auth.user.uid), profile);
      auth.profile = { ...auth.profile, ...profile };
      await local.updateProfile(auth.profile);
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
  async function createGroup({ name, type, members, admins, avatarUrl }) {
    const data = {
      name,
      members,
      admins,
      active: true,
      type,
      seen: { [auth.user.uid]: serverTimestamp() },
      sync: { [auth.user.uid]: serverTimestamp() },
      timestamp: serverTimestamp(),
      avatarUrl
    };
    const { id } = await addDoc(collection(remoteDB, 'groups'), data);
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
  async function deleteNotification(id) {
    await deleteDoc(doc(remoteDB, 'users', auth.user.uid, 'notify', id));
  }
  async function updateSeenTimestamp(uid, groupId) {
    try {
      await updateDoc(doc(remoteDB, 'groups', groupId), {
        [`seen.${uid}`]: serverTimestamp()
      });
    } catch (error) {
      console.log(error);
    }
  }
  async function updateSyncTimestamp(uid, groupId) {
    try {
      await updateDoc(doc(remoteDB, 'groups', groupId), {
        [`sync.${uid}`]: serverTimestamp()
      });
    } catch (error) {
      console.log(error);
    }
  }
  async function addNewMessage(docRef, message) {
    try {
      await setDoc(docRef, message);
    } catch (error) {
      console.log(error);
    }
  }
  async function updateGroup(group, groupId) {
    await updateDoc(doc(remoteDB, 'groups', groupId), group);
  }

  return {
    storePublicKey,
    storeUserInfo,
    searchUsers,
    updateProfile,
    getPublicKey,
    createGroup,
    notifyUserAdded,
    deleteNotification,
    updateSeenTimestamp,
    updateSyncTimestamp,
    addNewMessage,
    updateGroup
  };
});
