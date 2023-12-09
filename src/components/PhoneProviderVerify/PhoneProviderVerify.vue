<script setup>
import { useAuthStore } from '@/stores/auth';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import InputText from '../Common/InputText/InputText.vue';
import Button from '../Common/Button/Button.vue';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const code = ref(null);
const timerHandle = ref(-1);
const countDown = ref(30);
const codeEl = ref(null);

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
  try {
    const result = await window.phoneConfirmation?.confirm(code);
    authStore.setUser(result.user);
  } catch (error) {
    console.log(error);
  }
};
const handleCancel = () => router.back();
const handleSubmit = () => {
  if (codeEl.value.validate()) {
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
  <section>
    <h2>Verify phone number</h2>
  </section>
  <section>
    <h3>
      Enter the 6-digit code sent to <br />
      <a @click="handleCancel" class="phone-link" to="#2">{{ phone }}</a>
    </h3>
  </section>
  <section>
    <InputText
      ref="codeEl"
      type="number"
      placeholder="6 digit code"
      v-model="code"
      :attrs="{ spellcheck: false, autocomplete: 'off', maxlength: 6 }"
      :validator="validate"
    />
  </section>
  <section>
    <Button @click="handleCancel" accented>Cancel</Button>
    <Button @click="handleSubmit" accented>Continue</Button>
  </section>
  <section>
    <Button :disabled="countDown > 0" @click="handleResend" accented>
      <span>Resend Code</span>
      <span>in 0:{{ countDown }}</span>
    </Button>
  </section>
</template>

<style scoped>
.phone-link {
  text-decoration: none;
}
</style>
