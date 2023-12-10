<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { AuthErrorCodes } from 'firebase/auth';

import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import InputText from '../Common/InputText/InputText.vue';
import Button from '../Common/Button/Button.vue';

const authStore = useAuthStore();
const notify = useNotificationStore();
const route = useRoute();
const router = useRouter();
const code = ref(null);
const timerHandle = ref(-1);
const countDown = ref(30);
const codeEl = ref(null);
const isSigningIn = ref(false);

const phone = computed(() =>
  route.params.countryCode ? `+${route.params.countryCode} ${route.params.phone}` : ''
);

const startResendTimer = () => {
  countDown.value = 30;
  clearInterval(timerHandle.value);
  timerHandle.value = setInterval(() => {
    countDown.value -= 1;
    if (countDown.value < 0) clearInterval(timerHandle.value);
  }, 1000);
};
const validate = (val) => {
  console.log(val);
  if (!val) return 'Provide the 6 digit code';
  if (isNaN(parseInt(val)) || val.toString().length !== 6) {
    return 'Enter a valid code';
  }
  return null;
};
const signIn = async (code) => {
  isSigningIn.value = true;
  try {
    const result = await window.phoneConfirmation?.confirm(code);
    authStore.setUser(result.user);
  } catch (error) {
    if (error.code === AuthErrorCodes.INVALID_CODE) {
      codeEl.value.invalidate('Wrong code. Try again');
    } else if (error.code === AuthErrorCodes.CODE_EXPIRED) {
      codeEl.value.invalidate('Code expired, request a new one');
    } else {
      notify.push({ type: 'snackbar', status: 'warn', message: 'Something went wrong, please try again' });
      console.log(error);
    }
  }
  isSigningIn.value = false;
};
const handleCancel = () => router.back();
const handleSubmit = () => {
  if (!codeEl.value.validate(code.value)) {
    signIn(code.value);
  }
};
const handleResend = () => {
  // TODO: Resend code
  startResendTimer();
};

watch(phone, () => {
  if (phone.value) {
    startResendTimer();
  }
});

onBeforeUnmount(() => clearTimeout(timerHandle.value));
</script>

<template>
  <section class="mb-1">
    <h2>Verify phone number</h2>
  </section>
  <section class="mb-1">
    <h3>
      Enter the 6-digit code sent to <br />
      <a @click="handleCancel" class="phone-link" to="#2">{{ phone }}</a>
    </h3>
  </section>
  <section>
    <InputText
      class="code-input"
      ref="codeEl"
      type="number"
      placeholder="6 digit code"
      v-model="code"
      :attrs="{ spellcheck: false, autocomplete: 'off', maxlength: 6 }"
      :validator="validate"
    />
  </section>
  <section class="controls mt-1 mb-2">
    <Button @click="handleCancel" accented>Cancel</Button>
    <Button @click="handleSubmit" :busy="isSigningIn" async accented>Continue</Button>
  </section>
  <section class="resend pt-2">
    <Button :disabled="countDown >= 0" @click="handleResend" :complementary="false">
      <span>Resend Code</span>
      <span v-if="countDown >= 0">&nbsp;in 0:{{ countDown }}</span>
    </Button>
  </section>
</template>

<style scoped>
.phone-link {
  text-decoration: none;
}
.code-input {
  width: 100%;
}
.controls {
  display: flex;
  justify-content: flex-end;
  column-gap: 1rem;
}
.resend button {
  margin: auto;
  color: var(--c-accent);
}
.resend button span {
  font-weight: 600;
}
</style>
