<script setup>
import Button from '@/components/Common/Button/Button.vue';
import Icon from '@/components/Common/Icon/Icon.vue';
import Footer from '@/components/Common/Footer/Footer.vue';
import SignIn from '@/components/SignIn/SignIn.vue';
</script>

<template>
  <div class="auth-container">
    <Footer>
      <template #right>
        <a class="github-link" href="https://github.com/saurabh-prosoft/openchat" target="_blank">
          <Button :complementary="false" circular no-padding no-border>
            <Icon name="github" alt="GitHub icon" :size="5" adaptive />
          </Button>
        </a>
      </template>
    </Footer>
    <main class="main">
      <SignIn />
    </main>
    <footer>The Footer</footer>
  </div>
</template>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  place-items: center;
  flex-direction: column;
}
.auth-container header {
  position: fixed;
  height: var(--header-height);
  display: flex;
  justify-content: space-between;
}
.github-link:deep(img) {
  opacity: 0.4 !important;
}
.main {
  margin: auto;
}
</style>
