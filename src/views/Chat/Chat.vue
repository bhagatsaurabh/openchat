<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';
import Button from '@/components/Common/Button/Button.vue';
import Header from '@/components/Common/Header/Header.vue';
import Modal from '@/components/Common/Modal/Modal.vue';
import Avatar from '@/components/Avatar/Avatar.vue';
import ChatSearch from '@/components/ChatSearch/ChatSearch.vue';

const authStore = useAuthStore();
const router = useRouter();
const confirmSignOut = ref(null);
const query = ref('');

const handleSignOut = async () => {
  await authStore.signOut();
  router.push('/auth');
};
const handleSettings = () => {};
</script>

<template>
  <Header border>
    <template #left>
      <Avatar class="ml-0p5" />
    </template>
    <template #right>
      <Button
        class="chat-control mr-0p5"
        :size="1.3"
        icon="logout"
        @click="() => (confirmSignOut = true)"
        :complementary="false"
        circular
        flat
      />
      <Button
        class="chat-control mr-0p5"
        :size="1.3"
        icon="cog"
        @click="() => handleSettings()"
        :complementary="false"
        circular
        flat
      />
    </template>
  </Header>
  <main class="chat-container">
    <Modal
      v-if="confirmSignOut"
      title="Sign out ?"
      :controls="['Cancel', 'Sign out']"
      @dismiss="() => (confirmSignOut = false)"
      @action="(action) => action === 'Sign out' && handleSignOut()"
    >
      Are you sure ?
    </Modal>
    <ChatSearch @search="(val) => (query = val)" />
  </main>
</template>

<style scoped>
.chat-container {
  min-height: calc(100vh - var(--header-height));
  width: 100vw;
}
.chat-control:deep(img) {
  filter: invert(51%) sepia(3%) saturate(99%) hue-rotate(20deg) brightness(90%) contrast(88%);
}
</style>
