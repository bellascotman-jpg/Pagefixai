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

    {(findings.length > 0 || metrics) && <section className="card">
      <div className="label">SAVED ANALYSIS {selectedId ? `/ ${selectedId.slice(0, 8)}` : ''}</div>
      <h2>Findings and next actions</h2>
      {metrics && <div className="grid grid-3" style={{ margin: '16px 0' }}>
        <div className="card"><div className="label">Journey completion</div><div className="stat">{metrics.completionRatePercent.toFixed(1)}%</div><p className="muted">{metrics.usersCompleted} / {metrics.usersStarted} users</p></div>
        <div className="card"><div className="label">Not completed</div><div className="stat">{metrics.incompleteRatePercent.toFixed(1)}%</div><p className="muted">Calculated from supplied cohort counts</p></div>
        <div className="card"><div className="label">Activation rate</div><div className="stat">{metrics.activationRatePercent === null ? 'Not supplied' : `${metrics.activationRatePercent.toFixed(1)}%`}</div><p className="muted">{metrics.windowLabel}</p></div>
      </div>}
      {metrics && <p className="muted">Metrics source: user-supplied aggregate counts. These rates describe the entered cohort only and do not establish causes of drop-off.</p>}
      {findings.length === 0 ? <p className="muted">No rule-based gaps were detected in the supplied content. This is not a guarantee that the journey is free of usability or retention problems.</p> : <div style={{ display: 'grid', gap: 12 }}>{findings.map(item => <article className="finding" key={item.id}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><strong>{item.title}</strong><span className="badge">{item.severity}</span><span className="badge">{item.label}</span></div>
        <p>{item.detail}</p><p><strong>Why it matters:</strong> {item.whyItMatters}</p><p><strong>Recommended action:</strong> {item.recommendation}</p><p className="muted">Basis: {item.source}</p>
      </article>)}</div>}
    </section>}

    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><div><div className="label">YOUR ACCOUNT / HISTORY</div><h2>Saved retention analyses</h2></div><button type="button" className="button button-secondary" onClick={() => void loadHistory()} disabled={loadingHistory}>{loadingHistory ? 'Refreshing…' : 'Refresh history'}</button></div>
      {loadingHistory ? <p className="muted">Loading saved analyses…</p> : history.length === 0 ? <p className="muted">Your saved analyses will appear here after the first successful run.</p> : <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>{history.map(record => <button type="button" key={record.id} onClick={() => openSaved(record)} className="finding" style={{ textAlign: 'left', cursor: 'pointer', border: selectedId === record.id ? '1px solid var(--accent, #0f766e)' : undefined, color: 'inherit', background: 'transparent' }}><strong>{record.name}</strong><span className="badge" style={{ marginLeft: 8 }}>{record.flowType}</span><div className="muted" style={{ marginTop: 5 }}>{new Date(record.createdAt).toLocaleString()} · {record.findings?.length ?? 0} findings</div></button>)}</div>}
    </section>
  </div>;
}
