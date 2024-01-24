<script setup>
import { ref, watch } from 'vue';

import { throttle } from '@/utils/utils';
import InputText from '@/components/Common/InputText/InputText.vue';
import Icon from '@/components/Common/Icon/Icon.vue';
import Button from '@/components/Common/Button/Button.vue';
import Toggle from '@/components/Common/Toggle/Toggle.vue';

const props = defineProps({
  showUnread: {
    type: Boolean,
    default: true
  },
  unread: {
    type: Boolean,
    default: false
  },
  query: {
    type: String,
    default: ''
  }
});
const emit = defineEmits(['search', 'unread']);

const el = ref(null);

const handleClear = () => emit('search', '');
const throttledEmit = throttle(() => emit('search', props.query), 1000);
const focus = () => el.value.native.focus();

watch(
  () => props.query,
  () => throttledEmit()
);

defineExpose({ focus });
</script>

<template>
  <section class="search" :class="{ 'no-unread': !showUnread }">
    <Icon
      :size="1"
      class="search-icon"
      :class="[showUnread ? 'ml-1' : 'ml-0p5']"
      alt="Search icon"
      name="search"
      adaptive
    />
    <InputText
      ref="el"
      :model-value="query"
      @update:modelValue="(val) => emit('search', val)"
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
    <Toggle
      v-if="showUnread"
      :size="1.2"
      class="unread-filter"
      icon="unread"
      @update:modelValue="emit('unread')"
      :model-value="unread"
    />
  </section>
</template>

<style scoped>
.search {
  z-index: 1;
  display: flex;
  align-items: center;
}
.search-input {
  padding: 0.25rem 5.5rem 0.4rem 3rem;
  flex: 1;
}
.search.no-unread .search-input {
  padding: 0.25rem 3rem 0.4rem 2.5rem;
}
.search-input:deep(input) {
  font-family: system-ui;
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
.search.no-unread .clear-control {
  right: 1rem;
}
.unread-filter {
  position: absolute;
  right: 0.5rem;
}
.unread-filter:deep(img) {
  filter: invert(51%) sepia(3%) saturate(99%) hue-rotate(20deg) brightness(90%) contrast(88%);
}
</style>
