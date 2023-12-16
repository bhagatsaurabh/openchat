<script setup>
import Icon from '../Icon/Icon.vue';
import Spinner from '../Spinner/Spinner.vue';

defineProps({
  icon: {
    type: String,
    default: null
  },
  iconLeft: {
    type: Boolean,
    default: false
  },
  iconRight: {
    type: Boolean,
    default: false
  },
  size: {
    type: Number,
    default: 1
  },
  circular: {
    type: Boolean,
    default: false
  },
  complementary: {
    type: Boolean,
    default: true
  },
  async: {
    type: Boolean,
    default: false
  },
  busy: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  visual: {
    type: Boolean,
    default: false
  },
  accented: {
    type: Boolean,
    default: false
  },
  flat: {
    type: Boolean,
    default: false
  }
});
</script>

<template>
  <button
    :class="{
      control: true,
      circular,
      complementary,
      visual,
      accented,
      flat
    }"
    :style="{ fontSize: `${size}rem` }"
    :disabled="disabled || busy"
  >
    <Icon
      class="mr-0p5"
      v-if="icon && iconLeft"
      v-hide="busy"
      :alt="`${icon} icon`"
      :name="icon"
      adaptive
      :invert="complementary"
      :size="size"
    />
    <Icon
      v-if="icon && !iconLeft && !iconRight"
      v-hide="busy"
      :alt="`${icon} icon`"
      :name="icon"
      adaptive
      :invert="complementary"
      :size="size"
    />
    <div v-hide="busy">
      <slot></slot>
    </div>
    <Icon
      class="ml-0p5"
      v-if="icon && iconRight"
      v-hide="busy"
      :alt="`${icon} icon`"
      :name="icon"
      adaptive
      :invert="complementary"
      :size="size"
    />
    <Spinner v-if="async" v-hide="!busy" :size="0.75 * size" :blob-count="3" :invert="complementary" />
  </button>
</template>

<style scoped>
.control {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--c-text-0);
  border: 1px solid var(--c-box-border);
  padding: 0.5rem 1rem;
  background-color: var(--c-background-0);
  border-radius: 0.5rem;
  transition:
    var(--theme-bg-transition),
    var(--theme-color-transition),
    var(--theme-border-transition),
    box-shadow var(--fx-transition-duration-0) linear,
    var(--theme-opacity-transition);
  box-shadow:
    2.5px 2.5px 5px 0 var(--c-shadow-0),
    0 0 0 0 var(--c-shadow-0) inset;
}
.control.complementary {
  background-color: var(--c-text-0);
  color: var(--c-background-0);
}
.control.circular {
  padding: 0.5rem;
  border-radius: 999px;
}
.control.visual {
  padding: 0rem;
  border: 0;
}
.control.visual div {
  font-size: 0;
}
.control.accented {
  background-color: var(--c-accent);
}

.control:disabled {
  opacity: 0.6;
  pointer-events: none;
  cursor: not-allowed;
}
.control.accented:disabled {
  background-color: var(--c-background-2);
}

.control:deep(span) {
  display: inline-flex;
  transition: opacity 0.2s linear;
}
.control div {
  display: inline-flex;
  align-items: center;
}

.control:deep(.spinner) {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.control.flat {
  box-shadow:
    0 0 0 0 var(--c-shadow-0),
    0 0 0 0 var(--c-shadow-0) inset;
}

@media (hover: hover) {
  .control:hover {
    background-color: var(--c-background-2);
    box-shadow:
      2px 2px 4px 0 var(--c-shadow-0),
      0 0 0 0 var(--c-shadow-0) inset;
  }
  .control.flat:hover {
    box-shadow:
      0 0 0 0 var(--c-shadow-0),
      0 0 0 0 var(--c-shadow-0) inset;
  }
  .control.complementary:hover {
    background-color: var(--c-text-2);
  }
}

.control:active {
  box-shadow:
    0 0 0 0 var(--c-shadow-0),
    2.5px 2.5px 5px 0 var(--c-shadow-0) inset;
}
.control.accented:active {
  box-shadow:
    0 0 0 0 var(--c-shadow-0),
    2.5px 2.5px 5px 0 #6d6d6d inset;
}
.control.flat:active {
  box-shadow:
    0 0 0 0 var(--c-shadow-0),
    2.5px 2.5px 5px 0 var(--c-shadow-0) inset;
}
</style>
