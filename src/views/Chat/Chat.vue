<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';
import Button from '@/components/Common/Button/Button.vue';
import Header from '@/components/Common/Header/Header.vue';
import Modal from '@/components/Common/Modal/Modal.vue';
import Avatar from '@/components/Common/Avatar/Avatar.vue';
import ChatSearch from '@/components/ChatSearch/ChatSearch.vue';
import ChatList from '@/components/ChatList/ChatList.vue';
import ChatSearchList from '@/components/ChatSearchList/ChatSearchList.vue';
import Tabs from '@/components/Common/Tabs/Tabs.vue';
import Profile from '@/components/Profile/Profile.vue';

const authStore = useAuthStore();
const router = useRouter();
const confirmSignOut = ref(null);
const showProfile = ref(false);
const activeTab = ref(0);
const query = ref('');
const tabs = ref([
  { name: 'My Chats', id: 'my-chats', icon: 'chats' },
  { name: 'Find', id: 'find', icon: 'globe' }
]);

const handleSignOut = async () => {
  await authStore.signOut();
  router.push('/auth');
};
const handleSettings = () => {};
const handleSelectExisting = (data) => {
  console.log(data);
};
const handleSelectNew = (data) => {
  console.log(data);
};

watch(query, () => {
  if (!query.value) activeTab.value = 0;
  else activeTab.value = 1;
});
</script>

<template>
  <Header border>
    <template #left>
      <Avatar class="ml-0p5" @open="showProfile = true" />
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
    <Tabs :tabs="tabs" :active="activeTab" :show-header="!!query" @change="(val) => (activeTab = val)">
      <template #my-chats>
        <ChatList :query="query" @select="handleSelectExisting" />
      </template>
      <template #find>
        <ChatSearchList :query="query" @select="handleSelectNew" />
      </template>
    </Tabs>
    <Profile v-if="showProfile" @back="() => (showProfile = false)" />
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
