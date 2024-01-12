<script setup>
import { computed, onMounted, ref, watch } from 'vue';

import { useGroupsStore } from '@/stores/groups';
import { useUsersStore } from '@/stores/users';
import { useMessagesStore } from '@/stores/messages';
import Avatar from '@/components/Common/Avatar/Avatar.vue';
import Header from '@/components/Common/Header/Header.vue';
import Footer from '@/components/Common/Footer/Footer.vue';
import Options from '@/components/Common/Options/Options.vue';
import Button from '@/components/Common/Button/Button.vue';
import TextArea from '@/components/Common/TextArea/TextArea.vue';
import Message from '@/components/Message/Message.vue';

const groups = useGroupsStore();
const users = useUsersStore();
const messagesStore = useMessagesStore();
const group = ref(groups.activeGroup);
const container = ref(null);
const message = ref(null);
const busy = ref(false);
const names = computed(() =>
  group.value.id === 'self' ? group.value.name : users.getNamesFromUIDs(group.value.members).join(', ')
);

const handleLoad = () => {
  if (!groups.activeGroup) return;

  if (group.value.id !== groups.activeGroup.id) {
    group.value = groups.activeGroup;
  }
};
const handleGroupOption = (option) => {
  // TODO
};
const handleAttachOption = (option) => {
  // TODO
};
const handleSend = async () => {
  busy.value = true;
  if (!message.value || !message.value.trim()) return;
  await messagesStore.send('text', message.value);
  message.value = null;
  busy.value = false;
  container.value.scrollTo(0, container.value.scrollHeight);
};

watch(() => groups.activeGroup, handleLoad);
</script>

<template>
  <section class="window">
    <Header class="header">
      <template #left>
        <Avatar class="mr-0p5" :url="group.avatarUrl" />
        <div class="info mr-0p5">
          <h3 class="name">{{ group.name }}</h3>
          <h4 class="members">{{ names }}</h4>
        </div>
        <Options
          :options="[
            { text: 'Profile', icon: 'user' },
            { text: 'Leave', icon: 'leave' }
          ]"
          @select="handleGroupOption"
        />
      </template>
    </Header>
    <section ref="container" class="messages-container">
      <div class="messages">
        <Message v-for="msg in messagesStore.messages[group.id] ?? []" :key="msg.id" :message="msg" />
      </div>
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
          @enter="handleSend"
          class="input mr-0p5"
          :attrs="{ placeholder: 'Write a message' }"
          v-model="message"
        />
        <Button
          @click="handleSend"
          :size="1.5"
          icon="send"
          :complementary="false"
          :disabled="busy"
          circular
          flat
        />
      </template>
    </Footer>
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
</style>
