'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';

type Result = { variant: string; impressions: number; clicks: number; conversions: number; conversionRate: number | null };
type Experiment = {
  id: string; name: string; publicKey: string; targetUrlPattern: string; selector: string;
  controlText: string; variantText: string; status: string; createdAt: string; results: Result[];
};

export default function ExperimentsPage() {
  const [items, setItems] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [schemaReady, setSchemaReady] = useState(true);
  const [schemaMessage, setSchemaMessage] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [name, setName] = useState('');
  const [targetUrlPattern, setTargetUrlPattern] = useState('/products/example');
  const [selector, setSelector] = useState('h1');
  const [controlText, setControlText] = useState('');
  const [variantText, setVariantText] = useState('');
  const [snippetKey, setSnippetKey] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/experiments', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not load experiments.');
      setItems(data.experiments || []);
      setSchemaReady(data.schemaReady !== false);
      setSchemaMessage(data.message || '');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load experiments.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/experiments', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, targetUrlPattern, selector, controlText, variantText }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not create experiment.');
      setName(''); setControlText(''); setVariantText('');
      setSnippetKey(data.experiment.publicKey);
      setNotice('Draft created. Install the script on your site, then explicitly start the test.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not create experiment.'); }
    finally { setBusy(false); }
  }

  async function setStatus(item: Experiment, status: 'RUNNING' | 'PAUSED') {
    if (status === 'RUNNING' && !window.confirm('Start serving the two text variants to visitors who load the installed PageFix script?')) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/experiments/' + item.id, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not update experiment.');
      setNotice(status === 'RUNNING' ? 'Experiment started. Variants are served only where the snippet is installed and the selector exists.' : 'Experiment paused. The snippet will no longer serve a variant.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not update experiment.'); }
    finally { setBusy(false); }
  }

  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setNotice('Copied to clipboard.'); }
    catch { setError('Clipboard access was blocked. Select the code and copy it manually.'); }
  }

  const snippet = (key: string) => '<script src="' + (typeof window !== 'undefined' ? window.location.origin : 'https://pagefixai.vercel.app') + '/api/experiments/sdk?key=' + key + '" defer></script>';

  return <main className="dashboard">
    <header className="topbar"><div><div className="label">PAGEFIX AI / EXPERIMENTATION</div><h1 style={{fontSize:27,margin:'4px 0 0'}}>A/B testing</h1></div><Link className="button button-secondary" href="/dashboard">← Workspace</Link></header>
    <div className="container dashboard-main">
      <div className="card" style={{marginBottom:20,background:'linear-gradient(120deg,#fff 0%,#fbf0f3 100%)'}}>
        <div className="label">CONTROLLED WEBSITE EXPERIMENTS</div>
        <h2>Test one real change. Measure the result.</h2>
        <p className="muted" style={{maxWidth:850}}>Create a control (A) and variant (B) for one text element on a site you control. Install the PageFix script, start the experiment, and record impressions, clicks and conversion events. PageFix reports observed counts—it does not declare a winner from insufficient data.</p>
        <div className="grid grid-3" style={{marginTop:16}}>
          <div className="finding"><strong>1. Create a draft</strong><p className="muted">Define a URL path, CSS selector and two text versions.</p></div>
          <div className="finding"><strong>2. Install & approve</strong><p className="muted">Add the script and explicitly start the test.</p></div>
          <div className="finding"><strong>3. Verify outcomes</strong><p className="muted">Track conversions with window.pagefixTrackConversion().</p></div>
        </div>
      </div>
      {notice && <div className="card" role="status" style={{marginBottom:14,borderColor:'#b8ded7'}}>{notice}</div>}
      {error && <div className="error-box" role="alert" style={{marginBottom:14}}>{error}</div>}
      {!schemaReady && <div className="error-box" role="status" style={{marginBottom:16}}><strong>Preview database not provisioned</strong><p style={{marginBottom:0}}>{schemaMessage} This preview can be reviewed visually, but experiments cannot be created until an isolated preview database has the new schema.</p></div>}
      <section className="card">
        <div className="label">NEW EXPERIMENT</div><h2>Create a text A/B test</h2>
        <form onSubmit={create} style={{display:'grid',gap:14,marginTop:16}}>
          <label>Experiment name<input required minLength={3} maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder="Product page headline test"/></label>
          <div className="grid grid-2">
            <label>Target path on your website<input required value={targetUrlPattern} onChange={e=>setTargetUrlPattern(e.target.value)} placeholder="/products/example"/></label>
            <label>CSS selector to change<input required value={selector} onChange={e=>setSelector(e.target.value)} placeholder="h1 or .hero-title"/></label>
          </div>
          <label>Variant A · existing/control text<input required maxLength={2000} value={controlText} onChange={e=>setControlText(e.target.value)} placeholder="The exact current text on the page"/></label>
          <label>Variant B · proposed text<input required maxLength={2000} value={variantText} onChange={e=>setVariantText(e.target.value)} placeholder="The alternative text you want to test"/></label>
          <p className="muted" style={{fontSize:12,margin:0}}>This version changes text content on the selected element only. It does not publish ad campaigns, alter prices or change a page until the snippet is installed and the test is started.</p>
          <div><button className="button button-primary" disabled={busy||!schemaReady}>{busy?'Creating…':'Create experiment draft'}</button></div>
        </form>
      </section>
      {snippetKey && <section className="card" style={{marginTop:18}}>
        <div className="label">INSTALLATION</div><h2>Install this experiment on your website</h2>
        <p className="muted">Add this script before the closing body tag on the target site. It only activates while this experiment is running.</p>
        <textarea readOnly rows={3} value={snippet(snippetKey)} style={{width:'100%',fontFamily:'monospace',fontSize:12}}/>
        <button className="button button-secondary" style={{marginTop:10}} onClick={()=>void copy(snippet(snippetKey))}>Copy installation script</button>
        <p className="muted" style={{fontSize:12}}>Call <code>window.pagefixTrackConversion()</code> only after a real signup or purchase success event—not on page load.</p>
      </section>}
      <section style={{marginTop:24}}>
        <div className="store-section-heading"><div><div className="label">FIRST-PARTY MEASUREMENT</div><h2>Your experiments</h2></div><button className="button button-secondary" onClick={()=>void load()} disabled={loading}>Refresh results</button></div>
        {loading ? <div className="card muted">Loading experiment data…</div> : items.length===0 ? <div className="card"><h3>No experiments yet</h3><p className="muted">Create your first draft above. You do not need to complete a website audit first.</p></div> : <div style={{display:'grid',gap:16}}>
          {items.map(item=><article className="card" key={item.id}>
            <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',alignItems:'flex-start'}}>
              <div><span className="badge">{item.status}</span><h3 style={{margin:'10px 0 4px'}}>{item.name}</h3><p className="muted" style={{margin:0}}>{item.targetUrlPattern} · selector <code>{item.selector}</code></p></div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{item.status!=='RUNNING' ? <button className="button button-primary" disabled={busy||!schemaReady} onClick={()=>void setStatus(item,'RUNNING')}>Start test</button> : <button className="button button-secondary" disabled={busy||!schemaReady} onClick={()=>void setStatus(item,'PAUSED')}>Pause test</button>}<button className="button button-secondary" onClick={()=>setSnippetKey(item.publicKey)}>Installation code</button></div>
            </div>
            <div className="grid grid-2" style={{marginTop:16}}>
              {item.results.map(result=><div className="finding" key={result.variant}><div className="label">VARIANT {result.variant}</div><p style={{fontWeight:700}}>{result.variant==='A'?item.controlText:item.variantText}</p><div className="grid grid-3"><div><div className="label">Impressions</div><strong>{result.impressions}</strong></div><div><div className="label">Clicks</div><strong>{result.clicks}</strong></div><div><div className="label">Conversions</div><strong>{result.conversions}</strong></div></div><p className="muted" style={{fontSize:12}}>Observed conversion rate: {result.conversionRate===null?'Not available':(result.conversionRate*100).toFixed(2)+'%'}</p></div>)}
            </div>
            <p className="muted" style={{fontSize:12}}>Statistical significance is not calculated yet. Verify event tracking and collect sufficient eligible traffic before deciding.</p>
          </article>)}
        </div>}
      </section>
    </div>
  </main>;
}
