<script setup>
import { ref } from 'vue';

import { useAuthStore } from '@/stores/auth';
import Icon from '../Common/Icon/Icon.vue';
import Button from '../Common/Button/Button.vue';
import InputText from '../Common/InputText/InputText.vue';
import { nameRegex } from '@/utils/constants';

const authStore = useAuthStore();
const isBusy = ref(false);
const name = ref(null);
const inputEl = ref(null);

const handleContinue = async () => {
  if (inputEl.value.validate(name.value)) return;

  isBusy.value = true;
  authStore.name = name.value;
  await authStore.signIn('guest');
  isBusy.value = false;
};
const validateName = (val) => {
  if (!val) return 'Provide a name';
  if (!nameRegex.test(val)) {
    return 'Enter a valid name';
  }
  return null;
};
</script>

<template>
  <section class="title mb-2">
    <h2>Continue as Guest</h2>
  </section>
  <section class="warning mb-1">
    <div class="mb-1">
      <Icon class="v-middle mr-0p5" alt="warn" name="warn" singular />
      <h3 class="d-inline">
        {{
          'Only this device will be able to access the newly created Guest account and will be permanently deleted/lost if:'
        }}
      </h3>
    </div>
    <ul>
      <li><h4>You clear your browser data</h4></li>
      <li><h4>You sign-out</h4></li>
      <li><h4>You don't verify with a phone number within 30 days</h4></li>
    </ul>
  </section>
  <section class="limitations mb-2">
    <div class="mb-1">
      <Icon class="v-middle mr-0p5" alt="warn" name="warn" singular />
      <h3 class="d-inline">Guest accounts have following limitations:</h3>
    </div>
    <h4>
      <ul>
        <li>You won't be able to backup any messages or media</li>
        <li>You won't be able to access this account on another device</li>
        <li>You will appear as an unverified user to others</li>
      </ul>
    </h4>
  </section>
  <section class="name-input">
    <InputText
      ref="inputEl"
      type="text"
      placeholder="Name"
      v-model="name"
      :attrs="{ spellcheck: false, autocomplete: 'off' }"
      :validator="validateName"
    />
  </section>
  <section class="controls">
    <Button class="continue-action" @click="handleContinue" :busy="isBusy" async accented>Continue</Button>
  </section>
</template>

<style scoped>
.continue-action {
  margin-left: auto;
}
.name-input span {
  width: 100%;
}
</style>
