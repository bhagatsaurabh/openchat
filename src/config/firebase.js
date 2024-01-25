import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectDatabaseEmulator, getDatabase } from 'firebase/database';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';

export const app = initializeApp(JSON.parse(import.meta.env.VITE_OPENCHAT_PUBLIC_KEY));
export const auth = getAuth(app);
export const remoteDB = getFirestore(app);
export const storage = getStorage(app);
const functions = getFunctions(app);
export const rtdb = getDatabase(app);
export const deleteMessageFunction = httpsCallable(functions, 'deleteMessage');

if (JSON.parse(import.meta.env.VITE_EMULATION_ENABLED) === true) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(remoteDB, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  connectDatabaseEmulator(rtdb, '127.0.0.1', 9000);
}
