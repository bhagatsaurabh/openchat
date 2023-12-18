import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../key.json';

export const app = initializeApp(firebaseConfig);
export const remoteDB = getFirestore(app);
