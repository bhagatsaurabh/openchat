import { useAuthStore } from '@/stores/auth';
import { useGroupsStore } from '@/stores/groups';

export const authGuard = async (_to, _from, next) => {
  const auth = useAuthStore();

  if (auth.user) {
    next();
  } else {
    next('/auth');
  }
};

export const noAuthGuard = async () => {
  const auth = useAuthStore();
  return !auth.user;
};

export const chatGuard = async () => {
  const groups = useGroupsStore();
  return !!groups.activeGroup;
};
