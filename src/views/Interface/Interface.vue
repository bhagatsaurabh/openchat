<script setup>
import { computed, ref, watch } from 'vue';

import { useGroupsStore } from '@/stores/groups';
import { useUsersStore } from '@/stores/users';
import Avatar from '@/components/Common/Avatar/Avatar.vue';
import Header from '@/components/Common/Header/Header.vue';
import Footer from '@/components/Common/Footer/Footer.vue';
import Options from '@/components/Common/Options/Options.vue';
import Button from '@/components/Common/Button/Button.vue';
import TextArea from '@/components/Common/TextArea/TextArea.vue';

const groups = useGroupsStore();
const users = useUsersStore();
const group = ref(groups.activeGroup);
const message = ref(null);
const names = computed(() =>
  group.value.id === 'self' ? group.value.name : users.getNamesFromUIDs(group.value.members).join(', ')
);

const handleLoad = () => {
  if (!groups.activeGroup) return;

  if (group.value.id !== groups.activeGroup.id) {
    group.value = groups.activeGroup;
    console.log(groups.activeGroup);
  }
};
const handleGroupOption = (option) => {
  console.log(option);
};
const handleAttachOption = (option) => {
  console.log(option);
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
            { text: 'Profile', icon: 'avatar' },
            { text: 'Leave', icon: 'leave' }
          ]"
          @select="handleGroupOption"
        />
      </template>
    </Header>
    <section class="messages"></section>
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
        <TextArea class="input mr-0p5" :attrs="{ placeholder: 'Write a message' }" v-model="message" />
        <Button :size="1.5" icon="send" :complementary="false" circular flat />
      </template>
    </Footer>
  </section>
</template>

<style scoped>
.header {
  border-bottom: 1px solid var(--c-border-0);
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

.window .messages {
  flex: 1;
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
  height: 80%;
}
</style>
