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
import { getGroupKey } from '@/utils/crypto';

export const getPreferences = async () => {
  return await getSingleton('preferences');
};
export const registerPersistence = () => {
  const preferencesStore = usePreferencesStore();
  preferencesStore.$subscribe(() => {
    updateSingleton('preferences', preferencesStore.serializableState);
  });
};

export const createUser = async (uid) => {
  await schemaChange(uid);
};
export const createKey = async (uid, key) => {
  await updateObject(`keys:${uid}`, 'private', key.privateKey);
  await updateObject(`keys:${uid}`, 'public', key.publicKey);
};
export const getPublicKey = async (uid) => {
  return await getObject(`keys:${uid}`, 'public');
};
export const getPrivateKey = async (uid) => {
  return await getObject(`keys:${uid}`, 'private');
};

export const createGroup = async (uid, group) => {
  // Remove non-relevant data
  delete group.seen;
  await updateObject(`groups:${uid}`, group.id, group);
  await schemaChange(uid, group.id);
};
export const updateGroup = async (uid, groupId, group) => {
  let existingGroup = await getGroup(uid, groupId);
  existingGroup = { ...existingGroup, ...group };
  await updateObject(`groups:${uid}`, groupId, existingGroup);
};
export const createGroupKey = async (uid, groupId, encryptedKey) => {
  const key = await getGroupKey(uid, encryptedKey);
  await updateObject(`keys:${uid}`, groupId, key);
};
export const deleteGroupKey = async (uid, groupId) => {
  await deleteObject(`keys:${uid}`, groupId);
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
