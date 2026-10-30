import type { User } from '../types';
export const MAX_MANAGERS = 3;
export function managerAccounts(users: User[]) {
  return users.filter((user) => user.isManagerAccount ?? user.role === 'manager');
}

export function canEditSite(user: Pick<User, 'id' | 'role'> | null, users: User[]) {
  return user?.role === 'admin' || user?.role === 'manager' && users.some((item) => item.id === user.id && item.isActive && item.canEditSite === true);
}
