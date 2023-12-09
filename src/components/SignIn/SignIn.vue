<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import Spinner from '@/components/Common/Spinner/Spinner.vue';
import Button from '@/components/Common/Button/Button.vue';
import SignInProviders from '@/components/SignInProviders/SignInProviders.vue';
import Brand from '../Common/Brand/Brand.vue';
import PhoneProvider from '@/components/PhoneProvider/PhoneProvider.vue';
import AnonymousProvider from '@/components/AnonymousProvider/AnonymousProvider.vue';
import PhoneProviderVerify from '@/components/PhoneProviderVerify/PhoneProviderVerify.vue';
import { useAuthStore } from '@/stores/auth';

const emit = defineEmits(['home']);

const router = useRouter();
const auth = useAuthStore();

const prevStep = ref(null);
const currStep = ref(0);
if (prevStep.value === null && router.currentRoute.value.hash !== '') {
  router.replace({ hash: '' });
  prevStep.value = 0;
}
const transitionName = computed(() =>
  currStep.value < prevStep.value ? 'fade-slide-rtl' : 'fade-slide-ltr'
);

watch(currStep, () => emit('home', currStep.value === 0));

const handleProvider = (provider) => {
  if (provider === 'phone') handleForward(2);
  else handleForward(3);
};
const handleForward = (nextStep) => {
  router.push({ hash: `#${nextStep}` });
};

let unregisterGuard = () => {};
onMounted(() => {
  auth.registerAuthListener();

  unregisterGuard = router.beforeEach((to, from, next) => {
    prevStep.value = parseInt(from.hash.substring(1) || 0);
    currStep.value = parseInt(to.hash.substring(1) || 0);
    next();
  });
});
onBeforeUnmount(() => unregisterGuard());
</script>

<template>
  <Transition :name="transitionName">
    <div v-show="currStep === 0" class="auth-card">
      <Brand type="cover" />
      <section class="signin-control">
        <Transition name="fade" appear>
          <Spinner v-show="auth.status === 'pending'" :size="1" :blob-count="4" />
        </Transition>
        <Transition name="fade" appear>
          <Button @click="handleForward(1)" v-show="auth.status === 'signedout'" accented id="sign-in-button">
            Sign In
          </Button>
        </Transition>
      </section>
    </div>
  </Transition>
  <Transition :name="transitionName">
    <div v-show="currStep === 1" class="auth-card">
      <SignInProviders @provider="handleProvider" />
    </div>
  </Transition>
  <Transition :name="transitionName">
    <div v-show="currStep === 2" class="auth-card">
      <PhoneProvider />
    </div>
  </Transition>
  <Transition :name="transitionName">
    <div v-show="currStep === 4" class="auth-card">
      <PhoneProviderVerify />
    </div>
  </Transition>
  <Transition :name="transitionName">
    <div v-show="currStep === 3" class="auth-card">
      <AnonymousProvider />
    </div>
  </Transition>
</template>

<style scoped>
.auth-card {
  position: absolute;
  width: 100vw;
  padding: 0 1rem 0 1rem;
}
.auth-card:deep(section) {
  width: 100%;
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
