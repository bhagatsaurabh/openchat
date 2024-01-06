<script setup>
import { computed, ref, watch } from 'vue';

import { useGroupsStore } from '@/stores/groups';
import Avatar from '@/components/Common/Avatar/Avatar.vue';
import Header from '@/components/Common/Header/Header.vue';
import Footer from '@/components/Common/Footer/Footer.vue';
import { useUsersStore } from '@/stores/users';

const groups = useGroupsStore();
const users = useUsersStore();
const group = ref(groups.activeGroup);
const names = computed(() => users.getNamesFromUIDs(group.value.members).join(', '));

const handleLoad = () => {
  if (!groups.activeGroup) return;

  if (group.value.id !== groups.activeGroup.id) {
    group.value = groups.activeGroup;
    console.log(groups.activeGroup);
  }
};

watch(() => groups.activeGroup, handleLoad);
</script>

<template>
  <section class="window">
    <Header>
      <template #left>
        <div class="title">
          <Avatar :url="group.avatarUrl" />
          <div class="info">
            <span class="name">{{ group.name }}</span>
            <span class="members">{{ names }}</span>
          </div>
        </div>
      </template>
      <template #right>
        <!-- <Options /> -->
      </template>
    </Header>
    <section class="messages"></section>
    <Footer>
      <template #left>
        <!-- <Options /> Attach -->
        <!-- <TextArea /> Message -->
        <!-- <Button></Button> Send -->
      </template>
    </Footer>
  </section>
</template>

<style scoped>
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
</style>
