import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import PromiseLedgerClient from '@/components/promise-ledger-client';

export default async function PromiseLedgerPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  return <main className="dashboard">
    <header className="topbar"><div><div className="label">COMMERCE INTELLIGENCE / CLAIMS</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>Promise Ledger</h1></div></header>
    <div className="container dashboard-main">
      <p className="muted" style={{maxWidth:850,lineHeight:1.8}}>Keep a source-linked register of commercial claims—delivery promises, compatibility statements, discounts, warranty language and return conditions. This is a versioned record-keeping foundation; automatic cross-source contradiction detection is a separate capability and is not implied by saving a claim.</p>
      <PromiseLedgerClient />
    </div>
  </main>;
}
