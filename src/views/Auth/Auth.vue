<script setup>
import { ref } from 'vue';

import Button from '@/components/Common/Button/Button.vue';
import Icon from '@/components/Common/Icon/Icon.vue';
import Footer from '@/components/Common/Footer/Footer.vue';
import Header from '@/components/Common/Header/Header.vue';
import SignIn from '@/components/SignIn/SignIn.vue';
import Brand from '@/components/Common/Brand/Brand.vue';
import ThemeSelector from '@/components/Common/ThemeSelector/ThemeSelector.vue';

const showHeaderBrand = ref(false);
</script>

<template>
  <div class="auth-container">
    <Header>
      <template #left>
        <Transition name="fade">
          <Brand v-if="showHeaderBrand" />
        </Transition>
      </template>
      <template #right>
        <ThemeSelector class="theme-select" type="vertical" />
      </template>
    </Header>
    <main class="main">
      <SignIn @home="(val) => (showHeaderBrand = !val)" />
    </main>
    <Footer transparent>
      <template #right>
        <a class="github-link" href="https://github.com/saurabh-prosoft/openchat" target="_blank">
          <Button :complementary="false" circular visual>
            <Icon name="github" alt="GitHub icon" :size="5" adaptive />
          </Button>
        </a>
      </template>
    </Footer>
  </div>
</template>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  place-items: center;
  flex-direction: column;
}
.github-link:deep(img) {
  opacity: 0.4 !important;
}
.main {
  width: 100vw;
  min-height: calc(100vh - var(--header-height) - var(--footer-height));
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
.theme-select {
  position: fixed;
  z-index: 50;
  top: 0.5rem;
  right: 0.5rem;
}
</style>
