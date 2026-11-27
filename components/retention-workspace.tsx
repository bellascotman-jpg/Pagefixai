'use client';

import { useCallback, useEffect, useState } from 'react';
import type { RetentionFinding, RetentionInput, RetentionAnalysisResult } from '@/lib/intelligence/retention';

type SavedAnalysis = {
  id: string;
  name: string;
  flowType: RetentionInput['flowType'];
  input: RetentionInput;
  findings: RetentionFinding[];
  metrics: RetentionAnalysisResult['metrics'];
  createdAt: string;
};

const emptyStep = (index: number) => ({
  id: `step-${index}-${Math.random().toString(36).slice(2, 7)}`,
  name: index === 1 ? 'Welcome / first screen' : `Journey step ${index}`,
  content: '',
  expectedNextStep: '',
  expectedOutcome: '',
});

const initialInput: RetentionInput = {
  name: 'My onboarding review',
  businessType: 'saas',
  flowType: 'onboarding',
  promisedOutcome: '',
  steps: [emptyStep(1)],
  emails: [],
  pricingText: '',
  cancellationText: '',
  metrics: { usersStarted: null, usersCompleted: null, activatedUsers: null, windowLabel: '' },
};

function parseCount(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

export default function RetentionWorkspace() {
  const [input, setInput] = useState<RetentionInput>(initialInput);
  const [findings, setFindings] = useState<RetentionFinding[]>([]);
  const [metrics, setMetrics] = useState<RetentionAnalysisResult['metrics']>(null);
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/intelligence/retention', { cache: 'no-store' });
      const payload = await response.json() as { analyses?: SavedAnalysis[]; message?: string };
      if (!response.ok) throw new Error(payload.message || 'Could not load saved analyses.');
      setError('');
      setHistory(payload.analyses ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load saved analyses.');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => { void loadHistory(); }, [loadHistory]);

  function updateStep(index: number, field: keyof RetentionInput['steps'][number], value: string) {
    setInput(current => ({ ...current, steps: current.steps.map((step, i) => i === index ? { ...step, [field]: value } : step) }));
  }

  function updateEmail(index: number, field: keyof RetentionInput['emails'][number], value: string) {
    setInput(current => ({ ...current, emails: current.emails.map((email, i) => i === index ? { ...email, [field]: value } : email) }));
  }

  async function analyzeAndSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/intelligence/retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const payload = await response.json() as { message?: string; analysis?: SavedAnalysis; saved?: boolean };
      if (!response.ok || !payload.analysis) throw new Error(payload.message || 'The analysis could not be saved.');
      setFindings(payload.analysis.findings ?? []);
      setMetrics(payload.analysis.metrics ?? null);
      setSelectedId(payload.analysis.id);
      setNotice('Analysis completed and saved to your account.');
      await loadHistory();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The analysis could not be saved.');
    } finally {
      setLoading(false);
    }
  }

  function openSaved(record: SavedAnalysis) {
    setInput(record.input);
    setFindings(record.findings ?? []);
    setMetrics(record.metrics ?? null);
    setSelectedId(record.id);
    setError('');
    setNotice(`Loaded saved analysis from ${new Date(record.createdAt).toLocaleString()}.`);
  }

  function clearResults() {
    setFindings([]);
    setMetrics(null);
    setSelectedId('');
    setError('');
    setNotice('Ready for a new analysis. Your saved history is unchanged.');
  }

  return <div className="retention-workspace" style={{ display: 'grid', gap: 20 }}>
    <section className="card">
      <div className="label">RETENTION INTELLIGENCE / WORKSPACE</div>
      <h2>Inspect the path from signup to first value</h2>
      <p className="muted" style={{ lineHeight: 1.75, maxWidth: 900 }}>Paste the real visible text from your signup, onboarding, retention, pricing, or cancellation flow. PageFix checks clarity and missing handoffs, and can calculate rates from aggregate counts you supply. It does not connect to private product analytics automatically or claim that a text gap proves churn.</p>
      {error && <div role="alert" className="card" style={{ borderColor: '#dc7777', margin: '14px 0', color: '#9b2424' }}>{error}</div>}
      {notice && <p role="status" className="muted">{notice}</p>}
      <form onSubmit={analyzeAndSave} style={{ display: 'grid', gap: 18 }}>
        <div className="grid grid-2">
          <label className="form-field">Analysis name<input required maxLength={120} value={input.name} onChange={event => setInput(current => ({ ...current, name: event.target.value }))} placeholder="e.g. Trial onboarding — October" /></label>
          <label className="form-field">Business type<select value={input.businessType} onChange={event => setInput(current => ({ ...current, businessType: event.target.value as RetentionInput['businessType'] }))}><option value="saas">SaaS / software</option><option value="ecommerce">E-commerce</option></select></label>
          <label className="form-field">Journey being reviewed<select value={input.flowType} onChange={event => setInput(current => ({ ...current, flowType: event.target.value as RetentionInput['flowType'] }))}><option value="signup">Signup</option><option value="onboarding">Onboarding</option><option value="activation">Activation / first value</option><option value="retention">Retention / repeat use</option><option value="pricing">Pricing and billing</option><option value="cancellation">Cancellation / downgrade</option></select></label>
          <label className="form-field">What did the signup or offer promise?<textarea maxLength={1200} rows={3} value={input.promisedOutcome} onChange={event => setInput(current => ({ ...current, promisedOutcome: event.target.value }))} placeholder="Paste or summarize the exact promise, without adding claims you cannot verify." /></label>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><h3>Journey steps</h3><button type="button" className="button button-secondary" disabled={input.steps.length >= 12} onClick={() => setInput(current => ({ ...current, steps: [...current.steps, emptyStep(current.steps.length + 1)] }))}>+ Add step</button></div>
          <p className="muted">Add up to 12 steps in order. Missing content is treated as unknown, not as proof that the live product lacks a feature.</p>
          <div style={{ display: 'grid', gap: 14 }}>
            {input.steps.map((step, index) => <div className="card" key={step.id} style={{ background: 'var(--surface-subtle, #f8fafc)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}><h4>Step {index + 1}</h4><button type="button" className="text-button" disabled={input.steps.length <= 1} onClick={() => setInput(current => ({ ...current, steps: current.steps.filter((_, i) => i !== index) }))}>Remove step</button></div>
              <div className="grid grid-2">
                <label className="form-field">Step name<input maxLength={160} value={step.name} onChange={event => updateStep(index, 'name', event.target.value)} placeholder="e.g. Connect data source" /></label>
                <label className="form-field">Expected next action<input maxLength={300} value={step.expectedNextStep} onChange={event => updateStep(index, 'expectedNextStep', event.target.value)} placeholder="e.g. Connect data source (optional)" /></label>
                <label className="form-field">Visible content / instructions<textarea rows={5} maxLength={12000} value={step.content} onChange={event => updateStep(index, 'content', event.target.value)} placeholder="Paste the screen's visible text, instructions, buttons and help copy." /></label>
                <label className="form-field">How do you know this step succeeded?<textarea rows={3} maxLength={500} value={step.expectedOutcome} onChange={event => updateStep(index, 'expectedOutcome', event.target.value)} placeholder="e.g. The user successfully connected their store." /></label>
              </div>
            </div>)}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><h3>Onboarding emails or messages</h3><button type="button" className="button button-secondary" disabled={input.emails.length >= 10} onClick={() => setInput(current => ({ ...current, emails: [...current.emails, { subject: '', body: '', callToAction: '' }] }))}>+ Add message</button></div>
          <p className="muted">Optional. Paste messages you actually send; do not paste private customer identifiers or sensitive personal data.</p>
          {input.emails.map((email, index) => <div className="card" key={index} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h4>Message {index + 1}</h4><button type="button" className="text-button" onClick={() => setInput(current => ({ ...current, emails: current.emails.filter((_, i) => i !== index) }))}>Remove message</button></div>
            <div className="grid grid-2">
              <label className="form-field">Subject<input maxLength={300} value={email.subject} onChange={event => updateEmail(index, 'subject', event.target.value)} /></label>
              <label className="form-field">Primary CTA / destination action<input maxLength={300} value={email.callToAction} onChange={event => updateEmail(index, 'callToAction', event.target.value)} placeholder="e.g. Connect your store" /></label>
              <label className="form-field" style={{ gridColumn: '1 / -1' }}>Message body<textarea rows={4} maxLength={6000} value={email.body} onChange={event => updateEmail(index, 'body', event.target.value)} /></label>
            </div>
          </div>)}
        </div>

        {(input.flowType === 'pricing' || input.flowType === 'cancellation') && <div className="grid grid-2">
          {input.flowType === 'pricing' && <label className="form-field">Actual pricing and billing copy<textarea rows={5} maxLength={12000} value={input.pricingText} onChange={event => setInput(current => ({ ...current, pricingText: event.target.value }))} placeholder="Paste real pricing, trial, renewal and billing terms." /></label>}
          {input.flowType === 'cancellation' && <label className="form-field">Actual cancellation and refund copy<textarea rows={5} maxLength={12000} value={input.cancellationText} onChange={event => setInput(current => ({ ...current, cancellationText: event.target.value }))} placeholder="Paste real cancellation, downgrade, renewal and refund terms." /></label>}
        </div>}

        <div>
          <h3>Optional aggregate metrics</h3>
          <p className="muted">Only enter counts from the same cohort and reporting window. Leave fields blank if you do not have reliable data.</p>
          <div className="grid grid-2">
            <label className="form-field">Users who started<input type="number" min="0" step="1" value={input.metrics.usersStarted ?? ''} onChange={event => setInput(current => ({ ...current, metrics: { ...current.metrics, usersStarted: parseCount(event.target.value) } }))} /></label>
            <label className="form-field">Users who completed the journey<input type="number" min="0" step="1" value={input.metrics.usersCompleted ?? ''} onChange={event => setInput(current => ({ ...current, metrics: { ...current.metrics, usersCompleted: parseCount(event.target.value) } }))} /></label>
            <label className="form-field">Users who reached activation<input type="number" min="0" step="1" value={input.metrics.activatedUsers ?? ''} onChange={event => setInput(current => ({ ...current, metrics: { ...current.metrics, activatedUsers: parseCount(event.target.value) } }))} /></label>
            <label className="form-field">Cohort / reporting window<input maxLength={300} value={input.metrics.windowLabel} onChange={event => setInput(current => ({ ...current, metrics: { ...current.metrics, windowLabel: event.target.value } }))} placeholder="e.g. New paid signups, 1–30 Sep 2026" /></label>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="submit" className="primary-button" disabled={loading}>{loading ? 'Analysing and saving…' : 'Analyse journey & save results'}</button>
          <button type="button" className="button button-secondary" onClick={clearResults}>Clear current results</button>
        </div>
      </form>
    </section>

    {(selectedId || findings.length > 0 || metrics) && <section className="pf-audit-report">
      <div className="pf-report-meta"><span>RETENTION & LIFECYCLE / SAVED ANALYSIS</span><span>{selectedId ? `RECORD ${selectedId.slice(0,8)}` : 'UNSAVED RESULTS'}</span></div>

      <section className="pf-report-block">
        <div className="pf-block-heading"><span>01</span><h2>The customer-lifecycle problem</h2></div>
        <div className="pf-problem">
          <span>PROBLEM / BUSINESS CONSEQUENCE</span>
          <h2>“I need customers to understand the next step and reach the value I promised, without getting stuck in the journey.”</h2>
          <p><strong>What it can cost:</strong> Unclear handoffs can increase support effort and create activation or retention risk. This analysis reviews only the content and aggregate metrics you supplied; it does not identify actual churn causes.</p>
        </div>
      </section>

      <section className="pf-report-block">
        <div className="pf-block-heading"><span>02</span><h2>Journey review verdict</h2></div>
        <div className="pf-verdict-grid">
          <article className="pf-verdict-card"><span>FINDINGS TO REVIEW</span><strong>{findings.length}</strong><small>Rule-based findings from the supplied journey material</small></article>
          <article className={`pf-risk-card ${findings.some(item=>item.severity==='HIGH')?'risk':findings.length?'watch':'good'}`}><span>REVIEW PRIORITY</span><strong>{findings.some(item=>item.severity==='HIGH')?'High-priority review':findings.length?'Review recommended':'No rule-based gap detected'}</strong><small>{findings.filter(item=>item.severity==='HIGH').length} high · {findings.filter(item=>item.severity==='MEDIUM').length} medium · {findings.filter(item=>item.severity==='LOW').length} low</small></article>
          <article className="pf-verdict-card"><span>JOURNEY STEPS SUPPLIED</span><strong>{input.steps.filter(step=>step.content.trim()).length} / {input.steps.length}</strong><small>Steps with visible content pasted into this analysis</small></article>
          <article className="pf-verdict-card"><span>MESSAGES SUPPLIED</span><strong>{input.emails.filter(email=>email.subject.trim()||email.body.trim()).length}</strong><small>Onboarding emails or messages included</small></article>
        </div>
        {metrics && <div className="pf-verdict-grid" style={{marginTop:12}}>
          <article className="pf-verdict-card"><span>JOURNEY COMPLETION</span><strong>{metrics.completionRatePercent.toFixed(1)}%</strong><small>{metrics.usersCompleted} / {metrics.usersStarted} users · supplied cohort</small></article>
          <article className="pf-verdict-card"><span>INCOMPLETE RATE</span><strong>{metrics.incompleteRatePercent.toFixed(1)}%</strong><small>Calculated from supplied aggregate counts</small></article>
          <article className="pf-verdict-card"><span>ACTIVATION RATE</span><strong>{metrics.activationRatePercent===null?'Not supplied':`${metrics.activationRatePercent.toFixed(1)}%`}</strong><small>{metrics.windowLabel || 'Reporting window not labelled'}</small></article>
        </div>}
        {metrics && <p className="muted">Metric source: {metrics.source}. Rates describe only the supplied cohort and reporting window; they do not establish why users did or did not complete the journey.</p>}
        <div className="pf-explain-grid">
          <article><strong>Known</strong><p>{input.steps.filter(step=>step.content.trim()).length} journey step(s) and {input.emails.filter(email=>email.subject.trim()||email.body.trim()).length} message(s) were supplied.</p></article>
          <article><strong>Not established</strong><p>Actual churn, causal drop-off, customer sentiment and product usage outside the supplied material remain unknown.</p></article>
        </div>
      </section>

      <section className="pf-report-block">
        <div className="pf-block-heading"><span>03</span><h2>Where the supplied journey needs attention</h2></div>
        <div className="pf-chart-card">
          <p>Step coverage shows whether content was supplied for review. It does not confirm that the live screen or interactive control works.</p>
          <div className="pf-bars">{input.steps.map((step,index)=><div className="pf-bar-row" key={step.id}><span className="pf-bar-rank">{String(index+1).padStart(2,'0')}</span><span className="pf-bar-label">{step.name || `Journey step ${index+1}`}</span><div className="pf-bar-track" role="img" aria-label={step.content.trim()?'Content supplied for this step':'No content supplied for this step'}><div className={`pf-bar-fill ${step.content.trim()?'has-value':''}`} style={{width:step.content.trim()?'100%':'0%'}} /></div><strong>{step.content.trim()?'Ready':'Unknown'}</strong></div>)}</div>
          <div className="pf-explain-grid" style={{marginTop:14}}><article><strong>Journey type</strong><p>{input.flowType.replaceAll('_',' ')} · {input.businessType === 'saas' ? 'SaaS / software' : 'E-commerce'}</p></article><article><strong>Promised outcome</strong><p>{input.promisedOutcome.trim() || 'No pre-signup promise was supplied for comparison.'}</p></article></div>
        </div>
      </section>

      <section className="pf-report-block">
        <div className="pf-block-heading"><span>04</span><h2>Evidence and supplied source material</h2></div>
        {findings.length ? <div className="pf-evidence-list">{findings.map(item=><article key={item.id}>
          <div className="pf-chip-row"><span>{item.label}</span><span>{item.severity} SEVERITY</span></div>
          <strong>{item.title}</strong><blockquote>{item.detail}</blockquote><small>Source: {item.source}</small>
        </article>)}</div> : <div className="pf-empty-inline">No rule-based finding was generated from this analysis. This does not certify the journey as usable or complete.</div>}
        <div className="pf-subpanel"><h3>Supplied journey content</h3>{input.steps.map((step,index)=><article key={step.id} style={{padding:'10px 0',borderTop:index?'1px solid #eee2e7':0}}><strong>{index+1}. {step.name}</strong><p className="muted">{step.content.trim()?step.content.slice(0,650):'No visible content supplied for this step.'}</p><small>Expected next action: {step.expectedNextStep || 'Not specified'} · Expected outcome: {step.expectedOutcome || 'Not specified'}</small></article>)}</div>
        {input.emails.some(email=>email.subject.trim()||email.body.trim()) && <div className="pf-subpanel"><h3>Supplied onboarding messages</h3>{input.emails.filter(email=>email.subject.trim()||email.body.trim()).map((email,index)=><article key={index} style={{padding:'10px 0',borderTop:index?'1px solid #eee2e7':0}}><strong>{email.subject || `Message ${index+1}`}</strong><p className="muted">{email.body.slice(0,500)}</p><small>Primary action: {email.callToAction || 'Not specified'}</small></article>)}</div>}
      </section>

      <section className="pf-report-block">
        <div className="pf-block-heading"><span>05</span><h2>Prioritised improvement plan</h2></div>
        <p className="pf-fix-intro">Resolve the highest-severity issues first. Confirm the actual live flow, make the next action and success outcome explicit, then measure the same cohort after the change.</p>
        {findings.length ? <div className="pf-fix-list">{findings.map((item,index)=><article className="pf-fix-card" key={item.id}>
          <div className="pf-fix-top"><span>STEP {index+1}</span><span className={item.severity==='HIGH'?'risk':item.severity==='MEDIUM'?'watch':'good'}>{item.severity}</span><span>{item.label}</span></div>
          <h3>{item.title}</h3><p>{item.recommendation}</p><small>{item.whyItMatters}</small>
        </article>)}</div> : <div className="pf-empty-inline">No corrective action was generated by the current rules. Review the actual user journey and collect customer feedback before concluding that no friction exists.</div>}
      </section>
    </section>}
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><div><div className="label">YOUR ACCOUNT / HISTORY</div><h2>Saved retention analyses</h2></div><button type="button" className="button button-secondary" onClick={() => void loadHistory()} disabled={loadingHistory}>{loadingHistory ? 'Refreshing…' : 'Refresh history'}</button></div>
      {loadingHistory ? <p className="muted">Loading saved analyses…</p> : history.length === 0 ? <p className="muted">Your saved analyses will appear here after the first successful run.</p> : <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>{history.map(record => <button type="button" key={record.id} onClick={() => openSaved(record)} className="finding" style={{ textAlign: 'left', cursor: 'pointer', border: selectedId === record.id ? '1px solid var(--accent, #0f766e)' : undefined, color: 'inherit', background: 'transparent' }}><strong>{record.name}</strong><span className="badge" style={{ marginLeft: 8 }}>{record.flowType}</span><div className="muted" style={{ marginTop: 5 }}>{new Date(record.createdAt).toLocaleString()} · {record.findings?.length ?? 0} findings</div></button>)}</div>}
    </section>
  </div>;
}
