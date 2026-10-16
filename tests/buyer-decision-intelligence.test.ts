import { describe, expect, it } from 'vitest';
import { buildBuyerDecisionFindings, buildBuyerQuestionChecks, summarizeTrustSignals } from '@/lib/audit/buyer-decision-intelligence';
const base = { url: 'https://shop.example/products/widget', title: 'Widget', bodyText: 'A product for everyday use. Add to cart. Best-selling results guaranteed.', headings: [{tag:'H1',text:'Widget'}], buttons: ['Add to cart'], links: [{text:'Home',href:'/'}], forms: 0, textEvidenceId: 'e-text', domEvidenceId: 'e-dom', linkEvidenceId: 'e-link' };
describe('buyer decision intelligence', () => {
  it('treats strong commercial claims as hypotheses, not verdicts', () => {
    const claim = buildBuyerDecisionFindings(base).find(item => item.title.includes('strong commercial claim'));
    expect(claim?.hypothesis).toBe('Hypothesis');
    expect(claim?.observation).toContain('cannot determine whether the claim is true');
    expect(claim?.evidenceIds).toContain('e-text');
  });
  it('builds evidence-linked buyer questions and trust coverage', () => {
    expect(buildBuyerQuestionChecks(base).some(item => item.question.includes('main benefit'))).toBe(true);
    expect(buildBuyerQuestionChecks(base).every(item => item.evidenceIds.length > 0)).toBe(true);
    const trust = summarizeTrustSignals({title:'Widget',bodyText:'Delivery available. Returns accepted. Contact us.',links:[]});
    expect(trust.find(item => item.key === 'delivery')?.status).toBe('Observed in capture');
    expect(trust.find(item => item.key === 'payment')?.status).toBe('Not observed in capture');
  });
  it('requires browser evidence before reporting above-the-fold issues', () => {
    expect(buildBuyerDecisionFindings(base).some(item => item.title.includes('initial viewport'))).toBe(false);
    const findings = buildBuyerDecisionFindings({...base, viewportEvidenceId:'e-view', viewportSignals:[{viewport:'mobile',viewportWidth:390,documentWidth:390,horizontalOverflow:false,primaryHeadingVisible:true,commercialActionVisible:false,visibleTextLength:200}]});
    expect(findings.find(item => item.title.includes('initial viewport'))?.evidenceIds).toContain('e-view');
  });
});
