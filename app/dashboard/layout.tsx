import './overview.css';
import DashboardSidebar from '@/components/dashboard-sidebar';
import SessionKeepAlive from '@/components/session-keepalive';
import { getCurrentUser } from '@/lib/auth/session';
import { FOUNDER_EMAIL } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const isFounder = Boolean(user && (user.role === 'ADMIN' || (user.role === 'FOUNDER' && user.email.toLowerCase() === FOUNDER_EMAIL)));
  return <div className="app-frame"><SessionKeepAlive /><DashboardSidebar isFounder={isFounder} /><div className="app-main">{children}</div></div>;
}
