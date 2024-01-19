import { defineStore } from 'pinia';
import {
  getBlob,
  getDownloadURL,
  getMetadata,
  ref,
  uploadBytes,
  uploadBytesResumable
} from 'firebase/storage';

import { storage } from '@/config/firebase';

export const useStorageStore = defineStore('storage', () => {
  async function uploadFile(blob, path, meta = {}) {
    const storageRef = ref(storage, path);

    try {
      return await uploadBytes(storageRef, blob, meta);
    } catch (error) {
      console.log(error);
    }
  }
  function uploadFileResumable(blob, path, meta = {}) {
    const storageRef = ref(storage, path);

    try {
      return uploadBytesResumable(storageRef, blob, meta);
    } catch (error) {
      console.log(error);
    }
  }
  async function getUrlFromPath(path) {
    const storageRef = ref(storage, path);
    try {
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.log(error);
    }
  }
  async function getUrlFromRef(ref) {
    try {
      return await getDownloadURL(ref);
    } catch (error) {
      console.log(error);
    }
  }
  async function downloadFile(path) {
    const storageRef = ref(storage, path);

    try {
      const meta = await getMetadata(storageRef);
      const name = meta.customMetadata.name;
      const blob = await getBlob(storageRef);
      return new File([blob], name, { type: blob.type });
    } catch (error) {
      console.log(error);
    }
  }

  return {
    uploadFile,
    uploadFileResumable,
    getUrlFromPath,
    getUrlFromRef,
    downloadFile
  };
});
