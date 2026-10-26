import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import type { UserPreferences } from '../types';

export const DEFAULT_USER_PREFERENCES: UserPreferences = { reducedMotion: false, defaultGuests: 2, roomType: 'all', bookingNote: '' };
export function useUserPreferences() {
  const { user } = useAuth();
  const { data, updateData } = useAppData();
  const preferences = { ...DEFAULT_USER_PREFERENCES, ...data.users.find((item) => item.id === user?.id)?.preferences };
  function save(patch: Partial<UserPreferences>) {
    if (!user) return;
    updateData((state) => ({ ...state, users: state.users.map((item) => item.id === user.id ? { ...item, preferences: { ...item.preferences, ...patch } } : item) }));
  }
  return { preferences, save };
}
