import DashboardSidebar from '@/components/dashboard-sidebar';
import SessionKeepAlive from '@/components/session-keepalive';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { FOUNDER_EMAIL } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export default async function FounderLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login&next=/founder');
  const authorized = user.role === 'ADMIN' || (user.role === 'FOUNDER' && user.email.toLowerCase() === FOUNDER_EMAIL);
  if (!authorized) redirect('/dashboard');

  return <div className="app-frame">
    <SessionKeepAlive />
    <DashboardSidebar isFounder />
    <div className="app-main">{children}</div>
  </div>;
}
