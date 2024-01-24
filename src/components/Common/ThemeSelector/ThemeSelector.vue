<script setup>
import { computed, watch, ref } from 'vue';

import { usePreferencesStore } from '@/stores/preferences';
import { themeClasses, themes } from '@/utils/constants';
import Icon from '@/components/Common/Icon/Icon.vue';

const props = defineProps({
  type: {
    type: String,
    default: 'horizontal'
  }
});

const preferences = usePreferencesStore();

let themesList = ref(Object.values(themes));
const isOpen = ref(false);
const themeButtons = ref([]);
const currTheme = computed(() => preferences.userTheme);

const themeLabel = (theme) => theme + (theme === 'System' ? ` (${preferences.systemTheme})` : '');

const themeSelectHandler = (theme) => {
  if (currTheme.value !== theme) {
    preferences.setTheme(theme);
    isOpen.value = false;
  } else {
    isOpen.value = !isOpen.value;
  }

  if (!isOpen.value) {
    themeButtons.value.find((themeButton) => themeButton.classList.contains('active'))?.blur();
  }
};
const handleChildBlur = (e) => {
  if (!themeButtons.value.includes(e.relatedTarget)) {
    isOpen.value = false;
  }
};
const focusNext = (delta) => {
  if (themeButtons.value.includes(document.activeElement)) {
    let idx = themeButtons.value.findIndex((el) => el === document.activeElement);
    idx += delta;
    if (idx < 0) idx = 3;
    else if (idx > 3) idx = 0;
    themeButtons.value[idx]?.focus();
  } else {
    themeButtons.value[0].focus();
  }
};

watch(
  currTheme,
  () => {
    if (props.type === 'vertical') {
      const currThemeIdx = themesList.value.findIndex((val) => val === currTheme.value);
      if (currThemeIdx === 0) return;

      [themesList.value[0], themesList.value[currThemeIdx]] = [
        themesList.value[currThemeIdx],
        themesList.value[0]
      ];
      [themeButtons.value[0], themeButtons.value[currThemeIdx]] = [
        themeButtons.value[currThemeIdx],
        themeButtons.value[0]
      ];
    }
  },
  { immediate: true }
);
watch(isOpen, () => isOpen.value && focusNext());
</script>

<template>
  <TransitionGroup
    v-if="type === 'vertical'"
    class="theme-selector"
    :class="{ open: isOpen }"
    name="themes"
    tag="div"
    tabindex="0"
    @keypress.enter="isOpen = !isOpen"
    @keydown.up="isOpen && focusNext(-1)"
    @keydown.down="isOpen && focusNext(1)"
  >
    <button
      v-for="(theme, index) in themesList"
      :key="theme"
      ref="themeButtons"
      :data-label="themeLabel(theme)"
      class="theme-item"
      :class="{ active: currTheme === theme }"
      :style="{ top: `${index * 3.5}rem` }"
      :tabindex="isOpen ? '0' : '-1'"
      @click="themeSelectHandler(theme)"
      @blur="(e) => handleChildBlur(e)"
    >
      <Icon
        class="icon"
        :alt="`${theme} theme icon`"
        :name="`theme-${themeClasses[theme]}`"
        :size="1.5"
        adaptive
      />
    </button>
  </TransitionGroup>
  <div v-else class="theme-selector-hoz">
    <button
      v-for="theme in themesList"
      :key="theme"
      ref="themeButtons"
      :data-label="themeLabel(theme)"
      class="theme-item-hoz"
      :class="{ active: currTheme === theme }"
      @click="themeSelectHandler(theme, true)"
    >
      <Icon
        class="icon"
        :alt="`${theme} theme icon`"
        :name="`theme-${themeClasses[theme]}`"
        :size="2"
        adaptive
      />
    </button>
  </div>
</template>

<style scoped>
.theme-selector {
  position: relative;
  direction: rtl;
  color: var(--c-text-0);
  width: 3rem;
  height: 3rem;
}
.theme-selector:not(.open) .theme-item {
  top: 0rem !important;
  opacity: 0;
}

.theme-item {
  color: var(--c-text-0);
  border: 1px solid var(--c-border-0);
  display: block;
  transition: all var(--fx-duration-1) ease;
  background-color: var(--c-background-0);
  font-size: 0;
  border-radius: 1rem;
  box-shadow: 0 0 10px -3px var(--c-shadow-0);
  padding: 0.5rem;
  position: absolute;
  top: 0rem;
  z-index: 1;
  cursor: pointer;
}
.theme-item:active {
  box-shadow:
    0 0 10px -2px var(--c-shadow-0),
    4px 4px 10px -5px var(--c-shadow-1) inset;
}
.theme-item.active {
  z-index: 2;
  opacity: 1 !important;
}

.theme-item:not(:last-child) {
  margin-bottom: 0.5rem;
}
.theme-item::before {
  content: attr(data-label);
  opacity: 0;
  font-size: 1rem;
  position: absolute;
  white-space: nowrap;
  top: 50%;
  right: calc(100% + 1rem);
  transform: translate(10%, -50%);
  transition:
    transform var(--fx-duration-1) ease,
    opacity var(--fx-duration-1) ease;
  padding: 0.4rem 1.2rem;
  pointer-events: none;
  background-color: var(--c-background-2);
  border-radius: 1rem;
  border: 1px solid var(--c-border-0);
  box-shadow: 0 0 8px -2px var(--c-shadow-0);
}

.theme-item:focus::before,
.theme-selector.open .theme-item::before {
  opacity: 1;
  transform: translate(0, -50%);
  outline: none;
}
@media (hover: hover) {
  .theme-item:hover::before {
    opacity: 1;
    transform: translate(0, -50%);
    outline: none;
  }
}

.themes-move,
.themes-enter-active,
.themes-leave-active {
  transition: all 0.5s ease;
}
.themes-enter-from,
.themes-leave-to {
  opacity: 0;
}
.themes-leave-active {
  position: absolute;
}

.theme-selector-hoz {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  padding-bottom: 4rem;
}

.theme-selector-hoz .theme-item-hoz {
  padding: 0.5rem;
  font-size: 0;
  border: 1px solid var(--c-border-0);
  border-radius: 1rem;
  background-color: transparent;
  transition: background-color var(--fx-duration-1) ease;
  cursor: pointer;
}
.theme-selector-hoz .theme-item-hoz.active {
  background-color: var(--c-background-3);
}
.theme-selector-hoz .theme-item-hoz::after {
  content: attr(data-label);
  position: absolute;
  display: block;
  left: 50%;
  bottom: 0;
  transform: translate(-50%, calc(100% + 0.5rem));
  transition: var(--theme-color-transition);
  font-size: 0.8rem;
  color: var(--c-text-0);
}

.icon {
  opacity: 0.7;
}
.icon:deep(img) {
  pointer-events: none !important;
}
</style>
