<script setup>
import Button from '@/components/Common/Button/Button.vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
</script>

<template>The Chat component <Button @click="() => authStore.signOut()" accented>Sign Out</Button></template>

<style scoped></style>
