<script setup>
import { computed, ref, watch } from 'vue';

import Button from '@/components/Common/Button/Button.vue';

const props = defineProps({
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

const headerEl = ref(null);
const transitionName = ref('fade-slide-ltr-fast');
const sliderWidth = computed(() => Math.round(100 / props.tabs.length));

const getCountSign = (tab) => {
  if (tab.count > 100) return '';
  return tab.count < 0 ? '-' : '+';
};

watch(
  () => props.active,
  (newVal, oldVal) => (transitionName.value = newVal < oldVal ? 'fade-slide-rtl-fast' : 'fade-slide-ltr-fast')
);
</script>

<template>
  <div class="tabs">
    <div ref="headerEl" class="headings" :class="{ show: showHeader }">
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
        <span>{{ tab.name }}</span>
        <span v-if="tab.count" class="count">{{ getCountSign(tab) + tab.count }}</span>
      </Button>
      <div class="slider" :style="{ width: `${sliderWidth}%`, left: `${active * sliderWidth}%` }"></div>
    </div>
    <TransitionGroup :name="transitionName">
      <div
        class="content"
        :class="{ 'with-header': showHeader }"
        v-for="(tab, idx) in tabs"
        :key="idx"
        v-show="active === idx"
      >
        <slot :name="tab.id"></slot>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.headings {
  display: flex;
  height: 0rem;
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
.headings .slider {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  transition: left var(--fx-transition-duration-2) ease;
  background-color: var(--c-accent);
}
.headings:deep(button img) {
  filter: invert(51%) sepia(3%) saturate(99%) hue-rotate(20deg) brightness(90%) contrast(88%);
}
.headings .count {
  margin-left: 0.5rem;
  padding: 0.35rem;
  border-radius: 1rem;
  font-size: 0.7rem;
  background-color: var(--c-accent-light-2);
}

.content {
  position: absolute;
  bottom: 0;
  left: 0;
  flex: 1;
  height: 100%;
  width: 100%;
}
.content.with-header {
  height: calc(100% - 2.5rem);
  top: 2.5rem;
}
</style>
