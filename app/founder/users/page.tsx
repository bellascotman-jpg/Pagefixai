'use client';

import Link from 'next/link';
import { FOUNDER_EMAIL } from '@/lib/plans';
import { useEffect, useMemo, useState } from 'react';

type UserRow = {
  id: string; name: string | null; email: string; role: string; createdAt: string;
  accountType: 'FOUNDER' | 'PAID' | 'FREE' | 'COMPLIMENTARY';
  hasActiveSession: boolean; lastSessionAt: string | null; successfulPayment: boolean;
  subscriptions: { id: string; planId: string; status: string; expiresAt: string | null; startedAt: string }[];
  affiliateProfile: { code: string; status: string; commissionRate: number } | null;
  _count: { audits: number; payments: number };
};

const plans = [
  { id: 'starter_monthly', label: 'Starter monthly' },
  { id: 'starter_annual', label: 'Starter annual' },
  { id: 'growth_monthly', label: 'Growth monthly' },
  { id: 'growth_annual', label: 'Growth annual' },
  { id: 'agency_monthly', label: 'Agency monthly' },
  { id: 'agency_annual', label: 'Agency annual' },
  { id: 'founding_lifetime', label: 'Founding Lifetime' },
];

const accountTypeLabel: Record<UserRow['accountType'], string> = {
  FOUNDER: 'Founder',
  PAID: 'Paid customer',
  FREE: 'Free account',
  COMPLIMENTARY: 'Complimentary access',
};

export default function FounderUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState('');
  const [selectedPlans, setSelectedPlans] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || (response.status === 403 ? 'Founder access is required.' : 'Could not load users.'));
      setUsers(data.users || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load users.');
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function act(user: UserRow, action: 'grant_plan' | 'revoke_plan') {
    const planId = selectedPlans[user.id] || 'starter_monthly';
    const message = action === 'grant_plan'
      ? 'Grant ' + (plans.find(p => p.id === planId)?.label || planId) + ' access to ' + user.email + '? Their current active plan will be replaced.'
      : 'Revoke active subscription access for ' + user.email + '? This does not delete the account or its audit history.';
    if (!window.confirm(message)) return;
    setBusy(user.id); setError('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action, ...(action === 'grant_plan' ? { planId } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'The requested change failed.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'The requested change failed.'); }
    finally { setBusy(''); }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u => !q || [u.email, u.name || '', u.role, u.accountType, u.subscriptions[0]?.planId || ''].some(v => v.toLowerCase().includes(q)));
  }, [users, search]);

  const counts = useMemo(() => ({
    founder: users.filter(u => u.accountType === 'FOUNDER').length,
    paid: users.filter(u => u.accountType === 'PAID').length,
    free: users.filter(u => u.accountType === 'FREE').length,
    complimentary: users.filter(u => u.accountType === 'COMPLIMENTARY').length,
    sessions: users.filter(u => u.hasActiveSession).length,
    audits: users.reduce((n, u) => n + u._count.audits, 0),
  }), [users]);

  return <main className="dashboard">
    <header className="topbar"><div><div className="label">PAGEFIX AI / FOUNDER OPERATIONS</div><h1 style={{fontSize:25,margin:'4px 0 0'}}>User management</h1></div><Link href="/founder" className="button button-secondary">← Founder console</Link></header>
    <div className="container dashboard-main">
      <p className="muted">Customer access, payment-backed account type and stored session status. “Active session” means an unexpired session record, not proof the person is currently online. Account types are based on successful payment records and active subscriptions; complimentary/admin-granted plans are not counted as paid.</p>
      <div className="grid grid-3" style={{marginTop:22}}>
        <div className="card"><div className="label">Accounts loaded (up to 200)</div><div className="stat">{users.length}</div></div>
        <div className="card"><div className="label">Paid customers</div><div className="stat">{counts.paid}</div></div>
        <div className="card"><div className="label">Free accounts</div><div className="stat">{counts.free}</div></div>
        <div className="card"><div className="label">Complimentary access</div><div className="stat">{counts.complimentary}</div></div>
        <div className="card"><div className="label">Accounts with unexpired sessions</div><div className="stat">{counts.sessions}</div></div>
        <div className="card"><div className="label">Founder/admin · audits in loaded accounts</div><div className="stat">{counts.founder} · {counts.audits}</div></div>
      </div>
      <section className="card" style={{marginTop:22}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><div><h2 style={{margin:'0 0 4px'}}>Customer accounts</h2><p className="muted" style={{margin:0}}>Showing up to 200 most recently created accounts. Refresh to load current records.</p></div><button className="button button-secondary" type="button" onClick={() => void load()} disabled={loading}>Refresh</button></div>
        <label style={{display:'block',marginTop:18}}>Search accounts<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, email, role, plan or paid/free status" style={{display:'block',width:'100%',marginTop:6}}/></label>
        {error && <div className="error-box" role="alert" style={{marginTop:16}}>{error}</div>}
        {loading ? <p className="muted" style={{padding:20}}>Loading account records…</p> : filtered.length === 0 ? <p className="muted" style={{padding:20}}>No matching accounts.</p> : <div style={{overflowX:'auto',marginTop:18}}>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:1120,fontSize:13}}>
            <thead><tr style={{textAlign:'left',borderBottom:'1px solid var(--line)'}}>{['Account','Account type','Role','Active plan / status','Audits','Payments','Session','Joined','Access controls'].map(h=><th key={h} style={{padding:'12px 10px',color:'var(--muted)',fontSize:11,textTransform:'uppercase',letterSpacing:'.07em'}}>{h}</th>)}</tr></thead>
            <tbody>{filtered.map(user=>{const sub=user.subscriptions[0];const isProtected=user.email.toLowerCase()===FOUNDER_EMAIL;return <tr key={user.id} style={{borderBottom:'1px solid var(--line)'}}>
              <td style={{padding:'14px 10px'}}><strong>{user.name || 'Unnamed user'}</strong><div className="muted">{user.email}</div>{user.affiliateProfile && <div className="muted" style={{fontSize:11}}>Referral: {user.affiliateProfile.code} · {user.affiliateProfile.commissionRate}%</div>}</td>
              <td style={{padding:'14px 10px'}}><span className="badge">{accountTypeLabel[user.accountType]}</span>{user.successfulPayment&&<div className="muted" style={{fontSize:11}}>Successful payment on record</div>}</td>
              <td style={{padding:'14px 10px'}}><span className="badge">{user.role}</span></td>
              <td style={{padding:'14px 10px'}}><strong>{sub?.planId?.replaceAll('_',' ') || 'No active plan'}</strong><div className="muted">{sub?.status || '—'}{sub?.expiresAt ? ' · expires '+new Date(sub.expiresAt).toLocaleDateString() : ''}</div></td>
              <td style={{padding:'14px 10px'}}>{user._count.audits}</td><td style={{padding:'14px 10px'}}>{user._count.payments}</td>
              <td style={{padding:'14px 10px'}}><span className="badge">{user.hasActiveSession ? 'Session valid' : 'No active session'}</span>{user.lastSessionAt&&<div className="muted" style={{fontSize:11}}>{new Date(user.lastSessionAt).toLocaleString()}</div>}</td>
              <td style={{padding:'14px 10px'}}>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td style={{padding:'14px 10px',minWidth:245}}>{isProtected ? <span className="muted">Founder access protected</span> : <div style={{display:'grid',gap:8}}><select value={selectedPlans[user.id] || 'starter_monthly'} onChange={e=>setSelectedPlans(s=>({...s,[user.id]:e.target.value}))} aria-label={'Plan for '+user.email}>{plans.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select><div style={{display:'flex',gap:7,flexWrap:'wrap'}}><button className="button button-primary" style={{minHeight:34,padding:'7px 10px',fontSize:12}} disabled={busy===user.id} onClick={()=>void act(user,'grant_plan')}>{busy===user.id?'Saving…':'Grant / change plan'}</button><button className="button button-secondary" style={{minHeight:34,padding:'7px 10px',fontSize:12}} disabled={busy===user.id||!sub} onClick={()=>void act(user,'revoke_plan')}>Revoke plan</button></div></div>}</td>
            </tr>})}</tbody>
          </table>
        </div>}
      </section>
    </div>
  </main>;
}
