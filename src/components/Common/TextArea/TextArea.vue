<script setup>
import { clamp } from '@/utils/utils';
import { onMounted, ref } from 'vue';

const props = defineProps({
  attrs: {
    type: Object,
    default: () => ({})
  },
  focus: {
    type: Boolean,
    default: false
  },
  modelValue: String
});
const emit = defineEmits(['update:modelValue', 'enter']);

const native = ref(null);
const lines = ref(1);

const handleInput = (e) => {
  emit('update:modelValue', e.target.value);
  lines.value = clamp(Math.round(e.target.scrollHeight / 18 - 1), [1, 5]);
  if (!e.target.value) lines.value = 1;
};
const handleEnter = (e) => {
  if (!e.shiftKey) {
    e.preventDefault();
    emit('enter');
  }
};

onMounted(() => {
  props.focus && native.value.focus();
});

defineExpose({ native });
</script>

<template>
  <textarea
    :style="{ height: `calc(${1 + lines}rem + 2px)` }"
    class="textarea"
    ref="native"
    :value="modelValue"
    @input="handleInput"
    v-bind="attrs"
    @keydown.enter="handleEnter"
  ></textarea>
</template>

<style scoped>
.textarea {
  display: inline-block;
  width: 100%;
  font-size: 1rem;
  border: none;
  padding: 0.5rem 0.3rem 0.5rem 0.3rem;
  transition: border var(--fx-duration-0) linear;
  padding: 0.5rem 0.5rem 0.5rem 0.75rem;
  resize: none;
  height: calc(2rem + 2px);
  background-color: var(--c-background-2);
  color: var(--c-text-0);
  transition: var(--theme-bgc-transition), var(--theme-color-transition);
}

.textarea:focus {
  outline: none;
}
</style>
