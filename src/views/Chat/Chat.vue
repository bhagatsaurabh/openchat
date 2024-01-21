<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';
import { useGroupsStore } from '@/stores/groups';
import { useEventsStore } from '@/stores/events';
import { useUsersStore } from '@/stores/users';
import { delay } from '@/utils/utils';
import Button from '@/components/Common/Button/Button.vue';
import Header from '@/components/Common/Header/Header.vue';
import Modal from '@/components/Common/Modal/Modal.vue';
import Avatar from '@/components/Common/Avatar/Avatar.vue';
import ChatSearch from '@/components/ChatSearch/ChatSearch.vue';
import ChatList from '@/components/ChatList/ChatList.vue';
import ChatSearchList from '@/components/ChatSearchList/ChatSearchList.vue';
import Tabs from '@/components/Common/Tabs/Tabs.vue';
import Profile from '@/components/Profile/Profile.vue';
import Settings from '@/components/Settings/Settings.vue';
import Backdrop from '@/components/Common/Backdrop/Backdrop.vue';
import Spinner from '@/components/Common/Spinner/Spinner.vue';
import CreateGroup from '@/components/CreateGroup/CreateGroup.vue';

const auth = useAuthStore();
const groupsStore = useGroupsStore();
const eventsStore = useEventsStore();
const usersStore = useUsersStore();
const router = useRouter();
const searchEl = ref(null);
const showConfirm = ref(null);
const showProfile = ref(false);
const showSettings = ref(false);
const showManage = ref(false);
const activeTab = ref(0);
const query = ref('');
const forceHeader = ref(false);
const tabs = ref([
  { name: 'My Chats', id: 'my-chats', icon: 'chats' },
  { name: 'Find', id: 'find', icon: 'globe' }
]);
const isBusy = ref(null);

const handleSignOut = async () => {
  await delay(10000);
  await auth.signOut();
  router.push('/auth');
};
const switchToGroup = async (id) => {
  await groupsStore.setActiveGroup(id);
  router.push({ path: '/chat' });
};
const handleCreateGroup = async (name, type, members, avatarUrl) => {
  const id = await groupsStore.createGroup({ name, type, members, avatarUrl });
  await switchToGroup(id);
};
const handleForceSearch = () => {
  activeTab.value = 1;
  forceHeader.value = true;
  searchEl.value.focus();
};
const handleSelfChat = async () => {
  const id = await groupsStore.createSelfGroup();
  switchToGroup(id);
};
const handleAction = (action) => {
  if (action === 'sign-out')
    showConfirm.value = { title: 'Sign out ?', buttonText: 'Sign out', action: handleSignOut };
  else if (action === 'add-group') {
    showManage.value = true;
  }
};

watch(query, () => {
  forceHeader.value = false;
  if (!query.value) activeTab.value = 0;
  else activeTab.value = 1;
});

let unregisterGuard = () => {};
onMounted(async () => {
  unregisterGuard = router.beforeEach((to, from, next) => {
    if (from.path === '/chat' && to.path === '/') {
      groupsStore.unsetActiveGroup();
    }
    next();
  });

  eventsStore.listen();
  await usersStore.listen();
  await groupsStore.listen();
});
onBeforeUnmount(() => {
  unregisterGuard();
  eventsStore.stop();
  usersStore.stop();
  groupsStore.stop();
});
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
        @click="() => handleAction('sign-out')"
        :complementary="false"
        circular
        flat
      />
      <Button
        class="chat-control mr-0p5"
        :size="1.3"
        icon="add-group"
        @click="() => handleAction('add-group')"
        :complementary="false"
        circular
        flat
      />
      <Button
        class="chat-control mr-0p5"
        :size="1.3"
        icon="cog"
        @click="showSettings = true"
        :complementary="false"
        circular
        flat
      />
    </template>
  </Header>
  <main class="chat-container">
    <Modal
      v-if="!!showConfirm"
      :title="showConfirm.title"
      :controls="[{ text: 'Cancel' }, { text: 'Yes', async: true, action: showConfirm.action }]"
      @dismiss="showConfirm = null"
    >
      {{ showConfirm.desc ?? 'Are you sure ?' }}
    </Modal>
    <ChatSearch ref="searchEl" @search="(val) => (query = val)" />
    <Tabs
      class="tabs"
      :tabs="tabs"
      :active="activeTab"
      :show-header="!!query || forceHeader"
      @change="(val) => (activeTab = val)"
    >
      <template #my-chats>
        <ChatList
          :groups="Object.values(groupsStore.groups)"
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
    <Settings
      v-if="showSettings"
      @back="() => (showSettings = false)"
      @logout="() => handleAction('sign-out')"
    />
    <CreateGroup v-if="showManage" @back="showManage = false" @open-search="handleForceSearch" />
  </main>
  <RouterView v-slot="{ Component }">
    <Transition name="fade-slide-rtr">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>

<style scoped>
.chat-container {
  height: calc(100vh - var(--header-height));
  width: 100vw;
  display: flex;
  flex-direction: column;
}
.chat-control:deep(img) {
  filter: invert(51%) sepia(3%) saturate(99%) hue-rotate(20deg) brightness(90%) contrast(88%);
}

.tabs {
  height: calc(100% - 3.25rem);
  flex: 1;
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
