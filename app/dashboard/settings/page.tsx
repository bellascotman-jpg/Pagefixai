import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

export default async function WorkspaceSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth?mode=login');
  const memberships = await db.membership.findMany({ where: { userId: user.id }, include: { organization: true } });
  const currentPlan = await db.subscription.findFirst({ where: { userId: user.id, status: { in: ['ACTIVE','LIFETIME'] } }, orderBy: { startedAt: 'desc' } });
  return <main className="dashboard"><header className="topbar"><div><div className="label">ACCOUNT</div><h1 style={{fontSize:26,margin:'4px 0 0'}}>Workspace settings</h1></div></header><div className="container dashboard-main"><p className="muted">Account and workspace information. Sensitive security settings are managed server-side; never paste API keys into this screen.</p>
    <section className="card settings-card"><div className="label">Account</div><h2>{user.name || 'PageFix user'}</h2><p>{user.email}</p><div className="settings-line"><span>Account role</span><strong>{user.role}</strong></div><div className="settings-line"><span>Created</span><strong>{new Date(user.createdAt).toLocaleDateString()}</strong></div><div className="settings-line"><span>Current subscription</span><strong>{currentPlan?.planId.replaceAll('_',' ') || 'No active plan'}</strong></div></section>
    <section className="card settings-card"><div className="label">Workspaces</div>{memberships.length===0 ? <p className="muted">No workspace membership is associated with this account.</p> : memberships.map(m=><div className="settings-line" key={m.id}><span>{m.organization.name}</span><strong>{m.role}</strong></div>)}</section>
    <section className="card settings-card"><div className="label">Privacy & security</div><p className="muted">Review how account and audit information is handled, and how PageFix approaches security.</p><div className="trust-links"><Link href="/privacy">Privacy information →</Link><Link href="/security">Security practices →</Link><Link href="/auth/forgot-password">Reset password →</Link></div></section>
  </div></main>;
}
