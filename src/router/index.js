import { createRouter, createWebHistory } from 'vue-router';

import Auth from '@/views/Auth/Auth.vue';
import Chat from '@/views/Chat/Chat.vue';
import Settings from '@/views/Settings/Settings.vue';
import { authGuard } from './guards';

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
      component: Auth
    }
  ]
});

export default router;
