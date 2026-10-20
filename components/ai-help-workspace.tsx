'use client';

import { useEffect, useState } from 'react';

type AuditOption = { id: string; url: string; completedAt: string | null };
type ChatMessage = { role: 'user' | 'assistant'; content: string; sourceUrl?: string };

const topicPrompts: Record<string, string> = {
  'seo-data': 'Review the selected audit SEO evidence. Prioritize the technical SEO issues and draft an accurate title tag and meta description from captured page content.',
  'ai-search-readiness': 'Explain the captured AI search readiness signals, what is missing, and which checks still need a crawler or search-console verification.',
  'buyer-decisions': 'Review the selected audit and identify the most important unanswered buyer questions, citing the recorded evidence.',
  'return-risk': 'Review the selected audit for pre-purchase clarity and return-risk signals. Separate observed evidence from inferred risks.',
  'visual-inspection': 'Explain the recorded visual and mobile findings and give me a practical verification checklist.',
  'copy-fixes': 'Use the selected audit evidence to draft clearer page copy without adding unsupported product claims.',
  'claims': 'Review the selected audit for claim consistency risks and explain what source evidence would be needed to verify each concern.',
  'impact': 'Explain the plausible business relevance of the selected audit findings. Do not estimate revenue or conversion impact without actual inputs.',
  'journey': 'Help me review ad-to-page message match. Explain which source content and journey evidence I need to provide.',
  'retention': 'Help me review onboarding and retention using the actual content or aggregate metrics I provide. Do not invent churn causes.',
  'experiments': 'Turn the selected audit findings into a measurable experiment plan with a hypothesis, primary metric, guardrails, and verification steps. Do not invent a baseline.',
  'verification': 'Help me create a recheck plan for the selected audit. Explain which captured signals should change to verify a fix.',
  'governance': 'Review the selected audit evidence and explain provenance, uncertainty, and what should be verified before implementation.',
  'store': 'Summarize recurring issues visible in the selected audit only and explain what additional pages are needed for store-wide conclusions.',
  'integrations': 'Help me choose a safe read-only commerce or analytics integration for my use case and list the data permissions I should verify.',
  'workspaces': 'Help me plan a seller or agency workflow with clear client separation and least-privilege access.',
  'clarity-scorecard': 'Review the selected audit for clarity issues and prioritize improvements based on observed evidence.',
  'competitors': 'Help me plan an evidence-based public-page comparison. Explain what can and cannot be concluded from public competitor pages.',
  'promise-ledger': 'Help me structure source-linked claims in the Promise Ledger and distinguish observed text from unverified claims.',
};

const quickPrompts = [
  'Review the latest audit and give me the three highest-priority fixes.',
  'Explain the SEO signals and draft an accurate title tag and meta description.',
  'Explain the most important finding in simple language and tell me how to verify the fix.',
  'Based on the saved evidence, what buyer questions or trust concerns remain unanswered?',
];

export default function AiHelpWorkspace({ audits }: { audits: AuditOption[] }) {
  const [selectedAuditId, setSelectedAuditId] = useState(audits[0]?.id ?? '');
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: 'I’m PageFix AI. Ask me to explain a finding, prioritize fixes, review captured SEO signals, draft more precise page copy, or build a practical verification checklist. When you select a saved audit, I’ll use its recorded evidence—not invented analytics.',
  }]);

  useEffect(() => {
    const topic = new URLSearchParams(window.location.search).get('topic');
    const prompt = topic ? topicPrompts[topic] : undefined;
    if (prompt) setQuestion(prompt);
  }, []);

  async function ask(value?: string) {
    const prompt = (value ?? question).trim();
    if (!prompt || busy) return;
    setQuestion('');
    setError('');
    setMessages(current => [...current, { role: 'user', content: prompt }]);
    setBusy(true);
    try {
      const response = await fetch('/api/ai/help', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', cache: 'no-store',
        body: JSON.stringify({ message: prompt, ...(selectedAuditId ? { auditId: selectedAuditId } : {}) }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || 'PageFix AI could not answer this request.');
      setMessages(current => [...current, { role: 'assistant', content: data.answer, sourceUrl: data.audit?.url }]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'PageFix AI could not answer this request.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="ai-help-workspace">
    <section className="card" style={{marginBottom:18}}>
      <div className="section-heading" style={{alignItems:'flex-start',gap:18,flexWrap:'wrap'}}>
        <div><div className="label">EVIDENCE-AWARE ASSISTANT</div><h2 style={{margin:'4px 0'}}>Work with your actual audit</h2><p className="muted" style={{maxWidth:700}}>Choose a completed audit for context. PageFix AI can explain and recommend, but it will never claim to edit your live site or access private analytics it has not been given.</p></div>
        <div style={{minWidth:240,flex:'1 1 280px'}}>
          <label htmlFor="ai-help-audit" style={{display:'block',fontWeight:700,marginBottom:6}}>Audit context</label>
          <select id="ai-help-audit" value={selectedAuditId} onChange={event=>setSelectedAuditId(event.target.value)} style={{width:'100%',padding:'11px 12px',border:'1px solid var(--line, #e7dce0)',borderRadius:10,background:'white',color:'var(--ink, #2a1018)'}}>
            <option value="">General help / no saved audit</option>
            {audits.map(audit=><option key={audit.id} value={audit.id}>{audit.url} · {audit.completedAt ? new Date(audit.completedAt).toLocaleDateString() : 'date unavailable'}</option>)}
          </select>
        </div>
      </div>
      {!audits.length && <p className="muted" style={{marginTop:12}}>No completed audits are available yet. You can still ask general questions or paste your actual page copy into your question.</p>}
    </section>
    <section className="card" aria-label="PageFix AI conversation">
      <div className="section-heading"><div><div className="label">PAGEFIX AI</div><h2 style={{margin:'4px 0'}}>What would you like to improve?</h2></div><span className="badge">Evidence-first</span></div>
      <div aria-live="polite" style={{display:'grid',gap:14,margin:'20px 0'}}>
        {messages.map((message,index)=><article key={index} className="finding" style={{margin:0,background:message.role==='assistant'?'#fbf7f8':'#fff',borderColor:message.role==='assistant'?'#e7dce0':'#d6c0c8'}}>
          <div className="label">{message.role==='assistant'?'PAGEFIX AI':'YOU'}</div>
          <div style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',lineHeight:1.75,marginTop:6}}>{message.content}</div>
          {message.sourceUrl && <p className="muted" style={{fontSize:12,marginBottom:0}}>Audit context: {message.sourceUrl}</p>}
        </article>)}
        {busy && <article className="finding" role="status"><div className="label">PAGEFIX AI</div><p className="muted">Reviewing your question and the selected evidence…</p></article>}
      </div>
      {error && <div className="error-box" role="alert" style={{marginBottom:14}}>{error}</div>}
      <form onSubmit={event=>{event.preventDefault();void ask();}} style={{display:'grid',gap:10}}>
        <label htmlFor="ai-help-question" style={{fontWeight:700}}>Ask a question or describe the task</label>
        <textarea id="ai-help-question" value={question} onChange={event=>setQuestion(event.target.value)} maxLength={4000} rows={4} placeholder="Example: Explain why the missing meta description matters and draft one using only the captured page content." style={{width:'100%',resize:'vertical',padding:13,border:'1px solid var(--line, #e7dce0)',borderRadius:10,background:'white',color:'var(--ink, #2a1018)'}}/>
        <div className="section-heading" style={{gap:12,flexWrap:'wrap'}}><span className="muted" style={{fontSize:12}}>{question.length}/4000 characters</span><button className="primary-button" type="submit" disabled={busy||question.trim().length<2}>{busy?'Working…':'Ask PageFix AI →'}</button></div>
      </form>
    </section>
    <section className="card" style={{marginTop:18}}>
      <div className="label">QUICK START</div><h2>Start with a useful task</h2>
      <div className="grid grid-2" style={{marginTop:12}}>{quickPrompts.map(prompt=><button key={prompt} type="button" className="finding" onClick={()=>void ask(prompt)} disabled={busy} style={{textAlign:'left',background:'white',color:'inherit',border:'1px solid var(--line, #e7dce0)'}}>{prompt}<span style={{display:'block',fontWeight:700,marginTop:8}}>Ask this →</span></button>)}</div>
    </section>
  </div>;
}
