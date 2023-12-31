<script setup>
import { ref } from 'vue';

import Button from '@/components/Common/Button/Button.vue';

const props = defineProps({
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: null
  },
  attrs: {
    type: Object,
    default: () => ({})
  },
  noTitle: {
    type: Boolean,
    default: false
  },
  validator: {
    type: Function,
    default: () => true
  },
  validation: {
    type: String,
    default: 'Lazy',
    validator: (val) => ['Lazy', 'Eager', 'Off'].includes(val)
  },
  async: {
    type: Boolean,
    default: false
  },
  action: {
    type: Function,
    default: () => true
  },
  modelValue: String
});
const emit = defineEmits(['update:modelValue', 'save']);

const native = ref(null);
const org = ref(props.modelValue);
const errormsg = ref('');
const isBusy = ref(false);

const handleInput = (e) => {
  if (props.validation === 'Eager') validate(e.target.value);
  else {
    errormsg.value = null;
    native.value?.setCustomValidity('');
  }

  emit('update:modelValue', e.target.value);
};
const validate = (val) => {
  errormsg.value = props.validator(val);
  native.value?.setCustomValidity(errormsg.value);
  return errormsg.value;
};
const invalidate = (msg) => {
  errormsg.value = msg;
  native.value?.setCustomValidity(errormsg.value);
};
const handleAction = async () => {
  isBusy.value = true;
  if (await props.action()) {
    org.value = props.modelValue;
  }
  isBusy.value = false;
};

defineExpose({ native, validate, invalidate });
</script>

<template>
  <span
    :class="{
      input: true,
      blank: !modelValue,
      'no-title': noTitle,
      invalid: !!errormsg,
      'mt-1p5': validation !== 'Off',
      async
    }"
    :data-placeholder="placeholder"
  >
    <input
      ref="native"
      :value="modelValue"
      @input="handleInput"
      :type="type"
      :placeholder="noTitle ? placeholder : null"
      :disabled="async ? (isBusy ? true : null) : null"
      v-bind="attrs"
    />
    <Button
      @click="handleAction"
      class="control"
      v-if="async && modelValue !== org"
      icon="check"
      :complementary="false"
      :spinner-size="2"
      :busy="isBusy"
      async
      circular
      flat
    />
    <Transition name="slide">
      <span v-if="validation !== 'Off' && !!errormsg" class="errormsg">{{ errormsg }}</span>
    </Transition>
  </span>
</template>

<style scoped>
.input {
  display: inline-block;
  margin-bottom: 1.5rem;
}
.input.no-title {
  margin-bottom: 0;
}
.input.no-title::before {
  display: none;
}
.input input {
  height: 100%;
  width: 100%;
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

.input .control {
  position: absolute;
  right: 0;
  top: 0.1rem;
  padding: 0.4rem;
}
.input.async input {
  padding-right: 2.5rem;
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
  transition:
    height var(--fx-transition-duration-0) linear,
    background-color var(--fx-transition-duration-0) linear;
  background-color: gray;
}
.input:focus-within::after {
  background-color: #c18eda;
  height: 4px;
}
.input.invalid:focus-within::after {
  background-color: #ff4b4b;
}
.input:focus-within::before {
  top: 75%;
  font-size: 0.75rem;
}
.input input:focus {
  outline: none;
}
.errormsg {
  position: absolute;
  width: 100%;
  bottom: 100%;
  left: 0;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-weight: 600;
  color: #ff4b4b;
  transform-origin: bottom;
}
</style>
