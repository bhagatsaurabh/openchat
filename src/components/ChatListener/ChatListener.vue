<script setup>
import { onBeforeUnmount, onMounted } from 'vue';

import { useEventsStore } from '@/stores/events';
import { useUsersStore } from '@/stores/users';
import { useGroupsStore } from '@/stores/groups';

const events = useEventsStore();
const users = useUsersStore();
const groups = useGroupsStore();

onMounted(async () => {
  events.listen();
  await users.listen();
  await groups.listen();
});
onBeforeUnmount(() => {
  events.stop();
  users.stop();
  groups.stop();
});
</script>

<template><slot></slot></template>
