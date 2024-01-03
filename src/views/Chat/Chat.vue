<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';
import { useRemoteDBStore } from '@/stores/database';
import Button from '@/components/Common/Button/Button.vue';
import Header from '@/components/Common/Header/Header.vue';
import Modal from '@/components/Common/Modal/Modal.vue';
import Avatar from '@/components/Common/Avatar/Avatar.vue';
import ChatSearch from '@/components/ChatSearch/ChatSearch.vue';
import ChatList from '@/components/ChatList/ChatList.vue';
import ChatSearchList from '@/components/ChatSearchList/ChatSearchList.vue';
import Tabs from '@/components/Common/Tabs/Tabs.vue';
import Profile from '@/components/Profile/Profile.vue';
import Backdrop from '@/components/Common/Backdrop/Backdrop.vue';
import Spinner from '@/components/Common/Spinner/Spinner.vue';
import { generateGroupKey } from '@/utils/crypto';

const auth = useAuthStore();
const db = useRemoteDBStore();
const router = useRouter();
const confirmSignOut = ref(null);
const showProfile = ref(false);
const activeTab = ref(0);
const query = ref('');
const tabs = ref([
  { name: 'My Chats', id: 'my-chats', icon: 'chats' },
  { name: 'Find', id: 'find', icon: 'globe' }
]);
const isBusy = ref(false);

const handleSignOut = async () => {
  await auth.signOut();
  router.push('/auth');
};
const handleSettings = () => {
  // TODO
};
const handleSelectExisting = (data) => {
  // TODO
};
const handleSelectNew = async (data) => {
  /*  TODO
      4. Create Group (Local) with remote id
      5. Create notification for other user
      6. Open newly created Group
  */
  isBusy.value = true;
  const publicKey = await db.getPublicKey(data.id);
  const encryptedKey = (await generateGroupKey([publicKey]))[0];
  const groupId = await db.createGroup({
    type: 'private',
    members: [auth.user.uid, data.id],
    admins: [auth.user.uid, data.id]
  });
};

watch(query, () => {
  if (!query.value) activeTab.value = 0;
  else activeTab.value = 1;
});
</script>

<template>
  <Backdrop :show="isBusy">
    <div class="wait">
      <Spinner :blob-count="4" />
      <h2>Creating your new chat</h2>
    </div>
  </Backdrop>
  <Header border>
    <template #left>
      <Avatar class="ml-0p5" @open="showProfile = true" :url="auth.profile?.avatarUrl" />
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

.wait {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
.wait h2 {
  font-weight: lighter;
  text-shadow: 0px 0px 4px var(--c-background-1);
}
</style>
