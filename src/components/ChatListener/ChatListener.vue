<script setup>
import { collection, query, onSnapshot } from 'firebase/firestore';
import { onBeforeUnmount, onMounted, ref } from 'vue';

import { remoteDB } from '@/config/firebase';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const unsubscribe = ref(() => {});

const handleSetup = () => {
  const q = query(collection(remoteDB, 'users', auth.user.uid, 'notify'));
  unsubscribe.value = onSnapshot(
    q,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          console.log('Notification Added', change.doc.data());
        }
        if (change.type === 'removed') {
          console.log('Notification Removed', change.doc.data());
        }
      });
    },
    (error) => {
      console.log({ ...error });
    }
  );
};

onMounted(() => handleSetup());
onBeforeUnmount(() => unsubscribe.value());
</script>

<template><slot></slot></template>
