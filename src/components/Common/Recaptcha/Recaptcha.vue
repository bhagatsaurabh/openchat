<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { v4 as uuid } from 'uuid';
import { RecaptchaVerifier, getAuth } from 'firebase/auth';

import { app } from '@/config/firebase';
import { useRecaptchaStore } from '@/stores/recaptcha';

const props = defineProps({
  default: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['success', 'expired']);

const captchaStore = useRecaptchaStore();
const auth = getAuth(app);
const id = ref(uuid());
const isDefault = ref(props.default && !captchaStore.defaultId);

if (isDefault.value) {
  captchaStore.defaultId = id.value;
}

const render = async () => {
  if (captchaStore.active !== id.value) {
    const fromId = captchaStore.active ?? captchaStore.defaultId;
    move(fromId, id.value);
  }

  return await window.verifier.render();
};
const move = (fromId, toId) => {
  const fromEl = document.querySelector(`#c-${fromId}`);
  const toEl = document.querySelector(`#c-${toId}`);

  const captchaEl = fromEl.removeChild(fromEl.children[0]);
  toEl.appendChild(captchaEl);

  window.verifier.container = toEl;
  captchaStore.active = toId;
};
const validate = () => {
  const solved = !!window.grecaptcha.getResponse();
  if (!solved) captchaStore.errormsg = 'Please solve reCAPTCHA';
  return solved;
};
const invalidate = (msg) => {
  captchaStore.errormsg = msg;
};

onMounted(async () => {
  if (!window.verifier && isDefault.value) {
    window.verifier = new RecaptchaVerifier(auth, `c-${id.value}`, {
      size: 'normal',
      callback: (response) => {
        captchaStore.errormsg = null;
        emit('success', response);
      },
      'expired-callback': () => {
        emit('expired');
      }
    });
    const widgetId = await window.verifier.render();
    captchaStore.widgetId = widgetId;
    captchaStore.ready = true;
  } else if (captchaStore.ready) {
    render();
  }
});
onBeforeUnmount(() => {
  if (captchaStore.active === id.value) {
    move(id.value, captchaStore.defaultId);
  }
});

watch(
  () => captchaStore.ready,
  () => !isDefault.value && render()
);

defineExpose({ render, validate, invalidate });
</script>

<template>
  <div class="captcha" :class="{ default: isDefault }" :id="`c-${id}`"></div>
  <Transition name="slide">
    <span class="captcha-msg" v-if="!isDefault && captchaStore.active === id && captchaStore.errormsg">
      {{ captchaStore.errormsg }}
    </span>
  </Transition>
</template>

<style scoped>
.captcha {
  padding-bottom: 1.5rem;
}
.captcha.default {
  display: none;
}
.captcha-msg {
  position: absolute;
  bottom: 0;
  color: #ff4b4b;
  font-weight: 600;
  transform-origin: top;
}
</style>
