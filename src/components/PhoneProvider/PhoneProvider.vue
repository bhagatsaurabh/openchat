<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { AuthErrorCodes } from 'firebase/auth';

import { useAuthStore } from '@/stores/auth';
import Button from '@/components/Common/Button/Button.vue';
import InputText from '@/components/Common/InputText/InputText.vue';
import CountryInput from '@/components/CountryInput/CountryInput.vue';
import Recaptcha from '@/components/Common/Recaptcha/Recaptcha.vue';
import { nameRegex } from '@/utils/constants';

const phoneUtil = window.libphonenumber.PhoneNumberUtil.getInstance();

const authStore = useAuthStore();
const countryCode = ref(null);
const phoneNum = ref(null);
const name = ref(null);
const inputEl = ref(null);
const nameInputEl = ref(null);
const captcha = ref(null);
const isVerifying = ref(false);
const router = useRouter();

const validatePhone = (val) => {
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
const validateName = (val) => {
  if (!val) return 'Provide a name';
  if (!nameRegex.test(val)) {
    return 'Enter a valid name';
  }
  return null;
};
const handleVerify = async () => {
  isVerifying.value = true;
  if (
    !nameInputEl.value.validate(name.value) &&
    !inputEl.value.validate(phoneNum.value) &&
    captcha.value.validate()
  ) {
    try {
      authStore.name = name.value;
      await authStore.signIn('phone', { countryCode: countryCode.value, phoneNum: phoneNum.value });
      router.push({
        hash: '#4',
        params: { countryCode: countryCode.value, phone: phoneNum.value, name: name.value }
      });
    } catch (error) {
      if (error.code === AuthErrorCodes.CAPTCHA_CHECK_FAILED) {
        captcha.value.invalidate('Captcha check failed, please try again');
      }
    }
  }
  isVerifying.value = false;
};
</script>

<template>
  <section class="name-input">
    <InputText
      ref="nameInputEl"
      type="text"
      placeholder="Name"
      v-model="name"
      :attrs="{ spellcheck: false, autocomplete: 'off' }"
      :validator="validateName"
    />
  </section>
  <section class="country-input">
    <CountryInput @select="(country) => (countryCode = country[2])" />
    <InputText
      ref="inputEl"
      class="flex-1"
      type="tel"
      placeholder="Phone Number"
      v-model="phoneNum"
      :attrs="{ spellcheck: false, autocomplete: 'off' }"
      :validator="validatePhone"
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
  margin-top: 0;
}
.name-input span {
  width: 100%;
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
