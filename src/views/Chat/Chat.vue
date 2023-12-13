<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';
import Button from '@/components/Common/Button/Button.vue';
import Header from '@/components/Common/Header/Header.vue';
import Modal from '@/components/Common/Modal/Modal.vue';
import Avatar from '@/components/Avatar/Avatar.vue';

const authStore = useAuthStore();
const router = useRouter();
const confirmSignOut = ref(null);

const handleSignOut = async () => {
  await authStore.signOut();
  router.push('/auth');
};
const handleSettings = () => {};
</script>

<template>
  <Header>
    <template #left>
      <Avatar />
    </template>
    <template #right>
      <Button
        class="mr-1"
        :size="1.5"
        icon="logout"
        @click="() => (confirmSignOut = true)"
        :complementary="false"
        visual
        circular
      />
      <Button :size="1.5" icon="cog" @click="() => handleSettings()" :complementary="false" visual circular />
    </template>
  </Header>
  <main class="chat-container">
    <Modal
      v-if="confirmSignOut"
      title="Sign out ?"
      :controls="['Cancel', 'Sign out']"
      @dismiss="() => (confirmSignOut = false)"
      @action="(action) => action === 'Sign out' && handleSignOut()"
    />
  </main>
</template>

<style scoped>
.chat-container {
  min-height: calc(100vh - var(--header-height));
  width: 100vw;
}
</style>
