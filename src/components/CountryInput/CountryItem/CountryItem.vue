<script setup>
defineProps({
  isocode: String,
  name: String,
  code: String
});
</script>

<template>
  <div class="title">
    <span :class="['flag', `flag-${isocode}`]"></span>
    <span class="name">{{ name }}</span>
  </div>
  <span class="code">+{{ code }}</span>
</template>

<style scoped>
.flag {
  display: inline-block;
  background-image: url('/assets/images/flags.png');
  background-size: 100% auto;
  width: 1.5rem;
  height: 0.875rem;
  margin-right: 0.25rem;
  vertical-align: top;
  margin-top: 0.33rem;
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
.title {
  text-wrap: nowrap;
}
</style>
