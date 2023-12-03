import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyDFaXBHKkxy4XgFS1gKxCios8wJ4lZirdI',
  authDomain: 'openchat-a5cec.firebaseapp.com',
  projectId: 'openchat-a5cec',
  storageBucket: 'openchat-a5cec.appspot.com',
  messagingSenderId: '560810262596',
  appId: '1:560810262596:web:3163a79632565394743c11',
  measurementId: 'G-7N42Q3D25Y'
};

export const app = initializeApp(firebaseConfig);
