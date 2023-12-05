<script setup>
import { ref } from 'vue';

import Button from '../Common/Button/Button.vue';
import Icon from '../Common/Icon/Icon.vue';
import InputText from '../Common/InputText/InputText.vue';
import countries from '@/assets/data/country.json';

const region = ref(navigator.language.split('-')[1].toLowerCase());
const country = ref(countries[99]);
</script>

<template>
  <section class="country-input">
    <Button class="country-control" :complementary="false">
      <span :class="['flag', `flag-${region}`]"></span>
      <span class="country-code">+{{ country[2] }}</span>
      <Icon name="chevron-down" alt="Chevron Icon" :size="0.8" adaptive accented />
    </Button>
    <InputText />
  </section>
</template>

<style scoped>
.country-input {
  display: flex;
  margin: auto;
  width: max-content;
}
.country-control {
  box-shadow: none;
  border-radius: 0;
  border-bottom: 1px solid gray;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
}
.country-control span {
  display: inline-block;
}
.country-code {
  vertical-align: -12%;
  margin-right: 0.25rem;
}

.flag {
  vertical-align: -18%;
  background-image: url('/assets/images/flags.png');
  background-size: 100% auto;
  width: 1.5rem;
  height: 0.875rem;
  margin-right: 0.25rem;
}
</style>
