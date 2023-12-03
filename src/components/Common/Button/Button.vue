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
  noPadding: {
    type: Boolean,
    default: false
  },
  noBorder: {
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
      'no-padding': noPadding,
      'no-border': noBorder
    }"
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
    />
    <Icon
      v-if="icon && !iconLeft && !iconRight"
      v-hide="busy"
      :alt="`${icon} icon`"
      :name="icon"
      adaptive
      :invert="complementary"
    />
    <span v-hide="busy">
      <slot></slot>
    </span>
    <Icon
      class="ml-0p5"
      v-if="icon && iconRight"
      v-hide="busy"
      :alt="`${icon} icon`"
      :name="icon"
      adaptive
      :invert="complementary"
    />
    <Spinner v-if="async" v-hide="!busy" :size="1.5" :invert="complementary" />
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
  transition: var(--theme-bg-transition), var(--theme-color-transition), var(--theme-border-transition),
    var(--theme-shadow-transition), var(--theme-opacity-transition);
  box-shadow: 0 0 10px 0 var(--c-shadow-0);
}

.control.circular {
  padding: 0.5rem;
  border-radius: 999px;
}
.control.no-padding {
  padding: 0rem;
}
.control.no-border {
  border: 0;
}

.control.complementary {
  background-color: var(--c-text-0);
  color: var(--c-background);
}

.control:active {
  box-shadow: 0 0 5px 0 var(--c-shadow-0);
}

@media (hover: hover) {
  .control.complementary:hover {
    background-color: var(--c-text-2);
  }

  .control:hover {
    background-color: var(--c-background-2);
  }
}

.control:disabled {
  opacity: 0.6;
}

.control:deep(span) {
  display: inline-flex;
  transition: opacity 0.2s linear;
}

.control:deep(.spinner) {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
