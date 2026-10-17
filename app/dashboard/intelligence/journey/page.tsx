import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import MessageMatchWorkspace from '@/components/message-match-workspace';

export default async function JourneyIntelligencePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  return <main className="dashboard">
    <header className="topbar"><div><div className="label">COMMERCE INTELLIGENCE / TRAFFIC & CUSTOMER JOURNEY</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>Traffic, advertising & customer journey</h1></div></header>
    <div className="container dashboard-main">
      <p className="muted" style={{maxWidth:850,lineHeight:1.8}}>Compare the commercial promises in an ad or social post with the text visible on its destination page. This first-stage tool checks a limited set of literal offer signals; it does not claim semantic certainty, ad profitability or actual wasted spend.</p>
      <MessageMatchWorkspace />
    </div>
  </main>;
}
