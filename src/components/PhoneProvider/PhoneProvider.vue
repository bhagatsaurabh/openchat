<script setup>
import { onMounted, ref } from 'vue';
import { RecaptchaVerifier, getAuth, signInWithPhoneNumber } from 'firebase/auth';

import { app } from '@/config/firebase';
import { useAuthStore } from '@/stores/auth';
import Button from '../Common/Button/Button.vue';
import InputText from '../Common/InputText/InputText.vue';
import CountryInput from '@/components/CountryInput/CountryInput.vue';

let verifier = null;
let confirmationResult = null;
const auth = getAuth(app);
const countryCode = ref(null);

const phoneNum = ref(null);
const authStore = useAuthStore();

const validatePhoneNumber = () => {
  if (!phoneNum.value) return false;

  const phoneUtil = window.libphonenumber.PhoneNumberUtil.getInstance();
  try {
    return phoneUtil.isValidNumber(phoneUtil.parse(phoneNum));
  } catch (error) {
    console.log(error);
    return false;
  }
};
const verifyPhoneNumber = async () => {
  try {
    confirmationResult = await signInWithPhoneNumber(
      auth,
      `+${countryCode.value}${phoneNum.value}`,
      verifier
    );
  } catch (error) {
    console.log(error);
    verifier.render().then((widgetId) => window.grecaptcha.reset(widgetId));
  }
};
const signIn = async (code) => {
  try {
    const result = await confirmationResult?.confirm(code);
    authStore.setUser(result.user);
  } catch (error) {
    console.log(error);
  }
};

onMounted(async () => {
  verifier = new RecaptchaVerifier(auth, 'phone-recaptcha', {
    size: 'normal',
    callback: (response) => {
      console.log(response);
    },
    'expired-callback': () => {
      console.log('expired');
    }
  });

  await verifier.render();
});
</script>

<template>
  <section class="country-input">
    <CountryInput @select="(country) => (countryCode = country[2])" />
    <InputText
      class="flex-1"
      type="tel"
      placeholder="Phone Number"
      v-model="phoneNum"
      :attrs="{ spellcheck: false, autocomplete: 'off' }"
    />
  </section>
  <section class="captcha">
    <div id="phone-recaptcha"></div>
  </section>
  <section class="controls">
    <Button accented>Verify</Button>
  </section>
  <section class="notice">
    <span> By tapping Verify, an SMS may be sent. Message & data rates may apply. </span>
  </section>
</template>

<style scoped>
.country-input,
.captcha {
  margin: auto;
  width: max-content;
  margin-top: 1rem;
}
.country-input {
  display: flex;
  align-items: flex-start;
}
.controls {
  margin-top: 2rem;
}
.controls button {
  margin-left: auto;
}
.notice {
  margin-top: 3rem;
}
</style>
