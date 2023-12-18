import { updateObject } from '@/database/database';

const crypto = window.crypto.subtle;

export const generatePrivateKey = async () => {
  const key = await crypto.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-512'
    },
    false,
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
  );

  const publicKey = await crypto.exportKey('jwk', key.publicKey);

  await updateObject('keys', key.privateKey, 'private');
  await updateObject('keys', key.publicKey, 'public');

  return { key, publicKey };
};

export const importPublicKey = async (data) => {
  return await crypto.importKey('jwk', data, { name: 'RSA-OAEP', hash: 'SHA-512' }, true, []);
};

export const generateGroupKey = async (publicKeys) => {
  let groupKey = await crypto.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['wrapKey', 'encrypt', 'decrypt']
  );

  // publicKeys are RSA public keys of every member of the group

  const wrappedGroupKeys = [];
  for (const publicKey of publicKeys) {
    wrappedGroupKeys.push(await crypto.wrapKey('jwk', groupKey, publicKey, { name: 'RSA-OAEP' }));
  }

  groupKey = undefined;

  return wrappedGroupKeys;
};

export const getGroupKey = async (wrappedKey, privateKey) => {
  return await crypto.unwrapKey(
    'jwk',
    wrappedKey,
    privateKey,
    { name: 'RSA-OAEP' },
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
};
