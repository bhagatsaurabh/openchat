import { usePreferencesStore } from '@/stores/preferences';
import { getSingleton, updateSingleton } from './database';

export const registerPersistence = () => {
  const preferencesStore = usePreferencesStore();
  preferencesStore.$subscribe(() => {
    updateSingleton('preferences', preferencesStore.serializableState);
  });
};

export const getPreferences = async () => {
  return await getSingleton('preferences');
};
