import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import firebaseConfig from '../../key.json';

export const app = initializeApp(firebaseConfig);
export const remoteDB = getFirestore(app);
export const storage = getStorage(app);
const functions = getFunctions(app);
export const deleteMessageFunction = httpsCallable(functions, 'deleteMessage');
