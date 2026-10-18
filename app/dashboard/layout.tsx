import DashboardSidebar from '@/components/dashboard-sidebar';
import SessionKeepAlive from '@/components/session-keepalive';

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="app-frame"><SessionKeepAlive /><DashboardSidebar /><div className="app-main">{children}</div></div>;
}
