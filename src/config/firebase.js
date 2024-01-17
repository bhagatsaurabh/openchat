import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import firebaseConfig from '../../key.json';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const remoteDB = getFirestore(app);
export const storage = getStorage(app);
const functions = getFunctions(app);
export const deleteMessageFunction = httpsCallable(functions, 'deleteMessage');

if (location.hostname === 'localhost') {
  connectFirestoreEmulator(remoteDB, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}
