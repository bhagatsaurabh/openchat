<script setup>
import { watch } from 'vue';

import { useGroupsStore } from '@/stores/groups';
import Avatar from '@/components/Common/Avatar/Avatar.vue';
import Header from '@/components/Common/Header/Header.vue';
import Footer from '@/components/Common/Footer/Footer.vue';

const groups = useGroupsStore();

const handleLoad = () => {
  console.log(groups.activeGroup);
};

watch(() => groups.activeGroup, handleLoad);
</script>

<template>
  <Header>
    <template #left>
      <Avatar :url="groups.activeGroup.avatarUrl" />
    </template>
    <template #right>
      <!-- <Options /> -->
    </template>
  </Header>
  <main></main>
  <Footer>
    <template #left>
      <!-- <Options /> Attach -->
      <!-- <TextArea /> Message -->
      <!-- <Button></Button> Send -->
    </template>
  </Footer>
</template>

<style scoped></style>
