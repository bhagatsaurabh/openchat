import { useAuthStore } from '@/stores/auth';

export const authGuard = async (_to, _from, next) => {
  const auth = useAuthStore();

  if (auth.user) {
    next();
  } else {
    next('/auth');
  }
};
