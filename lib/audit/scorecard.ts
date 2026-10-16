export type ScorecardState = 'Strong signals in capture' | 'Partial signals' | 'Needs review' | 'Unable to assess';

export type ScorecardDimension = {
  key: string;
  title: string;
  state: ScorecardState;
  explanation: string;
  basis: string;
  signalsObserved: number;
  signalsReviewed: number;
};

type BuyerQuestion = { question: string; status: string };
type Finding = { title: string; hypothesis?: string | null; observation?: string | null };

function dimension(
  key: string,
  title: string,
  relevant: BuyerQuestion[],
  findings: Finding[],
  explanation: string,
): ScorecardDimension {
  if (!relevant.length) {
    return { key, title, state: 'Unable to assess', explanation, basis: 'No relevant buyer-question signals were recorded in this inspection.', signalsObserved: 0, signalsReviewed: 0 };
  }
  const observed = relevant.filter(item => item.status === 'OBSERVED_IN_CAPTURED_PAGE').length;
  const matchedFindings = findings.filter(item => relatedFindingPattern.test(item.title + ' ' + (item.observation ?? ''))).length;
  const ratio = observed / relevant.length;
  const state: ScorecardState = ratio >= 0.8 && matchedFindings === 0
    ? 'Strong signals in capture'
    : ratio >= 0.5
      ? 'Partial signals'
      : 'Needs review';
  return {
    key,
    title,
    state,
    explanation,
    basis: `${observed} of ${relevant.length} relevant page signals were observed in the captured content. Findings remain visible separately.`,
    signalsObserved: observed,
    signalsReviewed: relevant.length,
  };
}

/**
 * Produces a qualitative, explainable summary from captured signals only.
 * It deliberately does not emit a universal numeric conversion or quality score.
 */
export function buildCommerceClarityScorecard(input: {
  category?: string | null;
  buyerQuestions: BuyerQuestion[];
  findings: Finding[];
}): ScorecardDimension[] {
  const { buyerQuestions, findings } = input;
  const questions = (terms: RegExp) => buyerQuestions.filter(item => terms.test(item.question));
  const hasFinding = (terms: RegExp) => findings.some(item => terms.test(item.title + ' ' + (item.observation ?? '')));
  const productInfo = questions(/product details|specifications|dimensions|ingredients|size|fit|compatibility|what exactly|included/i);
  const buyerCoverage = buyerQuestions.filter(item => /what does this product|shipping|return|product details|contact|commercial next action|images|compatibility|size|ingredients|dimensions/i.test(item.question));
  const offer = questions(/cost|price|commercial next action/i);
  const trust = questions(/shipping|return|contact/i);
  const usability = questions(/commercial next action|images/i);
  const expectations = questions(/shipping|return|product details|compatibility|size|ingredients|dimensions/i);
  const message = findings.filter(item => /conflict|mismatch|promise|shipping|warranty|return statement|offer condition/i.test(item.title));
  const results = [
    dimension('product-information', 'Product information completeness', productInfo, findings, 'Checks whether relevant product-detail signals were observed. Category-specific gaps remain recommendations to review, not proof that details do not exist elsewhere.', /product details|specification|dimension|ingredient|size|fit|compatibility|information was not observed/i),
    dimension('buyer-objections', 'Buyer objection coverage', buyerCoverage, findings, 'Summarises whether common buyer-question signals appeared in the captured page; it does not claim to know what real shoppers asked.', /buyer question|compatibility|size|fit|included|shipping|return/i),
    dimension('offer-clarity', 'Offer clarity', offer, findings, 'Reviews whether price and a clear next commercial action were observed in the captured content.', /price|commercial action|call to action|offer|discount/i),
    dimension('trust-reassurance', 'Trust and reassurance', trust, findings, 'Checks for visible shipping, returns and contact signals. Their presence does not independently validate policy accuracy.', /shipping|delivery|return|refund|contact|warranty|trust/i),
    dimension('conversion-usability', 'Conversion usability signals', usability, findings, 'Reviews whether common commercial actions and images were detected. This is not a functional checkout test.', /commercial action|button|image|link|form|checkout/i),
    dimension('message-consistency', 'Claim and message consistency', buyerQuestions.filter(item => /shipping|return|product details/i.test(item.question)), findings, 'Shows whether the current finding set contains candidate contradictions or promise mismatches. Absence of a finding is not proof of consistency.', /conflict|mismatch|promise|shipping|warranty|return statement|offer condition/i),
    dimension('post-purchase', 'Post-purchase expectation clarity', expectations, findings, 'Reviews visible delivery, returns and product-detail signals that can shape expectations. It does not predict actual returns.', /shipping|delivery|return|refund|compatibility|size|ingredients|dimensions|warranty/i),
  ];
  return results.map(item => {
    if (item.key === 'message-consistency') {
      const issueCount = message.length;
      return {
        ...item,
        state: issueCount ? 'Needs review' as const : 'Unable to assess' as const,
        signalsObserved: 0,
        signalsReviewed: 0,
        basis: issueCount ? `${issueCount} candidate claim/consistency finding(s) need review.` : 'No candidate contradiction was generated by the current rules; consistency remains unverified.',
      };
    }
    return item;
  });
}
