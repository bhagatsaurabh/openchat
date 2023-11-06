<script setup>
</script>

<template>
  <div class="auth-container">
    <header>
      The Header
    </header>
    <main class="main">
      <section class="brand">
        <img class="auth-hero" src="/assets/images/logo.png" alt="OpenChat Hero Image" />
        <h2 class="auth-title">OpenChat</h2>
      </section>
    </main>
    <footer>
      The Footer
    </footer>
  </div>
</template>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  place-items: center;
  flex-direction: column;
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