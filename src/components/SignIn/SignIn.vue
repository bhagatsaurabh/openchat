<script setup>
import { Transition } from 'vue';
import Spinner from '@/components/Common/Spinner/Spinner.vue';
import Button from '@/components/Common/Button/Button.vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
</script>

<template>
  <section class="brand">
    <img class="auth-hero" src="/assets/images/logo.png" alt="OpenChat Hero Image" />
    <h2 class="auth-title">OpenChat</h2>
  </section>
  <section class="signin-control">
    <Spinner :size="1" :blob-count="4" />
    <Transition name="fade">
      <Button v-if="!auth.status" accented>Sign In</Button>
    </Transition>
  </section>
</template>

<style scoped>
.brand {
  text-align: center;
  background-color: var(--c-background-0);
  transition: var(--theme-bg-transition);
}
.auth-hero {
  width: 7rem;
}
.auth-title {
  font-weight: lighter;
  font-size: 2rem;
}

@keyframes fade-slide {
  0% {
    max-height: 0rem;
    opacity: 0;
  }
  100% {
    opacity: 1;
    max-height: 7rem;
  }
}

.signin-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-height: 0rem;
  overflow: hidden;
  margin: 1rem;
  animation: fade-slide 1s cubic-bezier(0, 0, 0.33, 0.99) 0.2s 1 forwards normal;
}
.signin-control button {
  margin-bottom: 0.5rem;
}
</style>
