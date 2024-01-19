<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useGroupsStore } from '@/stores/groups';
import { useUsersStore } from '@/stores/users';
import { useMessagesStore } from '@/stores/messages';
import { useAuthStore } from '@/stores/auth';
import { throttle } from '@/utils/utils';
import Avatar from '@/components/Common/Avatar/Avatar.vue';
import Header from '@/components/Common/Header/Header.vue';
import Footer from '@/components/Common/Footer/Footer.vue';
import Options from '@/components/Common/Options/Options.vue';
import Button from '@/components/Common/Button/Button.vue';
import TextArea from '@/components/Common/TextArea/TextArea.vue';
import Message from '@/components/Message/Message.vue';
import Spinner from '@/components/Common/Spinner/Spinner.vue';
import Modal from '@/components/Common/Modal/Modal.vue';

const groups = useGroupsStore();
const users = useUsersStore();
const messagesStore = useMessagesStore();
const auth = useAuthStore();
const router = useRouter();
const group = ref(groups.activeGroup);
const containerEl = ref(null);
const attachEl = ref(null);
const listEl = ref(null);
const message = ref(null);
const busy = ref(false);
const busyNextChunk = ref(false);
const showModal = ref(null);
const names = computed(() =>
  group.value.id === 'self' ? group.value.name : users.getNamesFromUIDs(group.value.members).join(', ')
);
const avatarUrl = computed(() => {
  let url = group.value.avatarUrl;
  if (group.value.id === 'self') url = auth.profile?.avatarUrl;
  else if (group.value.type === 'private') {
    const otherUserId = group.value.members.find((id) => id !== auth.user.uid);
    url = users.users[otherUserId]?.avatarUrl;
  }
  return url || `/assets/icons/avatar${group.value.type === 'broadcast' ? '-group' : ''}.png`;
});

const handleLoad = () => {
  if (!groups.activeGroup) return;

  if (group.value.id !== groups.activeGroup.id) {
    group.value = groups.activeGroup;
  }
};
const handleGroupOption = (option) => {
  if (option === 'Profile') {
    router.push('/chat/profile');
  } else if (option === 'Leave') {
    // TODO
    // groups.leave(group.value.id);
  }
};
const handleAttachOption = (option) => {
  let accept = 'image/*,video/*,audio/*';
  if (option.text === 'Document') accept = '*';
  attachEl.value.accept = accept;
  attachEl.value.click();
};
const handleFile = async (e) => {
  if (e.target.files[0]) {
    await handleSend(e.target.files[0]);
  }
};
const handleSend = async (content) => {
  if (!content) return;

  busy.value = true;
  if (typeof content === 'string') {
    if (!content.trim()) return;
    await messagesStore.send('text', content);
    message.value = null;
  } else {
    if (content.size > 31457280) {
      showModal.value = {
        title: 'File is too large',
        controls: [{ text: 'Okay' }],
        desc: 'Files with sizes up to 30MB can be shared at the moment'
      };
    } else await messagesStore.send('file', content);
  }
  busy.value = false;
  containerEl.value.scrollTo(0, containerEl.value.scrollHeight);
};
const handleScroll = async () => {
  if (busyNextChunk.value || !listEl.value || !containerEl.value) return;
  const delta = listEl.value.clientHeight - containerEl.value.clientHeight;
  if (delta > 0 && Math.abs(containerEl.value.scrollTop) >= delta * 0.75) {
    busyNextChunk.value = true;
    await messagesStore.loadChunk(groups.activeGroup.id);
    busyNextChunk.value = false;
  }
};
const throttledHandleScroll = throttle(handleScroll, 100);

watch(() => groups.activeGroup, handleLoad);
</script>

<template>
  <section class="window">
    <Modal
      v-if="!!showModal"
      :title="showModal.title"
      :controls="showModal.controls"
      @dismiss="() => (showModal = null)"
    >
      {{ showModal.desc }}
    </Modal>
    <Header class="header">
      <template #left>
        <Avatar @open="() => handleGroupOption('Profile')" class="mr-0p5" :url="avatarUrl" />
        <div @click="() => handleGroupOption('Profile')" class="info mr-0p5">
          <h3 class="name">{{ group.name }}</h3>
          <h4 class="members">{{ names }}</h4>
        </div>
        <Options
          :options="[
            { text: 'Profile', icon: 'user' },
            { text: 'Leave', icon: 'leave' }
          ]"
          @select="(opt) => handleGroupOption(opt.text)"
        />
      </template>
    </Header>
    <section ref="containerEl" class="messages-container" @scroll="throttledHandleScroll">
      <div ref="listEl" class="messages">
        <Message v-for="msg in messagesStore.messages[group.id] ?? []" :key="msg.id" :message="msg" />
      </div>
      <div v-if="busyNextChunk" class="wait"><Spinner /></div>
    </section>
    <Footer>
      <template #left>
        <Options
          class="mr-0p5"
          :options="[
            { text: 'Document', icon: 'document' },
            { text: 'Media', icon: 'media' }
          ]"
          icon="attach"
          @select="handleAttachOption"
        />
        <TextArea
          @enter="() => handleSend(message)"
          class="input mr-0p5"
          :attrs="{ placeholder: 'Write a message' }"
          v-model="message"
        />
        <Button
          @click="() => handleSend(message)"
          :size="1.5"
          icon="send"
          :complementary="false"
          :disabled="busy"
          circular
          flat
        />
      </template>
    </Footer>
    <RouterView v-slot="{ Component }">
      <Transition name="fade-slide-rtr">
        <component :is="Component" />
      </Transition>
    </RouterView>
    <input v-show="false" ref="attachEl" type="file" accept="image/*" @change="handleFile" />
  </section>
</template>

<style scoped>
.header {
  border-bottom: 1px solid var(--c-border-0);
}
.footer {
  border-top: 1px solid var(--c-border-0);
  height: unset;
}
.footer:deep(.left) {
  padding-bottom: 0.65rem !important;
  padding-top: 0.65rem !important;
  align-items: flex-end !important;
}
.window {
  position: absolute;
  height: 100vh;
  top: 0;
  left: 0;
  width: 100vw;
  background-color: var(--c-background-0);
  display: flex;
  flex-direction: column;
  z-index: 50;
}

.window .messages-container {
  flex: 1;
  overflow-y: auto;
  overflow-anchor: auto;
  display: flex;
  flex-direction: column-reverse;
}
.window .messages-container .wait {
  width: min-content;
  margin: auto;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
.window .messages {
  width: 100%;
  padding: 1rem 0rem;
}

.info {
  flex: 1;
  min-width: 0;
}
.info h3,
.info h4 {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.info h4 {
  color: var(--c-text-2);
}

.input {
  flex: 1;
  margin-bottom: 0.25rem;
  margin-top: 0.25rem;
}

.messages .message:last-child {
  margin-bottom: 1rem;
}
</style>
