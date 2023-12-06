<script setup>
defineProps({
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: null
  },
  outline: {
    type: Boolean,
    default: true
  },
  attrs: {
    type: Object,
    default: () => ({})
  },
  modelValue: String
});
</script>

<template>
  <span :class="{ input: true, 'no-outline': !outline, blank: !modelValue }" :data-placeholder="placeholder">
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :type="type"
      v-bind="attrs"
    />
  </span>
</template>

<style scoped>
.input input {
  height: 100%;
  font-size: 1rem;
  border: none;
  padding: 0.5rem 0 0.5rem 0;
  transition: border var(--fx-transition-duration-0) linear;
  background-color: transparent;
}
.input::before {
  content: attr(data-placeholder);
  display: block;
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  line-height: 2.4rem;
  color: var(--c-text-2);
  pointer-events: none;
  transition: all var(--fx-transition-duration-0) ease-out;
  top: 75%;
  font-size: 0.75rem;
}
.input.blank::before {
  top: 0;
  font-size: 1rem;
}
.input::after {
  content: '';
  display: block;
  position: absolute;
  width: 100%;
  height: 1px;
  bottom: 0;
  left: 0;
  transition: height var(--fx-transition-duration-0) linear;
  background-color: gray;
}
.input:focus-within::after {
  background-color: #c18eda;
  height: 4px;
}
.input:focus-within::before {
  top: 75%;
  font-size: 0.75rem;
}
.input.no-outline input:focus {
  outline: none;
}
</style>
