import { Check, Crown, LockKeyhole, Pencil, ShieldCheck, UserRound } from 'lucide-react';
import type { SystemRolePermission } from '../types';

const roleInfo = {
  admin: { title: 'Administrator', description: 'Umumiy nazorat, ishchilar va oyliklar', icon: Crown },
  manager: { title: 'Manager', description: 'Xonalar, bronlar, mehmonlar, moliya va sayt sozlamalari', icon: ShieldCheck },
  moderator: { title: 'Moderator', description: 'Bron va mehmonlar bilan ishlash', icon: ShieldCheck },
  editor: { title: 'Muharrir', description: 'Sayt matnlari va media', icon: Pencil },
  user: { title: 'Mehmon', description: 'Shaxsiy hisob va bronlar', icon: UserRound },
};

export function RolesOverview({ roles }: { roles: SystemRolePermission[] }) {
  return <div className="roles-overview"><p className="roles-intro">Har bir rol uchun ko‘zda tutilgan imkoniyatlar.</p><div className="roles-list">{[{ role: 'admin' as const, permissions: ['Umumiy nazorat', 'Ishchilar', 'Oyliklar'] }, { role: 'manager' as const, permissions: ['Xonalar va bronlar', 'Mehmonlar va foydalanuvchilar', 'Moliya va hisobotlar', 'Sayt sozlamalari'] }, ...roles.filter((role)=>!['admin','manager'].includes(role.role))].map((role) => {
    const info = roleInfo[role.role];
    const Icon = info.icon;
    return <article key={role.role} className={`role-card ${role.role === 'admin' ? 'role-card-admin' : ''}`}>
      <div className="role-identity"><span className="role-icon"><Icon size={20} strokeWidth={1.7} /></span><div className="min-w-0"><h3>{info.title}</h3><p>{info.description}</p></div></div>
      <div className="role-permissions"><p className="role-count">{role.permissions.length} ta ruxsat</p><ul aria-label={`${info.title} ruxsatlari`}>{role.permissions.map((permission) => <li key={permission}><Check size={13} strokeWidth={2.3} /><span>{permission}</span></li>)}</ul></div>
    </article>;
  })}</div><div className="roles-note"><LockKeyhole size={16} /><p>Bu ro‘yxat rollarning demo ko‘rinishi. Haqiqiy ruxsatlar backend darajasida tekshirilishi kerak.</p></div></div>;
}
