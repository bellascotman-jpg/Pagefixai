import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import RetentionWorkspace from '@/components/retention-workspace';

export default async function RetentionIntelligencePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  return <main className="dashboard">
    <header className="topbar"><div><div className="label">COMMERCE INTELLIGENCE / RETENTION & LIFECYCLE</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>Retention & SaaS onboarding intelligence</h1></div></header>
    <div className="container dashboard-main"><RetentionWorkspace /></div>
  </main>;
}
