import { createRouter, createWebHistory } from 'vue-router';

import { authGuard, noAuthGuard } from './guards';
import Auth from '@/views/Auth/Auth.vue';
import Chat from '@/views/Chat/Chat.vue';
import Settings from '@/views/Settings/Settings.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: Chat,
      beforeEnter: authGuard
    },
    {
      path: '/settings',
      component: Settings,
      beforeEnter: authGuard
    },
    {
      path: '/auth',
      component: Auth,
      beforeEnter: noAuthGuard
    }
  ]
});

export default router;
