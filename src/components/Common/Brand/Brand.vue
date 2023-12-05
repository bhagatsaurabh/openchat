<script setup>
defineProps({
  type: {
    type: String,
    default: 'header'
  }
});
</script>

<template>
  <div :class="['brand', type]">
    <img class="hero" src="/assets/images/logo.png" alt="OpenChat Hero Image" />
    <span class="title">OpenChat</span>
  </div>
</template>

<style scoped>
.brand.header .hero {
  width: 2rem;
  margin-right: 0.5rem;
  vertical-align: middle;
}
.brand.header .title {
  font-weight: lighter;
  font-size: 1.5rem;
  vertical-align: bottom;
}

.brand.cover {
  text-align: center;
  background-color: var(--c-background-0);
  transition: var(--theme-bg-transition);
}
.brand.cover .hero {
  width: 7rem;
}
.brand.cover .title {
  display: block;
  font-weight: lighter;
  font-size: 2rem;
}
</style>
