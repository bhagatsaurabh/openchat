import { ref } from 'vue';
import { defineStore } from 'pinia';
import {
  getAuth,
  onAuthStateChanged,
  signInWithPhoneNumber,
  signInAnonymously,
  getAdditionalUserInfo
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { PhoneAuthProvider, linkWithCredential } from 'firebase/auth';

import { app, remoteDB } from '@/config/firebase';
import { useNotificationStore } from './notification';
import { useRecaptchaStore } from './recaptcha';
import { useRemoteDBStore } from '@/stores/remote';
import { generatePrivateKey } from '@/utils/crypto';
import * as local from '@/database/driver';
import { useUsersStore } from './users';

const auth = getAuth(app);
auth.useDeviceLanguage();

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const name = ref(null);
  const status = ref('pending');
  const unsubFn = ref(null);
  const encKey = ref(null);
  const profile = ref(null);

  const captcha = useRecaptchaStore();
  const notify = useNotificationStore();
  const remote = useRemoteDBStore();
  const users = useUsersStore();

  function setUser(signedInUser) {
    user.value = signedInUser;
  }
  function setStatus(inStatus) {
    status.value = inStatus;
  }
  function registerAuthListener() {
    if (unsubFn.value) return;

    const unsubscribe = onAuthStateChanged(auth, async (usr) => {
      if (usr) {
        setUser(usr);
        if (status.value !== 'signingIn') {
          await handleExistingUser();
          setStatus('signedin');
        }
      } else {
        setStatus('signedout');
      }
    });
    unsubFn.value = unsubscribe;
  }
  function deRegisterAuthListener() {
    unsubFn.value();
  }
  async function fetchUserProfile(uid) {
    const snap = await getDoc(doc(remoteDB, 'users', uid));
    profile.value = snap.data();
  }
  async function handleNewUser() {
    await local.storeUser(user.value.uid);
    const { key, publicKey } = await generatePrivateKey(user.value.uid);
    encKey.value = key.publicKey;
    await remote.storePublicKey(publicKey);
    await remote.storeUserInfo({
      name: name.value,
      avatarUrl: '',
      id: user.value.uid,
      phone: user.value.phoneNumber
    });
    await fetchUserProfile(user.value.uid);
    users.attachListener(user.value.uid);
  }
  async function handleExistingUser() {
    encKey.value = await local.getPublicKey(user.value.uid);
    await fetchUserProfile(user.value.uid);
    users.attachListener(user.value.uid);
  }
  async function signIn(type, options) {
    setStatus('signingIn');
    if (type === 'phone') {
      const { countryCode, phoneNum } = options;
      try {
        window.phoneConfirmation = await signInWithPhoneNumber(
          auth,
          `+${countryCode}${phoneNum}`,
          window.verifier
        );
      } catch (error) {
        window.grecaptcha.reset(captcha.widgetId);
        throw error;
      }
    } else if (type === 'phone-verify') {
      const { code } = options;
      const result = await window.phoneConfirmation?.confirm(code);
      if (getAdditionalUserInfo(result).isNewUser) {
        await handleNewUser();
      } else {
        await handleExistingUser();
      }
      setStatus('signedin');
    } else if (type === 'guest') {
      try {
        const result = await signInAnonymously(auth);
        if (getAdditionalUserInfo(result).isNewUser) {
          await handleNewUser();
        } else {
          await handleExistingUser();
        }
        setStatus('signedin');
      } catch (error) {
        console.log(error);
        notify.push({ type: 'snackbar', status: 'warn', message: 'Something went wrong, please try again' });
      }
    }
  }
  async function signOut() {
    try {
      await auth.signOut();
      user.value = null;
      name.value = null;
      encKey.value = null;
      profile.value = null;
    } catch (error) {
      console.log(error);
      notify.push({ type: 'snackbar', status: 'warn', message: 'Something went wrong, please try again' });
    }
  }
  async function verifyGuestUser(type, options) {
    if (type === 'phone') {
      const { countryCode, phone } = options;
      const provider = new PhoneAuthProvider(auth);
      try {
        const verificationId = await provider.verifyPhoneNumber(`+${countryCode}${phone}`, window.verifier);
        return verificationId;
      } catch (error) {
        window.grecaptcha.reset(captcha.widgetId);
        throw error;
      }
    } else if (type === 'code') {
      const { verificationId, code } = options;
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const { user } = await linkWithCredential(auth.currentUser, credential);
      setUser(user);
      await remote.updateProfile({ phone: user.phoneNumber });
      profile.value.phone = user.phoneNumber;
    }
  }
  async function linkGuestUser(cred) {
    try {
      await linkWithCredential(auth.currentUser, cred);
      return 'ok';
    } catch (error) {
      if (error.code === 'auth/phone-number-exists') {
        notify.push({ type: 'snackbar', status: 'warn', message: 'Phone number already exists.' });
        return 'fatal';
      } else {
        notify.push({ type: 'snackbar', status: 'warn', message: 'Something went wrong, please try again' });
      }
    }
    return 'failed';
  }

  return {
    user,
    name,
    status,
    encKey,
    profile,
    setUser,
    setStatus,
    registerAuthListener,
    deRegisterAuthListener,
    signIn,
    signOut,
    verifyGuestUser,
    linkGuestUser
  };
});
