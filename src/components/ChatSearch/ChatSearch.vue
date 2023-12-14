<script setup>
import { ref, watch } from 'vue';

import InputText from '@/components/Common/InputText/InputText.vue';
import Icon from '@/components/Common/Icon/Icon.vue';
import Button from '@/components/Common/Button/Button.vue';

const emit = defineEmits(['search']);

const query = ref('');

watch(query, () => emit('search', query.value));
</script>

<template>
  <section class="search">
    <Icon :size="1.2" class="search-icon" alt="Search icon" name="search" adaptive />
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
        :size="0.8"
        class="clear-control"
        icon="close"
        :complementary="false"
        circular
        visual
      />
    </Transition>
  </section>
</template>

<style scoped>
.search-input {
  padding: 0.25rem 3rem 0.25rem 3rem;
  width: 100%;
}
.search-input:deep(input) {
  color: var(--c-text-2);
  font-size: 1.2rem;
}
.search-icon,
.clear-control {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0;
}
.search-icon {
  margin-left: 0.8rem;
}
.search-icon:deep(img),
.clear-control:deep(img) {
  filter: invert(51%) sepia(3%) saturate(99%) hue-rotate(20deg) brightness(90%) contrast(88%);
}
.clear-control {
  padding: 0.3rem !important;
  right: 0.8rem;
  box-shadow: none !important;
}
</style>
