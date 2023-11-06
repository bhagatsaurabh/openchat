import { createRouter, createWebHistory } from 'vue-router';

import AuthVue from '@/views/Auth/Auth.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AuthVue
    }
  ]
});

export default router;
