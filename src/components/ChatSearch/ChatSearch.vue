<script setup>
import { ref, watch } from 'vue';

import InputText from '@/components/Common/InputText/InputText.vue';
import Icon from '@/components/Common/Icon/Icon.vue';
import Button from '@/components/Common/Button/Button.vue';
import Toggle from '@/components/Common/Toggle/Toggle.vue';

const emit = defineEmits(['search']);

const query = ref('');
const filterUnread = ref(false);

const handleClear = () => (query.value = '');

watch(query, () => emit('search', query.value));
</script>

<template>
  <section class="search">
    <Icon :size="1" class="search-icon ml-1" alt="Search icon" name="search" adaptive />
    <InputText
      v-model="query"
      class="search-input"
      type="text"
      placeholder="Search"
      :attrs="{ spellcheck: false, autofill: false }"
      no-title
      validation="Off"
    />
    <Transition name="fade">
      <Button
        v-if="query"
        :size="0.7"
        class="clear-control"
        icon="close"
        :complementary="false"
        circular
        flat
        @click="handleClear"
      />
    </Transition>
    <Toggle :size="1.2" class="unread-filter" v-model="filterUnread" />
  </section>
</template>

<style scoped>
.search {
  z-index: 1;
  display: flex;
  align-items: center;
  /* box-shadow: 0 0 10px 0px grey; */
}
.search-input {
  padding: 0.25rem 5.5rem 0.4rem 3rem;
  flex: 1;
}
.search-input:deep(input) {
  font-family: system-ui;
}
.search-input:deep(input) {
  color: var(--c-text-2);
  font-size: 1.2rem;
}
.search-icon,
.clear-control {
  position: absolute;
  font-size: 0;
}
.search-icon:deep(img),
.clear-control:deep(img) {
  filter: invert(51%) sepia(3%) saturate(99%) hue-rotate(20deg) brightness(90%) contrast(88%);
}
.clear-control {
  right: 3rem;
}
.unread-filter {
  position: absolute;
  right: 0.5rem;
}
.unread-filter:deep(img) {
  filter: invert(51%) sepia(3%) saturate(99%) hue-rotate(20deg) brightness(90%) contrast(88%);
}
</style>
