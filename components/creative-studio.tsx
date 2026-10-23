'use client';

import { useState, type FormEvent } from 'react';

type AuditOption = { id: string; url: string; completedAt: string | null };
type Variant = { angle: string; headline: string; primaryText: string; callToAction: string; rationale: string; hypothesis: string; claimsToVerify: string[] };
type Output = { variants: Variant[]; testPlan: { primaryMetric: string; guardrailMetric: string; hypothesis: string; testGuidance: string; decisionCaveat: string }; publication: { published: boolean; message: string } };

const channels = [
  { value: 'paid_ad', label: 'Paid advertisement' },
  { value: 'landing_page', label: 'Landing page' },
  { value: 'product_page', label: 'Product page' },
  { value: 'social', label: 'Organic social content' },
  { value: 'email', label: 'Marketing email' },
];

export default function CreativeStudio({ audits }: { audits: AuditOption[] }) {
  const [channel, setChannel] = useState('paid_ad');
  const [objective, setObjective] = useState('Generate qualified purchases or signups');
  const [audience, setAudience] = useState('');
  const [brandVoice, setBrandVoice] = useState('Clear, specific, credible, and direct');
  const [sourceFacts, setSourceFacts] = useState('');
  const [auditId, setAuditId] = useState('');
  const [output, setOutput] = useState<Output | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setOutput(null); setCopied('');
    try {
      const response = await fetch('/api/creative-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ channel, objective, audience, brandVoice, sourceFacts, auditId: auditId || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not generate creative variants.');
      setOutput(data as Output);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not generate creative variants.');
    } finally {
      setBusy(false);
    }
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
    } catch {
      setError('Clipboard access was blocked by the browser. Select the text and copy it manually.');
    }
  }

  function downloadDraft() {
    if (!output) return;
    const content = output.variants.map((v, i) => [
      'VARIANT ' + (i + 1) + ': ' + v.angle,
      'Headline: ' + v.headline,
      'Primary text: ' + v.primaryText,
      'CTA: ' + v.callToAction,
      'Rationale: ' + v.rationale,
      'Hypothesis: ' + v.hypothesis,
      'Claims to verify: ' + (v.claimsToVerify.join('; ') || 'None flagged'),
    ].join('\n')).join('\n\n---\n\n') + '\n\nTEST PLAN\nPrimary metric: ' + output.testPlan.primaryMetric + '\nGuardrail: ' + output.testPlan.guardrailMetric + '\nHypothesis: ' + output.testPlan.hypothesis + '\nGuidance: ' + output.testPlan.testGuidance + '\nCaveat: ' + output.testPlan.decisionCaveat;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'pagefix-creative-test-draft.txt'; anchor.click();
    URL.revokeObjectURL(url);
  }

  return <div className="container dashboard-main">
    <section className="card" style={{ marginBottom: 20 }}>
      <div className="label">AI WORKBENCH / CREATIVE STRATEGY</div>
      <h2>Create variants worth testing—not just more copy</h2>
      <p className="muted">Generate three distinct, evidence-grounded creative directions and a test plan. PageFix AI does not claim to predict the winner, publish campaigns, or run a live experiment from this workspace yet.</p>
      <form onSubmit={generate} style={{ display: 'grid', gap: 16, marginTop: 18 }}>
        <div className="grid grid-2">
          <label>Asset type<select value={channel} onChange={e => setChannel(e.target.value)}>{channels.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label>Optional saved audit context<select value={auditId} onChange={e => setAuditId(e.target.value)}><option value="">No audit context</option>{audits.map(a => <option key={a.id} value={a.id}>{a.url} · {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : 'Completed audit'}</option>)}</select></label>
        </div>
        <label>Objective<input value={objective} onChange={e => setObjective(e.target.value)} minLength={5} maxLength={500} required placeholder="What should this asset help the audience do?" /></label>
        <label>Target audience<input value={audience} onChange={e => setAudience(e.target.value)} minLength={3} maxLength={500} required placeholder="Who is this for? Be specific." /></label>
        <label>Brand / copy style<input value={brandVoice} onChange={e => setBrandVoice(e.target.value)} minLength={3} maxLength={300} required placeholder="e.g. expert, warm, concise, premium" /></label>
        <label>Verified product, offer, and policy facts<textarea value={sourceFacts} onChange={e => setSourceFacts(e.target.value)} minLength={20} maxLength={5000} required rows={6} placeholder="Include only accurate facts: what it is, price if relevant, genuine benefits, constraints, offer terms, and claims that are approved." /></label>
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>Do not enter passwords, API keys, customer personal data, or confidential account credentials. The AI will be instructed not to invent proof, results, discounts, or product claims.</p>
        {error && <div className="error-box" role="alert">{error}</div>}
        <div><button className="primary-button" type="submit" disabled={busy}>{busy ? 'Generating and validating variants…' : 'Generate 3 creative variants + test plan'}</button></div>
      </form>
    </section>
    {output && <section className="card">
      <div className="section-heading" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div><div className="label">GENERATED DRAFTS</div><h2>Review before using</h2><p className="muted">These are AI-generated proposals based on the facts you supplied, not verified performance claims.</p></div>
        <button className="button button-secondary" type="button" onClick={downloadDraft}>Export draft (.txt)</button>
      </div>
      <div className="grid grid-3" style={{ marginTop: 14 }}>
        {output.variants.map((variant, index) => {
          const full = 'Headline: ' + variant.headline + '\n\n' + variant.primaryText + '\n\nCTA: ' + variant.callToAction;
          return <article className="card" key={variant.angle} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="label">VARIANT {index + 1}</div><h3>{variant.angle}</h3>
            <div><strong>Headline</strong><p>{variant.headline}</p></div>
            <div><strong>Primary copy</strong><p style={{ whiteSpace: 'pre-wrap' }}>{variant.primaryText}</p></div>
            <div><strong>CTA</strong><p>{variant.callToAction}</p></div>
            <div><strong>Why this angle</strong><p className="muted">{variant.rationale}</p></div>
            <div><strong>Test hypothesis</strong><p className="muted">{variant.hypothesis}</p></div>
            {variant.claimsToVerify.length > 0 && <div className="error-box"><strong>Verify before publishing</strong><ul>{variant.claimsToVerify.map((claim, i) => <li key={i}>{claim}</li>)}</ul></div>}
            <button className="button button-secondary" type="button" onClick={() => copyText(full, 'Variant ' + (index + 1))}>Copy variant</button>
          </article>;
        })}
      </div>
      <section className="card" style={{ marginTop: 18 }}>
        <div className="label">EXPERIMENT PLAN</div><h3>{output.testPlan.hypothesis}</h3>
        <div className="grid grid-2">
          <div><strong>Primary metric</strong><p>{output.testPlan.primaryMetric}</p></div>
          <div><strong>Guardrail metric</strong><p>{output.testPlan.guardrailMetric}</p></div>
        </div>
        <p>{output.testPlan.testGuidance}</p><p className="muted">{output.testPlan.decisionCaveat}</p>
      </section>
      <div className="card" style={{ marginTop: 14 }}><strong>Publishing status</strong><p className="muted">{output.publication.message}</p></div>
      {copied && <p role="status" className="muted">{copied} copied to clipboard.</p>}
    </section>}
  </div>;
}
