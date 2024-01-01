<script setup>
import { computed, ref, onUpdated } from 'vue';
import { usePreferencesStore } from '@/stores/preferences';
import { themes } from '@/utils/constants';

const props = defineProps({
  alt: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  adaptive: {
    type: Boolean,
    default: false
  },
  singular: {
    type: Boolean,
    default: false
  },
  size: {
    type: Number,
    default: 1
  },
  invert: {
    type: Boolean,
    default: false
  },
  config: {
    type: Object,
    default: new Object()
  },
  animated: {
    type: Boolean,
    default: false
  },
  accented: {
    type: Boolean,
    default: false
  }
});

const preferences = usePreferencesStore();
const theme = computed(() => preferences.theme);

const extn = props.animated ? 'gif' : 'png';
const metaUrl = import.meta.url;
const lightSource = ref(null);
if (props.name.startsWith('src#')) {
  lightSource.value = props.name.substring(4);
} else {
  lightSource.value = new URL(`/assets/icons/${props.name}.${extn}`, metaUrl).href;
}
const darkSource = ref(null);
if (!props.adaptive && !props.singular) {
  darkSource.value = new URL(`/assets/icons/${props.name}-dark.${extn}`, metaUrl).href;
}

onUpdated(() => {
  if (props.name.startsWith('src#')) {
    lightSource.value = props.name.substring(4);
  } else {
    lightSource.value = new URL(`/assets/icons/${props.name}.${extn}`, metaUrl).href;
  }
  if (!props.adaptive && !props.singular) {
    darkSource.value = new URL(`/assets/icons/${props.name}-dark.${extn}`, metaUrl).href;
  }
});
</script>

<template>
  <span class="icon-container">
    <img
      v-hide="!adaptive && !singular && theme === themes.DARK"
      :alt="alt"
      :style="{ ...config, maxWidth: `${size}rem` }"
      :class="{
        'icon-adaptive': adaptive,
        icon: !adaptive,
        invert,
        accented
      }"
      :src="lightSource"
      :draggable="false"
    />
    <img
      v-if="!adaptive && !singular"
      v-hide="theme === themes.LIGHT"
      :alt="alt"
      :style="{ ...config, maxWidth: `${size}rem` }"
      class="icon dark"
      :src="darkSource"
      :draggable="false"
    />
  </span>
</template>

<style scoped>
.icon-container {
  user-select: none;
}
.icon {
  transition: opacity var(--theme-transition-duration) linear;
}

.icon-adaptive {
  transition: filter var(--theme-transition-duration) linear;
}
.icon-adaptive.accented {
  filter: invert(61%) sepia(72%) saturate(258%) hue-rotate(234deg) brightness(90%) contrast(88%) !important;
}

.icon-adaptive.invert {
  filter: invert(1);
}

html[data-theme='dark'] .icon-adaptive:not(.invert) {
  /* #dddddd */
  filter: invert(93%) sepia(0%) saturate(2975%) hue-rotate(147deg) brightness(126%) contrast(73%);
}

html[data-theme='dark'] .icon-adaptive.invert {
  /* #222222 */
  filter: invert(9%) sepia(0%) saturate(509%) hue-rotate(170deg) brightness(93%) contrast(87%);
}

html[data-theme='high-contrast'] .icon-adaptive:not(.invert) {
  filter: invert(1);
}

html[data-theme='high-contrast'] .icon-adaptive.invert {
  filter: invert(0);
}

.icon.dark {
  position: absolute;
  top: 0;
  left: 0;
}
</style>
