import { usePreferencesStore } from '@/stores/preferences';
import { closeDB, getSingleton, openDB, updateSingleton, db, getObject } from './database';
import { useAuthStore } from '@/stores/auth';

export const registerPersistence = () => {
  const preferencesStore = usePreferencesStore();
  preferencesStore.$subscribe(() => {
    updateSingleton('preferences', preferencesStore.serializableState);
  });
};

export const getPreferences = async () => {
  return await getSingleton('preferences');
};

export const createGroup = async (groupId) => {
  const auth = useAuthStore();
  closeDB();
  await openDB(db.version + 1, auth.user.uid, [groupId]);
};

export const getGroup = async ({ uid, groupId }) => {
  // await getObject(`group:${uid}:${groupId}`, );
};
