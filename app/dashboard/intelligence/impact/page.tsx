import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import ImpactScenarioCalculator from '@/components/impact-scenario-calculator';

export default async function ImpactAnalysisPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  return <main className="dashboard">
    <header className="topbar"><div><div className="label">COMMERCE INTELLIGENCE / MEASUREMENT</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>Commercial impact analysis</h1></div></header>
    <div className="container dashboard-main">
      <ImpactScenarioCalculator />
    </div>
  </main>;
}
