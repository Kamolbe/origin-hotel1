import { ManagerConsole } from '../components/ManagerConsole';
import { PageHeader } from '../components/PageHeader';
export function ManagersPage() {
  return <div className="space-y-5"><PageHeader eyebrow="Administrator · Jamoa nazorati" title="Managerlar" description="Manager hisoblari, kirishlar va tizimda bajarilgan amallarni kuzating." /><ManagerConsole /></div>;
}
