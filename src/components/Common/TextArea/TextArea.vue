<script setup>
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
const emit = defineEmits(['update:modelValue']);

const native = ref(null);

const handleInput = (e) => {
  emit('update:modelValue', e.target.value);
};

onMounted(() => props.focus && native.value.focus());

defineExpose({ native });
</script>

<template>
  <textarea class="textarea" ref="native" :value="modelValue" @input="handleInput" v-bind="attrs"></textarea>
</template>

<style scoped>
.textarea {
  display: inline-block;
  width: 100%;
  font-size: 1rem;
  border: none;
  padding: 0.5rem 0 0.5rem 0;
  transition: border var(--fx-transition-duration-0) linear;
  padding: 0.5rem 0.5rem 0.5rem 0.75rem;
  resize: none;
  height: calc(2rem + 2px);
  background-color: var(--c-background-2);
}

.textarea:focus {
  outline: none;
}
</style>
