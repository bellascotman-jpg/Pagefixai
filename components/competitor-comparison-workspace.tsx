'use client';

import { useMemo, useState } from 'react';

type AuditOption = {
  id: string;
  url: string;
  completedAt: string | null;
  page: { title: string | null; metaDescription: string | null; canonical: string | null; statusCode: number | null } | null;
  findings: { title: string; severity: string; priority: string; observation: string; recommendation: string }[];
};

export default function CompetitorComparisonWorkspace({ audits }: { audits: AuditOption[] }) {
  const [targetId, setTargetId] = useState(audits[0]?.id || '');
  const [compareId, setCompareId] = useState(audits.find(a => a.id !== audits[0]?.id)?.id || '');
  const target = useMemo(() => audits.find(a => a.id === targetId), [audits, targetId]);
  const compare = useMemo(() => audits.find(a => a.id === compareId), [audits, compareId]);
  const dimensions = [
    { label: 'HTTP response', value: (a: AuditOption) => a.page?.statusCode == null ? 'Not captured' : String(a.page.statusCode) },
    { label: 'Page title', value: (a: AuditOption) => a.page?.title || 'Not captured' },
    { label: 'Meta description', value: (a: AuditOption) => a.page?.metaDescription || 'Not captured' },
    { label: 'Canonical URL', value: (a: AuditOption) => a.page?.canonical || 'Not captured' },
    { label: 'Total saved findings', value: (a: AuditOption) => String(a.findings.length) },
    { label: 'High-severity findings', value: (a: AuditOption) => String(a.findings.filter(f => f.severity === 'HIGH').length) },
    { label: 'Fix now', value: (a: AuditOption) => String(a.findings.filter(f => f.priority === 'FIX_NOW').length) },
  ];

  return <section className="card" style={{marginTop:18}}>
    <div className="label">SAVED PUBLIC-PAGE COMPARISON</div>
    <h2>Compare two inspected pages</h2>
    <p className="muted">Choose two completed PageFix inspections. This compares captured evidence—not private competitor analytics, conversion rates, revenue or market share. If the second URL has not been inspected yet, run a public-page audit first.</p>
    {audits.length < 2 ? <div className="empty-state"><h3>Two completed inspections are needed</h3><p className="muted">There are {audits.length} completed inspections available in your account. Inspect your own page and a competitor&apos;s public page separately, then return here.</p></div> : <>
      <div className="grid grid-2" style={{marginTop:12}}>
        <label style={{display:'grid',gap:8}}>Your target page<select value={targetId} onChange={e=>setTargetId(e.target.value)} style={{padding:12,borderRadius:10,border:'1px solid var(--border, #d9dfe8)'}}>{audits.map(a=><option value={a.id} key={a.id}>{a.url} · {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : 'date unknown'}</option>)}</select></label>
        <label style={{display:'grid',gap:8}}>Comparison page<select value={compareId} onChange={e=>setCompareId(e.target.value)} style={{padding:12,borderRadius:10,border:'1px solid var(--border, #d9dfe8)'}}>{audits.filter(a=>a.id!==targetId).map(a=><option value={a.id} key={a.id}>{a.url} · {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : 'date unknown'}</option>)}</select></label>
      </div>
      {target && compare && <>
        <div className="grid grid-2" style={{marginTop:14}}>
          {[target, compare].map((audit, i)=><div className="card" key={audit.id}><div className="label">{i===0?'TARGET PAGE':'COMPARISON PAGE'}</div><h3 style={{overflowWrap:'anywhere'}}>{audit.url}</h3><p className="muted">Captured {audit.completedAt ? new Date(audit.completedAt).toLocaleString() : 'date unavailable'}</p><div className="stat">{audit.findings.length}</div><p className="muted">Saved findings</p></div>)}
        </div>
        <div style={{overflowX:'auto',marginTop:16}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:520}}><thead><tr><th style={{textAlign:'left',padding:10}}>Observed dimension</th><th style={{textAlign:'left',padding:10}}>Target page</th><th style={{textAlign:'left',padding:10}}>Comparison page</th></tr></thead><tbody>{dimensions.map(d=><tr key={d.label}><th style={{textAlign:'left',padding:10,verticalAlign:'top',borderTop:'1px solid var(--border, #d9dfe8)'}}>{d.label}</th><td style={{padding:10,verticalAlign:'top',borderTop:'1px solid var(--border, #d9dfe8)',overflowWrap:'anywhere'}}>{d.value(target)}</td><td style={{padding:10,verticalAlign:'top',borderTop:'1px solid var(--border, #d9dfe8)',overflowWrap:'anywhere'}}>{d.value(compare)}</td></tr>)}</tbody></table></div>
        <div className="grid grid-2" style={{marginTop:16}}>
          {[target,compare].map((audit,i)=><div className="card" key={audit.id}><h3>{i===0?'Target findings':'Comparison findings'}</h3>{audit.findings.length ? audit.findings.slice(0,8).map((f,index)=><article className="finding" key={f.title+'-'+index}><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><span className="badge">{f.severity}</span><span className="badge">{f.priority.replaceAll('_',' ')}</span></div><strong>{f.title}</strong><p>{f.observation}</p><p className="muted">{f.recommendation}</p></article>) : <p className="muted">No findings were saved for this inspection. This is not proof the page is flawless.</p>}</div>)}
        </div>
      </>}
    </>}
  </section>;
}
