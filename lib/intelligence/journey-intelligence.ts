export type JourneyStage = {
  id: string;
  name: string;
  url: string;
  content: string;
  expectedNextStep: string;
};

export type JourneyObservation = {
  stageId: string;
  stageName: string;
  kind: 'MISSING_CONTENT' | 'HANDOFF_UNCLEAR' | 'DESTINATION_UNVERIFIED' | 'POSSIBLE_FRICTION' | 'INVALID_URL_FORMAT';
  label: 'Directly Observed Evidence' | 'Inferred Risk' | 'Hypothesis' | 'Recommendation';
  detail: string;
  recommendation: string;
};

const NEXT_STEP_SIGNAL = /add to cart|buy now|shop now|proceed to checkout|continue to checkout|checkout|place order|complete purchase|pay now|continue|next step|book now|request a quote|contact sales|start free|start trial|sign up|get started|submit/i;

function hasValidPublicHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      !parsed.username && !parsed.password && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function expectedActionFound(expected: string, content: string): boolean {
  const normalizedExpected = expected.trim().toLowerCase();
  const normalizedContent = content.toLowerCase();
  if (!normalizedExpected) return true;
  const actionPatterns: Array<{ match: RegExp; content: RegExp }> = [
    { match: /^(?:proceed to checkout|continue to checkout|go to checkout)$/, content: /\b(?:checkout|continue to checkout|proceed to checkout)\b/i },
    { match: /^(?:add to cart|add to basket|add to bag)$/, content: /\b(?:add to (?:cart|basket|bag)|add item)\b/i },
    { match: /^(?:complete purchase|complete order|place order)$/, content: /\b(?:place order|pay now|complete (?:purchase|order)|confirm order)\b/i },
    { match: /^(?:start free trial|start a free trial|start trial)$/, content: /\b(?:start (?:a )?free trial|start trial|try for free)\b/i },
    { match: /^(?:request a quote|get a quote)$/, content: /\b(?:request (?:a )?quote|get (?:a )?quote|contact sales)\b/i },
    { match: /^(?:learn more|view details|see details)$/, content: /\b(?:learn more|view details|see details|explore details)\b/i },
  ];
  const alias = actionPatterns.find(item => item.match.test(normalizedExpected));
  return alias ? alias.content.test(content) : normalizedContent.includes(normalizedExpected);
}

export function analyzeJourneyStages(stages: JourneyStage[]): JourneyObservation[] {
  const observations: JourneyObservation[] = [];
  const populated = stages.filter(stage => stage.content.trim());
  for (const stage of stages) {
    const content = stage.content.trim();
    if (stage.url.trim() && !hasValidPublicHttpUrl(stage.url.trim())) {
      observations.push({
        stageId: stage.id,
        stageName: stage.name,
        kind: 'INVALID_URL_FORMAT',
        label: 'Recommendation',
        detail: 'The supplied destination is not a valid absolute HTTP(S) URL without embedded credentials. No network request was made to this address.',
        recommendation: 'Correct the URL to a public https:// or http:// address. URL format validation does not establish that the destination is reachable or safe to purchase from.',
      });
    }
    if (!content) {
      observations.push({
        stageId: stage.id,
        stageName: stage.name,
        kind: 'DESTINATION_UNVERIFIED',
        label: 'Recommendation',
        detail: 'No page content was supplied for this journey step, so this step has not been inspected.',
        recommendation: 'Paste the visible page content or run an authorized PageFix inspection before drawing conclusions about this step.',
      });
      continue;
    }
    if (stage.expectedNextStep.trim() && !expectedActionFound(stage.expectedNextStep, content)) {
      observations.push({
        stageId: stage.id,
        stageName: stage.name,
        kind: 'HANDOFF_UNCLEAR',
        label: 'Inferred Risk',
        detail: 'The expected next-step wording supplied for this stage was not found as an exact phrase in the supplied content. The control may use different wording or be rendered outside the captured text.',
        recommendation: 'Verify the actual control and its destination. Make the next action understandable and consistent with the promise that brought the visitor here.',
      });
    } else if (!stage.expectedNextStep.trim() && !NEXT_STEP_SIGNAL.test(content)) {
      observations.push({
        stageId: stage.id,
        stageName: stage.name,
        kind: 'HANDOFF_UNCLEAR',
        label: 'Inferred Risk',
        detail: 'No common purchase, signup, booking, or continuation action was detected in the supplied page text.',
        recommendation: 'Check the rendered page for a clear, working next step that matches the journey goal. Custom or script-rendered controls may not be detectable from pasted text.',
      });
    }
  }

  for (let index = 0; index < populated.length - 1; index += 1) {
    const current = populated[index];
    const next = populated[index + 1];
    if (current.url.trim() && next.url.trim() && current.url.trim() === next.url.trim()) {
      observations.push({
        stageId: current.id,
        stageName: current.name,
        kind: 'POSSIBLE_FRICTION',
        label: 'Hypothesis',
        detail: 'Two adjacent journey steps use the same supplied URL. This may be intentional for a single-page flow, but it is worth confirming that the handoff is represented correctly.',
        recommendation: 'Confirm whether this is a single-page application or whether the intended next destination should be recorded separately.',
      });
    }
  }
  return observations;
}

export type CheckoutMetricsInput = {
  checkoutStarts: number | null;
  completedOrders: number | null;
  windowLabel: string;
};

export type CheckoutMetricsResult =
  | { valid: false; reason: string }
  | { valid: true; checkoutStarts: number; completedOrders: number; incompleteCheckouts: number; completionRatePercent: number; abandonmentRatePercent: number; windowLabel: string };

export function calculateCheckoutMetrics(input: CheckoutMetricsInput): CheckoutMetricsResult {
  const starts = input.checkoutStarts;
  const orders = input.completedOrders;
  if (starts === null || orders === null || !Number.isFinite(starts) || !Number.isFinite(orders)) {
    return { valid: false, reason: 'Enter checkout starts and completed orders from an authorized analytics or commerce source.' };
  }
  if (!Number.isInteger(starts) || !Number.isInteger(orders) || starts < 0 || orders < 0) {
    return { valid: false, reason: 'Counts must be non-negative whole numbers.' };
  }
  if (starts === 0) {
    return { valid: false, reason: 'Checkout starts must be greater than zero to calculate a rate.' };
  }
  if (orders > starts) {
    return { valid: false, reason: 'Completed orders cannot exceed checkout starts for the same defined cohort and time window.' };
  }
  if (!input.windowLabel.trim()) {
    return { valid: false, reason: 'Name the reporting window so the result has a clear scope.' };
  }
  const incomplete = starts - orders;
  return {
    valid: true,
    checkoutStarts: starts,
    completedOrders: orders,
    incompleteCheckouts: incomplete,
    completionRatePercent: (orders / starts) * 100,
    abandonmentRatePercent: (incomplete / starts) * 100,
    windowLabel: input.windowLabel.trim(),
  };
}

export function summarizeTrafficWasteRequirements(hasAdSpend: boolean, hasClicks: boolean, hasLandingSessions: boolean, hasConversions: boolean): string[] {
  const requirements = [
    'Link ad clicks to the intended destination and use a consistent date range, timezone, attribution window and campaign identifier.',
    'Confirm destination availability, redirect behaviour and campaign parameters on the actual landing URL.',
  ];
  if (!hasAdSpend) requirements.push('Ad spend is missing; actual financial waste cannot be quantified.');
  if (!hasClicks) requirements.push('Ad click counts are missing; click-through and click-to-session continuity cannot be assessed.');
  if (!hasLandingSessions) requirements.push('Landing sessions are missing; clicks cannot be compared with successful page arrivals.');
  if (!hasConversions) requirements.push('Conversion events are missing; conversion efficiency or cost per acquisition cannot be calculated.');
  return requirements;
}
