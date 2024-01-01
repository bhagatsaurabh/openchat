import { defineStore } from 'pinia';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { storage } from '@/config/firebase';

export const useStorageStore = defineStore('storage', () => {
  async function uploadFile(blob, path, meta = {}) {
    const storageRef = ref(storage, path, meta);

    try {
      const snap = await uploadBytes(storageRef, blob);
      console.log(snap);
    } catch (error) {
      console.log(error);
    }
  }
  async function getUrl(path) {
    const storageRef = ref(storage, path);
    try {
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.log(error);
    }
  }

  return {
    uploadFile,
    getUrl
  };
});
