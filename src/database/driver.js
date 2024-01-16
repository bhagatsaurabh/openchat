import { usePreferencesStore } from '@/stores/preferences';
import {
  getSingleton,
  updateSingleton,
  schemaChange,
  getAll,
  updateObject,
  getObject,
  deleteObject,
  getAllKeys
} from './database';
import { importGroupKey } from '@/utils/crypto';

export const registerPreferencesPersistence = () => {
  const preferencesStore = usePreferencesStore();
  return preferencesStore.$subscribe(() => {
    updateSingleton('preferences', preferencesStore.serializableState);
  });
};
export const getPreferences = async () => {
  return await getSingleton('preferences');
};

export const storeUser = async (uid) => {
  await schemaChange(uid);
};
export const storeKey = async (uid, key) => {
  await updateObject(`keys:${uid}`, 'private', key.privateKey);
  await updateObject(`keys:${uid}`, 'public', key.publicKey);
};
export const getPublicKey = async (uid) => {
  return await getObject(`keys:${uid}`, 'public');
};
export const getPrivateKey = async (uid) => {
  return await getObject(`keys:${uid}`, 'private');
};

export const updateGroup = async (uid, groupId, group) => {
  let newGroup = group;
  let existingGroup = await getGroup(uid, groupId);
  if (existingGroup) {
    newGroup = { ...existingGroup, ...group };
  }
  await updateObject(`groups:${uid}`, groupId, newGroup);
};
export const storeGroupKey = async (uid, groupId, encryptedKey) => {
  const key = await importGroupKey(uid, encryptedKey);
  await updateObject(`keys:${uid}`, groupId, key);
};
export const deleteGroupKey = async (uid, groupId) => {
  await deleteObject(`keys:${uid}`, groupId);
};
export const getGroupKey = async (uid, groupId) => {
  return await getObject(`keys:${uid}`, groupId);
};
export const getGroup = async (uid, groupId) => {
  return await getObject(`groups:${uid}`, groupId);
};
export const getAllGroups = async (uid) => {
  return await getAll(`groups:${uid}`);
};
export const getAllGroupIds = async (uid) => {
  return await getAllKeys(`groups:${uid}`);
};

export const updateProfile = async (profile) => {
  await updateObject('profiles', profile.id, profile);
};
export const getProfile = async (id) => {
  return await getObject('profiles', id);
};
export const getAllProfiles = async () => {
  return await getAll('profiles');
};

export const storeMessage = async (message, groupId) => {
  if (message.local?.docRef) {
    message = { ...message };
    message.local.docRef = { id: message.local.docRef.id };
  }
  await updateObject(`messages:${groupId}`, message.id, message);
};
export const getMessage = async (messageId, groupId) => {
  return await getObject(`messages:${groupId}`, messageId);
};
export const deleteMessage = async (messageId, groupId) => {
  await deleteObject(`messages:${groupId}`, messageId);
};

export const storeFile = async (data, id, groupId) => {
  await updateObject(`files:${groupId}`, id, data);
};
export const getFile = async (id, groupId) => {
  return await getObject(`files:${groupId}`, id);
};
export const deleteFile = async (id, groupId) => {
  await deleteObject(`files:${groupId}`, id);
};
