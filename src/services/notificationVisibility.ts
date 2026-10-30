import type { NotificationItem, User } from '../types';

export function canSeeNotification(user: Pick<User, 'id' | 'role'> | null, note: NotificationItem) {
  if (!user || user.role === 'admin' && note.type === 'booking') return false;
  if (note.userId) return note.userId === user.id;
  if (note.type === 'booking') return user.role === 'manager';
  return user.role !== 'user';
}
