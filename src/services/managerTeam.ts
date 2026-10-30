import type { User } from '../types';
export const MAX_MANAGERS = 3;
export function managerAccounts(users: User[]) {
  return users.filter((user) => user.isManagerAccount ?? user.role === 'manager');
}
