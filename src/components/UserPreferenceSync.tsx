import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { i18n, supportedLanguages } from '../i18n';

export function UserPreferenceSync() {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();
  const { setTheme } = useTheme();
  useEffect(() => { if (user && preferences.theme) setTheme(preferences.theme); }, [user?.id, preferences.theme, setTheme]);
  useEffect(() => { if (user && preferences.language && supportedLanguages.some((item) => item.code === preferences.language)) void i18n.changeLanguage(preferences.language); }, [user?.id, preferences.language]);
  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(Boolean(user && preferences.reducedMotion));
    return () => { delete document.documentElement.dataset.reduceMotion; };
  }, [user?.id, preferences.reducedMotion]);
  return null;
}
