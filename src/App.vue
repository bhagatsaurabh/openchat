<script setup>
import { onBeforeMount } from 'vue';

import { usePreferencesStore } from '@/stores/preferences';
import MediaObserver from '@/components/MediaObserver/MediaObserver.vue';
import { openDB } from './stores/database';
import { registerPersistence } from './stores/driver';

const preferences = usePreferencesStore();

onBeforeMount(async () => {
  try {
    await openDB();
    await preferences.load();
    registerPersistence();
  } catch (error) {
    // TODO: error-handling
  }
})
</script>

<template>
  <MediaObserver />
  <RouterView />
</template>

<style scoped>
/*  */
</style>
