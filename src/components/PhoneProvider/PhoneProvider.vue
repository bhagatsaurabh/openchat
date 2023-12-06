<script setup>
import { onMounted, ref } from 'vue';
import { RecaptchaVerifier, getAuth, signInWithPhoneNumber } from 'firebase/auth';

import countries from '@/assets/data/country.json';
import { app } from '@/config/firebase';
import { useAuthStore } from '@/stores/auth';
import Button from '../Common/Button/Button.vue';
import Icon from '../Common/Icon/Icon.vue';
import InputText from '../Common/InputText/InputText.vue';

let verifier = null;
let confirmationResult = null;
const auth = getAuth(app);
const region = ref(navigator.language.split('-')[1].toLowerCase());
const country = ref(countries[99]);
const phoneNum = ref(null);
const isCntrsOpen = ref(false);
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
    confirmationResult = await signInWithPhoneNumber(auth, `+${country.value[2]}${phoneNum.value}`, verifier);
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

onMounted(() => {
  verifier = new RecaptchaVerifier(auth, 'phone-recaptcha', {
    size: 'normal',
    callback: (response) => {
      console.log(response);
    },
    'expired-callback': () => {
      console.log('expired');
    }
  });
});

defineExpose({ countries });
</script>

<template>
  <section class="country-input">
    <Button
      @click="isCntrsOpen = !isCntrsOpen"
      class="country-control mr-1"
      :class="{ highlight: isCntrsOpen }"
      :complementary="false"
    >
      <span :class="['flag', `flag-${region}`]"></span>
      <span class="country-code">+{{ country[2] }}</span>
      <Icon name="chevron-down" alt="Chevron Icon" :size="0.8" adaptive accented />
    </Button>
    <InputText
      type="tel"
      placeholder="Phone Number"
      v-model="phoneNum"
      :outline="false"
      :attrs="{ spellcheck: false, autocomplete: 'off' }"
    />
    <section class="countries-list" :class="{ open: isCntrsOpen }">
      <ul
        class="scroll-shadows"
        @keydown="
          (e) => {
            if (['ArrowUp', 'ArrowDown'].includes(e.code)) {
              e.preventDefault();
            }
          }
        "
      >
        <li tabindex="0" v-for="country in countries" :key="country[2]">
          <span :class="['flag', `flag-${country[1]}`]"></span>
          <span>{{ country[0] }}</span>
          <span class="country-code">+{{ country[2] }}</span>
        </li>
      </ul>
    </section>
  </section>

  <section class="captcha">
    <div id="phone-recaptcha"></div>
  </section>
</template>

<style scoped>
.country-input,
.captcha {
  margin: auto;
  width: max-content;
}
.country-input {
  display: flex;
  align-items: flex-start;
}
.country-control {
  box-shadow: none;
  border-radius: 0;
  border: none;
}
.country-control::after {
  content: '';
  display: block;
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: gray;
}
.country-control.highlight {
  background-color: var(--c-background-2);
}
.country-control span {
  display: inline-block;
}
.country-control:deep(.icon-container) {
  font-size: 0;
}
.country-code {
  margin-right: 0.25rem;
  float: right;
}

.countries-list {
  position: absolute;
  top: calc(100% + 1.5rem);
  background-color: var(--c-background-2);
  max-height: 0vh;
  overflow-y: auto;
  transition: max-height var(--fx-transition-duration-1) ease;
  pointer-events: none;
}
.countries-list.open {
  max-height: 39vh;
  pointer-events: all;
}
.countries-list ul {
  list-style: none;
  padding: 1rem;
}
.countries-list ul .flag {
  margin-right: 0.5rem;
}

.flag {
  display: inline-block;
  background-image: url('/assets/images/flags.png');
  background-size: 100% auto;
  width: 1.5rem;
  height: 0.875rem;
  margin-right: 0.25rem;
}
</style>
