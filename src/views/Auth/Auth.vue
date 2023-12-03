<script setup>
import Button from '@/components/Common/Button/Button.vue';
import Icon from '@/components/Common/Icon/Icon.vue';
import Header from '@/components/Common/Header/Header.vue';
</script>

<template>
  <div class="auth-container">
    <Header>
      <template #right>
        <a class="github-link" href="https://github.com/saurabh-prosoft/openchat" target="_blank">
          <Button :complementary="false" circular no-padding no-border>
            <Icon name="github" alt="GitHub icon" :size="5" adaptive />
          </Button>
        </a>
      </template>
    </Header>
    <main class="main">
      <section class="brand">
        <img class="auth-hero" src="/assets/images/logo.png" alt="OpenChat Hero Image" />
        <h2 class="auth-title">OpenChat</h2>
      </section>
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
  opacity: 0.5 !important;
}

.brand {
  text-align: center;
}

.auth-hero {
  width: 7rem;
}

.auth-title {
  font-weight: lighter;
  font-size: 2rem;
}

.main {
  margin: auto;
}
</style>
