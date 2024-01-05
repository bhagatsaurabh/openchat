import { usePreferencesStore } from '@/stores/preferences';
import { getSingleton, updateSingleton, schemaChange, getAll, updateObject, getObject } from './database';
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
  delete group.active;
  await updateObject(`groups:${uid}`, group.id, group);
  await schemaChange(uid, group.id);
};
export const createGroupKey = async (uid, groupId, encryptedKey) => {
  const key = await getGroupKey(uid, encryptedKey);
  await updateObject(`keys:${uid}`, groupId, key);
};
export const getAllGroups = async (uid) => {
  return await getAll(`groups:${uid}`);
};
