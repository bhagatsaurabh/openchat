<script setup>
import Button from '@/components/Common/Button/Button.vue';

defineProps({
  tabs: {
    type: Array,
    default: () => []
  },
  active: {
    type: Number,
    default: 0
  },
  showHeader: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['change']);
</script>

<template>
  <div class="tabs">
    <div class="headings" :class="{ show: showHeader }">
      <Button
        v-for="(tab, idx) in tabs"
        :key="tab.id"
        :class="{ active: active === idx }"
        :size="1"
        :icon="tab.icon"
        icon-left
        :complementary="false"
        flat
        @click="() => emit('change', idx)"
      >
        {{ tab.name }}
      </Button>
    </div>
    <div
      class="content"
      :class="{ 'with-header': showHeader }"
      v-for="(tab, idx) in tabs"
      :key="idx"
      v-show="active === idx"
    >
      <slot :name="tab.id"></slot>
    </div>
  </div>
</template>

<style scoped>
.headings {
  display: flex;
  height: 0;
  transition: height var(--fx-transition-duration-0) linear;
  overflow: hidden;
}
.headings.show {
  height: 2.5rem;
}
.headings::after {
  content: '';
  position: absolute;
  bottom: 0;
  display: block;
  height: 1px;
  width: 100%;
  background-color: var(--c-border-1);
}

.headings button {
  flex: 1;
  padding: 0.6rem;
  font-weight: lighter;
  font-size: 1rem;
  justify-content: center;
  border-radius: 0;
}
.headings button:not(:last-child) {
  border-right: 1px solid var(--c-border-0);
}
.headings button::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 0px;
  transition: height var(--fx-transition-duration-0) linear;
  background-color: var(--c-accent);
}
.headings button.active::after {
  height: 3px;
}
.headings:deep(button img) {
  filter: invert(51%) sepia(3%) saturate(99%) hue-rotate(20deg) brightness(90%) contrast(88%);
}

.content {
  height: calc(100vh - var(--header-height) - 3.25rem);
}
.content.with-header {
  height: calc(100vh - var(--header-height) - 3.25rem - 2.5rem);
}
</style>
