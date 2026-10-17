import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import ImpactScenarioCalculator from '@/components/impact-scenario-calculator';

export default async function ImpactAnalysisPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  return <main className="dashboard">
    <header className="topbar"><div><div className="label">COMMERCE INTELLIGENCE / MEASUREMENT</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>Commercial impact analysis</h1></div></header>
    <div className="container dashboard-main">
      <p className="muted" style={{maxWidth:850,lineHeight:1.8}}>Explore the financial implications of a hypothetical change using figures you provide. This tool calculates scenarios; it does not claim revenue loss, forecast performance or report measured recovery.</p>
      <ImpactScenarioCalculator />
    </div>
  </main>;
}
