<script setup>
import { onMounted, ref, watch } from 'vue';

import countries from '@/assets/data/country.json';
import Button from '@/components/Common/Button/Button.vue';
import Dropdown from '@/components/Common/Dropdown/Dropdown.vue';
import Icon from '../Common/Icon/Icon.vue';
import CountryItem from './CountryItem/CountryItem.vue';

const emit = defineEmits(['select']);
const isCntrsOpen = ref(false);
const selected = ref(countries.find((item) => item[1] === navigator.language.split('-')[1].toLowerCase()));

const getItemAttrs = (item) => ({ name: item[0], isocode: item[1], code: item[2] });

watch(selected, () => emit('select', selected.value));

onMounted(() => emit('select', selected.value));

defineExpose({ countries });
</script>

<template>
  <div class="mt-1p5">
    <Button
      @click="isCntrsOpen = !isCntrsOpen"
      class="country-control mr-1"
      :class="{ highlight: isCntrsOpen }"
      :complementary="false"
    >
      <span :class="['flag', `flag-${selected[1]}`]"></span>
      <span class="code">+{{ selected[2] }}</span>
      <Icon name="chevron-down" alt="Chevron Icon" :size="0.8" adaptive accented />
    </Button>
    <Dropdown
      class="list"
      :open="isCntrsOpen"
      :items="countries"
      itemKey="1"
      :item-component="CountryItem"
      :item-attributes="getItemAttrs"
      :selected="selected"
      @dismiss="isCntrsOpen = false"
      @select="(country) => (selected = country)"
    />
  </div>
</template>

<style scoped>
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
.list {
  top: calc(100% - 1.5rem);
}

.flag {
  display: inline-block;
  background-image: url('/assets/images/flags.png');
  background-size: 100% auto;
  width: 1.5rem;
  height: 0.875rem;
  margin-right: 0.25rem;
}
.code {
  margin-right: 0.25rem;
  float: right;
  width: 2.5rem;
  text-align: right;
}
.name {
  display: inline-block;
  text-wrap: balance;
  padding-right: 2rem;
}
</style>
