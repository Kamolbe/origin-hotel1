import { PersonalDataSettings } from '../components/PersonalDataSettings';
import { SettingsIdentity } from '../components/SettingsIdentity';

export function ProfilePage() {
  return <div className="animate-rise-in"><SettingsIdentity withProfile /><PersonalDataSettings /></div>;
}
