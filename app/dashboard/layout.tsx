import DashboardSidebar from '@/components/dashboard-sidebar';

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="app-frame"><DashboardSidebar /><div className="app-main">{children}</div></div>;
}
