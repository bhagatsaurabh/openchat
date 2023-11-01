<script setup>
import { usePreferencesStore } from '@/stores/preferences';
import MediaObserver from '@/components/MediaObserver/MediaObserver.vue';

const preferences = usePreferencesStore();

preferences.load();
</script>

<template>
  <MediaObserver />
  <header>

  </header>

  <RouterView />
</template>

<style scoped>
/*  */
</style>
