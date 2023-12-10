<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { AuthErrorCodes, getAuth, signInWithPhoneNumber } from 'firebase/auth';

import { app } from '@/config/firebase';
import Button from '../Common/Button/Button.vue';
import InputText from '../Common/InputText/InputText.vue';
import CountryInput from '@/components/CountryInput/CountryInput.vue';
import Recaptcha from '../Recaptcha/Recaptcha.vue';

const auth = getAuth(app);
const phoneUtil = window.libphonenumber.PhoneNumberUtil.getInstance();

const countryCode = ref(null);
const phoneNum = ref(null);
const inputEl = ref(null);
const captcha = ref(null);
const isVerifying = ref(false);
const router = useRouter();

const verifyPhoneNumber = async () => {
  try {
    window.phoneConfirmation = await signInWithPhoneNumber(
      auth,
      `+${countryCode.value}${phoneNum.value}`,
      window.verifier
    );
    return true;
  } catch (error) {
    if (error.code === AuthErrorCodes.CAPTCHA_CHECK_FAILED) {
      captcha.value.invalidate('Captcha check failed, please try again');
    }
    window.grecaptcha.reset(await captcha.value.render());
    return false;
  }
};
const validate = (val) => {
  if (!val) return 'Provide a phone number';
  try {
    if (!phoneUtil.isValidNumber(phoneUtil.parse(`+${countryCode.value}${val}`))) {
      return 'Enter a valid phone number';
    }
    return null;
  } catch (error) {
    return 'Enter a valid phone number';
  }
};
const handleVerify = async () => {
  isVerifying.value = true;
  if (!inputEl.value.validate(phoneNum.value) && captcha.value.validate()) {
    if (await verifyPhoneNumber()) {
      router.push({ hash: '#4', params: { countryCode: countryCode.value, phone: phoneNum.value } });
    }
  }
  isVerifying.value = false;
};
</script>

<template>
  <section class="country-input">
    <CountryInput @select="(country) => (countryCode = country[2])" />
    <InputText
      ref="inputEl"
      class="flex-1"
      type="tel"
      placeholder="Phone Number"
      v-model="phoneNum"
      :attrs="{ spellcheck: false, autocomplete: 'off' }"
      :validator="validate"
    />
  </section>
  <section class="captcha-container">
    <Recaptcha ref="captcha" />
  </section>
  <section class="controls">
    <Button @click="handleVerify" :busy="isVerifying" async accented>Verify</Button>
  </section>
  <section class="notice">
    <span> By tapping Verify, an SMS may be sent. Message & data rates may apply. </span>
  </section>
</template>

<style scoped>
.country-input,
.captcha-container {
  margin: auto;
  width: max-content;
  margin-top: 1rem;
}
.country-input {
  display: flex;
  align-items: flex-start;
}
.controls {
  margin-top: 1rem;
}
.controls button {
  margin-left: auto;
}
.notice {
  margin-top: 3rem;
  color: var(--c-text-2);
}
</style>
