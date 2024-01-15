import { ref } from 'vue';
import { defineStore } from 'pinia';

import { useStorageStore } from './storage';
import { useAuthStore } from './auth';
import * as local from '@/database/driver';
import { getFileName } from '@/utils/utils';

export const useFilesStore = defineStore('files', () => {
  const storage = useStorageStore();
  const auth = useAuthStore();
  const files = ref({});

  async function getFile({ id, groupId }) {
    if (files.value[id]) return files.value[id];
    else return await loadFile(id, groupId);
  }
  async function loadFile(id, groupId) {
    let data = await local.getFile(id, groupId);
    if (!data) data = null;
    else data.decrypted = false;
    files.value[id] = data;
    return files.value[id];
  }
  function decrypted(id, decryptedFile) {
    if (files.value[id]) {
      files.value[id] = { ...files.value[id], file: decryptedFile, decrypted: true };
    }
  }
  async function saveFile(data, { id, groupId }) {
    await local.storeFile(data, id, groupId);
  }
  function addOriginalFile(file, { id }) {
    files.value[id] = { file, decrypted: true };
  }
  function addEncryptedFile({ iv, file }, { id }) {
    files.value[id] = { iv, file, decrypted: false };
  }
  async function upload(file, { id, groupId }) {
    return storage.uploadFile(
      file,
      `groups/${groupId}/${auth.user.uid}/${id}`,
      { contentType: file.type, customMetadata: { name: getFileName(file.name) } },
      true
    );
  }
  async function download({ groupId, by, id }) {
    return await storage.downloadFile(`groups/${groupId}/${by}/${id}`);
  }

  return {
    files,
    getFile,
    loadFile,
    decrypted,
    saveFile,
    addOriginalFile,
    addEncryptedFile,
    upload,
    download
  };
});
