<script setup>
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';

import { usePreferencesStore } from '@/stores/preferences';
import MediaObserver from '@/components/MediaObserver/MediaObserver.vue';

const preferences = usePreferencesStore();

preferences.load();

const route = useRoute();
const path = computed(() => route.path);
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
