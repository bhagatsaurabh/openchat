<script setup>
import { onMounted, ref, watch } from 'vue';

import Spinner from '@/components/Common/Spinner/Spinner.vue';
import Button from '@/components/Common/Button/Button.vue';
import SignInProviders from '@/components/SignInProviders/SignInProviders.vue';
import { useAuthStore } from '@/stores/auth';

const emit = defineEmits(['home']);

const auth = useAuthStore();
const currCard = ref(0);

watch(currCard, () => emit('home', currCard.value === 0));

const handleProvider = (provider) => {
  if (provider === 'phone') currCard.value = 2;
  else currCard.value = 3;
};

onMounted(() => {
  auth.registerAuthListener();
});
</script>

<template>
  <Transition name="fade-slide">
    <div v-show="currCard === 0" class="auth-card">
      <section class="brand">
        <img class="auth-hero" src="/assets/images/logo.png" alt="OpenChat Hero Image" />
        <h2 class="auth-title">OpenChat</h2>
      </section>
      <section class="signin-control">
        <Transition name="fade" appear>
          <Spinner v-show="auth.status === 'pending'" :size="1" :blob-count="4" />
        </Transition>
        <Transition name="fade" appear>
          <Button
            @click="() => (currCard = 1)"
            v-show="auth.status === 'signedout'"
            accented
            id="sign-in-button"
            >Sign In</Button
          >
        </Transition>
      </section>
    </div>
  </Transition>
  <Transition name="fade-slide">
    <div v-show="currCard === 1" class="auth-card">
      <SignInProviders @provider="handleProvider" />
    </div>
  </Transition>
</template>

<style scoped>
.auth-card {
  position: absolute;
  width: 100vw;
}
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

.signin-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  height: 4rem;
}
.signin-control button {
  margin-bottom: 0.5rem;
}

.signin-control .spinner {
  position: absolute;
}
</style>
