import * as local from '@/database/driver';
import { base64ToBuf, bufToBase64 } from './utils';

const crypto = window.crypto.subtle;

export const generatePrivateKey = async (uid) => {
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

  await local.storeKey(uid, key);

  return { key, publicKey };
};

export const importPublicKey = async (data) => {
  const key = await crypto.importKey('jwk', data, { name: 'RSA-OAEP', hash: 'SHA-512' }, true, [
    'wrapKey',
    'encrypt'
  ]);
  return key;
};

export const generateGroupKey = async (publicKeys = []) => {
  let groupKey = await crypto.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['wrapKey', 'encrypt', 'decrypt']
  );

  // publicKeys are RSA public keys of every member of the group

  const wrappedGroupKeys = await Promise.all(
    publicKeys.map((publicKey) => crypto.wrapKey('jwk', groupKey, publicKey, { name: 'RSA-OAEP' }))
  );

  groupKey = undefined;

  return wrappedGroupKeys;
};

export const importGroupKey = async (uid, wrappedKey) => {
  return await crypto.unwrapKey(
    'jwk',
    wrappedKey,
    await local.getPrivateKey(uid),
    { name: 'RSA-OAEP' },
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
};

// string to (plain:ArrayBuffer to cipher:ArrayBuffer) to base64
export const encryptText = async (text, key) => {
  const encoded = new TextEncoder().encode(text);
  let iv = window.crypto.getRandomValues(new Uint8Array(12));
  let cipher = await crypto.encrypt({ name: 'AES-GCM', iv: iv }, key, encoded);
  iv = iv.buffer;
  [cipher, iv] = await Promise.all([cipher, iv].map((input) => bufToBase64(input)));

  return `${iv}#${cipher}`;
};
// base64 to (cipher:ArrayBuffer to plain:ArrayBuffer) to string
export const decryptText = async (encryptedText, key) => {
  let cipher = encryptedText.substring(0, encryptedText.indexOf('#'));
  let iv = encryptedText.substring(encryptedText.indexOf('#') + 1);
  [cipher, iv] = await Promise.all([cipher, iv].map((input) => base64ToBuf(input)));
  let text = await crypto.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, new Uint8Array(cipher));

  return new TextDecoder().decode(text);
};
