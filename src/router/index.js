import { createRouter, createWebHistory } from 'vue-router';

import { authGuard, chatGuard, noAuthGuard } from './guards';
import Auth from '@/views/Auth/Auth.vue';
import Chat from '@/views/Chat/Chat.vue';
import Settings from '@/views/Settings/Settings.vue';
import Interface from '@/views/Interface/Interface.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: Chat,
      beforeEnter: authGuard,
      children: [
        {
          path: 'chat',
          component: Interface,
          beforeEnter: chatGuard
        }
      ]
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
