<script setup>
import { onMounted, ref, watch } from 'vue';
import { RecaptchaVerifier, getAuth, signInWithPhoneNumber } from 'firebase/auth';

import countries from '@/assets/data/country.json';
import { app } from '@/config/firebase';
import { useAuthStore } from '@/stores/auth';
import Button from '../Common/Button/Button.vue';
import Icon from '../Common/Icon/Icon.vue';
import InputText from '../Common/InputText/InputText.vue';
import Backdrop from '@/components/Common/Backdrop/Backdrop.vue';

let verifier = null;
let confirmationResult = null;
const auth = getAuth(app);
const region = ref(navigator.language.split('-')[1].toLowerCase());
const selectedIdx = ref(99);
const phoneNum = ref(null);
const isCntrsOpen = ref(false);
const listEl = ref(null);
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
      `+${countries[selectedIdx.value].value[2]}${phoneNum.value}`,
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
const handleKey = (e) => {
  if (isCntrsOpen.value) {
    let newIdx = selectedIdx.value;
    if (e.code === 'ArrowUp') {
      newIdx -= 1;
    } else if (e.code === 'ArrowDown') {
      newIdx += 1;
    }
    selectedIdx.value = (newIdx < 0 ? countries.length - Math.abs(newIdx) : newIdx) % countries.length;
  }
};
const handleSelect = (idx) => {
  selectedIdx.value = idx;
  isCntrsOpen.value = false;
};

watch(selectedIdx, () => {
  listEl.value?.children[selectedIdx.value].scrollIntoView({ behavior: 'instant', block: 'center' });
  region.value = countries[selectedIdx.value][1];
});
watch(isCntrsOpen, () => {
  if (isCntrsOpen.value) {
    listEl.value?.children[selectedIdx.value].scrollIntoView({ behavior: 'instant', block: 'center' });
  }
});

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

defineExpose({ countries });
</script>

<template>
  <section @keydown="handleKey" class="country-input">
    <Button
      @click="isCntrsOpen = !isCntrsOpen"
      class="country-control mr-1"
      :class="{ highlight: isCntrsOpen }"
      :complementary="false"
    >
      <span :class="['flag', `flag-${region}`]"></span>
      <span class="country-code">+{{ countries[selectedIdx][2] }}</span>
      <Icon name="chevron-down" alt="Chevron Icon" :size="0.8" adaptive accented />
    </Button>
    <InputText
      class="flex-1"
      type="tel"
      placeholder="Phone Number"
      v-model="phoneNum"
      :outline="false"
      :attrs="{ spellcheck: false, autocomplete: 'off' }"
    />
    <Backdrop :show="isCntrsOpen" @dismiss="isCntrsOpen = false" clear />
    <section class="countries-list" :class="{ open: isCntrsOpen }">
      <ul
        ref="listEl"
        class="scroll-shadows"
        @keydown="
          (e) => {
            if (['ArrowUp', 'ArrowDown'].includes(e.code)) {
              e.preventDefault();
            }
          }
        "
      >
        <li
          tabindex="0"
          v-for="(cntr, idx) in countries"
          :key="cntr[2]"
          :class="{ selected: cntr[1] === countries[selectedIdx][1] }"
          @click="() => handleSelect(idx)"
        >
          <div>
            <span :class="['flag', `flag-${cntr[1]}`]"></span>
            <span class="country-name">{{ cntr[0] }}</span>
          </div>
          <span class="country-code">+{{ cntr[2] }}</span>
        </li>
      </ul>
    </section>
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
}
.captcha div {
  margin-top: 2rem;
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
  box-shadow: 2px 2px 4px 0px var(--c-shadow-0);
  z-index: 101;
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
  width: 2.5rem;
  text-align: right;
}

.countries-list {
  position: absolute;
  top: calc(100%);
  background-color: var(--c-background-2);
  max-height: 0vh;
  overflow: hidden;
  transition:
    max-height var(--fx-transition-duration-2) ease,
    clip-path var(--fx-transition-duration-1) ease;
  clip-path: polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%);
  pointer-events: none;
  box-shadow: 2px 2px 4px 0px var(--c-shadow-0);
}
.countries-list.open {
  max-height: 39vh;
  clip-path: polygon(0% 0%, 105% 0%, 105% 105%, 0% 105%);
  pointer-events: all;
  z-index: 101;
}
.countries-list ul {
  list-style: none;
  padding: 0.5rem;
  max-height: calc(39vh - 1rem);
  user-select: none;
}
.countries-list ul .flag {
  margin-right: 0.5rem;
}
.countries-list ul li {
  display: flex;
  justify-content: space-between;
  width: calc(100% - 2px);
  padding: 0.5rem;
  /* transition:
    background-color var(--fx-transition-duration-0) linear,
    box-shadow var(--fx-transition-duration-0) linear; */
}
.countries-list ul li.selected {
  background-color: #c18eda75 !important;
  box-shadow: 0px 0px 2px 0px;
}
.countries-list ul li div {
  text-wrap: nowrap;
}
.countries-list ul li div .flag {
  display: inline-block;
  vertical-align: top;
  margin-top: 0.33rem;
}
.country-name {
  display: inline-block;
  text-wrap: balance;
  padding-right: 2rem;
}

.flag {
  display: inline-block;
  background-image: url('/assets/images/flags.png');
  background-size: 100% auto;
  width: 1.5rem;
  height: 0.875rem;
  margin-right: 0.25rem;
}

.controls button {
  margin-top: 2rem;
  margin-left: auto;
}
.notice {
  margin-top: 3rem;
}

@media (hover: hover) {
  .countries-list ul li:hover {
    background-color: var(--c-background-1);
    box-shadow: 0px 0px 2px 0px;
    cursor: pointer;
  }
}
</style>
