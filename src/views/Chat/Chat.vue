<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';
import { useRemoteDBStore } from '@/stores/remote';
import { useGroupsStore } from '@/stores/groups';
import { generateGroupKey, importPublicKey } from '@/utils/crypto';
import { bufToBase64 } from '@/utils/utils';
import * as local from '@/database/driver';
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
import ChatListener from '@/components/ChatListener/ChatListener.vue';

const auth = useAuthStore();
const remote = useRemoteDBStore();
const groupsStore = useGroupsStore();
const router = useRouter();
const confirmSignOut = ref(null);
const showProfile = ref(false);
const activeTab = ref(0);
const query = ref('');
const forceHeader = ref(false);
const tabs = ref([
  { name: 'My Chats', id: 'my-chats', icon: 'chats' },
  { name: 'Find', id: 'find', icon: 'globe' }
]);
const isBusy = ref(null);

const handleSignOut = async () => {
  await auth.signOut();
  router.push('/auth');
};
const handleSettings = () => {
  // TODO: Handle settings panel
};
const switchToGroup = (id) => {
  groupsStore.setActiveGroup(id);
  router.push({ path: '/chat' });
};
const handleCreateGroup = async (name, type, members, avatarUrl) => {
  const id = await groupsStore.createGroup({ name, type, members, avatarUrl });
  switchToGroup(id);
};
const handleForceSearch = () => {
  activeTab.value = 1;
  forceHeader.value = true;
};
const handleSelfChat = async () => {
  const id = await groupsStore.createSelfGroup();
  switchToGroup(id);
};

watch(query, () => {
  forceHeader.value = false;
  if (!query.value) activeTab.value = 0;
  else activeTab.value = 1;
});

let unregisterGuard = () => {};
onMounted(() => {
  unregisterGuard = router.beforeEach((to, from, next) => {
    if (from.path === '/chat' && to.path === '/') {
      groupsStore.activeGroup = null;
    }
    next();
  });
});
onBeforeUnmount(unregisterGuard);
</script>

<template>
  <Backdrop :show="!!isBusy">
    <div class="wait">
      <Spinner :blob-count="4" />
      <h2>{{ isBusy }}</h2>
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
    <Tabs
      :tabs="tabs"
      :active="activeTab"
      :show-header="!!query || forceHeader"
      @change="(val) => (activeTab = val)"
    >
      <template #my-chats>
        <ChatList
          :groups="groupsStore.groups"
          :query="query"
          @select="(id) => switchToGroup(id)"
          @open-search="handleForceSearch"
          @self-chat="handleSelfChat"
        />
      </template>
      <template #find>
        <ChatSearchList
          :query="query"
          @select="(otherUser) => handleCreateGroup(otherUser.name, 'private', [auth.profile, otherUser])"
        />
      </template>
    </Tabs>
    <Profile v-if="showProfile" @back="() => (showProfile = false)" />
    <ChatListener @init-status="(msg) => (isBusy = msg)" />
  </main>
  <RouterView v-slot="{ Component }">
    <Transition name="fade-slide-rtr">
      <component :is="Component" />
    </Transition>
  </RouterView>
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
