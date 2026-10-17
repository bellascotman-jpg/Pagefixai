export type RetentionStep = {
  id: string;
  name: string;
  content: string;
  expectedNextStep: string;
  expectedOutcome: string;
};

export type RetentionEmail = {
  subject: string;
  body: string;
  callToAction: string;
};

export type RetentionInput = {
  name: string;
  businessType: 'saas' | 'ecommerce';
  flowType: 'signup' | 'onboarding' | 'activation' | 'retention' | 'pricing' | 'cancellation';
  promisedOutcome: string;
  steps: RetentionStep[];
  emails: RetentionEmail[];
  pricingText: string;
  cancellationText: string;
  metrics: {
    usersStarted: number | null;
    usersCompleted: number | null;
    activatedUsers: number | null;
    windowLabel: string;
  };
};

export type RetentionFinding = {
  id: string;
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  label: 'Directly Observed Evidence' | 'Inferred Risk' | 'Hypothesis' | 'Recommendation';
  detail: string;
  whyItMatters: string;
  recommendation: string;
  source: string;
};

export type RetentionAnalysisResult = {
  findings: RetentionFinding[];
  metrics: null | {
    usersStarted: number;
    usersCompleted: number;
    activatedUsers: number | null;
    completionRatePercent: number;
    incompleteRatePercent: number;
    activationRatePercent: number | null;
    windowLabel: string;
    source: 'User-supplied aggregate metrics';
  };
};

const NEXT_STEP = /continue|next|start|create|connect|import|invite|finish|complete|activate|verify|confirm|submit|save|book|shop|buy|checkout|open|try|use|launch|go to|view|explore|cancel|manage/i;
const VALUE_SIGNAL = /first value|first result|aha moment|activate|activation|publish|launch|connect|import|invite|create|complete|use your|see your|generate|send your first|place your first|first order|first campaign|first report/i;
const BILLING_SIGNAL = /price|pricing|billing|bill|renew|renewal|monthly|annual|yearly|per user|per seat|trial|free trial|subscription|tax|fee|charged|payment/i;
const PLAN_DETAILS_SIGNAL = /compare|plan|tier|included|what.s included|feature|limit|usage|seat|upgrade|downgrade|starter|growth|business|enterprise/i;
const CANCELLATION_SIGNAL = /cancel|cancellation|end plan|end subscription|downgrade|refund|notice period|billing period|renewal date|delete account/i;
const EMAIL_ACTION_SIGNAL = /click|start|continue|complete|finish|connect|import|invite|create|activate|verify|confirm|book|view|open|use|reply|sign in|log in|return to|try/i;

function expectedActionObserved(expected: string, text: string): boolean {
  const normalize = (value: string) => value.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word && !['a', 'an', 'the', 'your', 'my', 'our', 'to', 'for', 'please'].includes(word));
  const wanted = normalize(expected);
  const available = new Set(normalize(text));
  return wanted.length > 0 && wanted.every(word => available.has(word));
}

function finding(
  id: string,
  title: string,
  severity: RetentionFinding['severity'],
  label: RetentionFinding['label'],
  detail: string,
  whyItMatters: string,
  recommendation: string,
  source: string,
): RetentionFinding {
  return { id, title, severity, label, detail, whyItMatters, recommendation, source };
}

export function analyzeRetentionJourney(input: RetentionInput): RetentionAnalysisResult {
  const findings: RetentionFinding[] = [];
  const allStepContent = input.steps.map(step => step.content).join('\n');
  const normalizedFlow = input.flowType;

  if (!input.steps.length || !input.steps.some(step => step.content.trim())) {
    findings.push(finding(
      'journey-content-missing', 'Journey content is missing or incomplete', 'HIGH', 'Recommendation',
      'No usable step content was supplied, so the flow cannot be assessed as if it had been inspected.',
      'A meaningful review needs the actual signup/onboarding steps, instructions, and next actions.',
      'Add each important screen or step with its visible copy, instruction text, and expected next action. Leave inaccessible steps explicitly marked as unknown.',
      'Input completeness',
    ));
  }

  for (const step of input.steps) {
    if (!step.content.trim()) {
      findings.push(finding(
        `step-content-${step.id}`, `${step.name || 'Journey step'} has not been inspected`, 'MEDIUM', 'Recommendation',
        'No content was supplied for this step. This is an evidence gap, not proof that the live product lacks guidance.',
        'Uninspected steps can hide unclear instructions or a broken handoff.',
        'Paste the visible instructions and controls for this step or inspect it directly before concluding whether it works.',
        `Step: ${step.name}`,
      ));
      continue;
    }
    const stepText = `${step.name} ${step.content}`;
    if (step.expectedNextStep.trim() && !expectedActionObserved(step.expectedNextStep, stepText)) {
      findings.push(finding(
        `next-step-${step.id}`, `Expected next action was not observed in ${step.name}`, 'HIGH', 'Inferred Risk',
        `The expected action “${step.expectedNextStep.trim()}” was not found in the supplied text for this step. It may use different wording or appear in an unprovided interactive control.`,
        'Users may not know how to progress if the next action is not visible or clearly explained.',
        'Verify the live control and its destination. Make the next action explicit, visible, and consistent with the preceding promise.',
        `User-supplied content: ${step.name}`,
      ));
    } else if (!step.expectedNextStep.trim() && !NEXT_STEP.test(stepText)) {
      findings.push(finding(
        `next-step-unknown-${step.id}`, `Next action is unclear in ${step.name}`, 'MEDIUM', 'Inferred Risk',
        'No common action or continuation cue was found in the supplied text. Custom controls may not be recognized.',
        'A user who does not know what to do next may pause or leave the flow.',
        'Name the next step in plain language and provide a visible control that moves the user toward the intended outcome.',
        `User-supplied content: ${step.name}`,
      ));
    }
    if (['onboarding', 'activation', 'signup'].includes(normalizedFlow) && !step.expectedOutcome.trim()) {
      findings.push(finding(
        `outcome-${step.id}`, `Success outcome is not defined for ${step.name}`, 'LOW', 'Recommendation',
        'No expected completion outcome was provided for this step.',
        'Without a defined outcome, it is difficult to distinguish progress from activity that does not help the user reach value.',
        'Define a verifiable completion event for this step, such as successfully connecting a data source or publishing a first item.',
        `User-supplied journey definition: ${step.name}`,
      ));
    }
  }

  if (input.promisedOutcome.trim()) {
    const terms = input.promisedOutcome.toLowerCase().match(/[a-z0-9]{4,}/g) ?? [];
    const distinctTerms = [...new Set(terms)].filter(term => !['yourself', 'their', 'after', 'before', 'with', 'from', 'into', 'that', 'this', 'will', 'help', 'easy', 'quick'].includes(term));
    const overlap = distinctTerms.filter(term => allStepContent.toLowerCase().includes(term)).length;
    if (distinctTerms.length >= 3 && overlap / distinctTerms.length < 0.2) {
      findings.push(finding(
        'promise-continuity', 'Signup promise may not carry through the supplied journey', 'MEDIUM', 'Hypothesis',
        'The supplied promised outcome shares few distinctive words with the supplied step content. This lexical check cannot establish semantic mismatch, and equivalent wording may be used.',
        'If the expectation set before signup is not reinforced in onboarding, users may struggle to see how the product delivers the promised value.',
        'Compare the actual landing-page promise with the first-run experience. Make the path to the promised outcome explicit and avoid promising capabilities the product does not provide.',
        'User-supplied promise compared with user-supplied journey text',
      ));
    }
  }

  for (let index = 0; index < input.emails.length; index += 1) {
    const email = input.emails[index];
    const emailText = `${email.subject} ${email.body}`;
    if (!emailText.trim()) continue;
    if (!EMAIL_ACTION_SIGNAL.test(email.callToAction.trim() || emailText)) {
      findings.push(finding(
        `email-cta-${index + 1}`, `Onboarding message ${index + 1} has no clear action supplied`, 'MEDIUM', 'Inferred Risk',
        'The supplied email/message has no recognizable next-action CTA. The actual email may include a button or link not pasted into this analysis.',
        'A message that explains a product but gives no concrete next step may fail to move the user toward activation.',
        'Give the message one primary, truthful action tied to the user’s next milestone, and confirm that its destination works.',
        `User-supplied onboarding message ${index + 1}`,
      ));
    }
  }

  if (input.flowType === 'pricing' && !BILLING_SIGNAL.test(input.pricingText)) {
    findings.push(finding(
      'pricing-billing-clarity', 'Pricing or billing terms were not observed in the supplied text', 'HIGH', 'Inferred Risk',
      'The supplied pricing text did not contain common price, billing, renewal, trial, or fee terms. The pricing page has not been independently crawled by this workspace.',
      'Customers may be unsure what they will pay, when charges recur, or what a trial includes.',
      'State the actual price and currency, billing interval, renewal behaviour, trial conversion, applicable taxes/fees, and plan limits where relevant. Use verified terms only.',
      'User-supplied pricing text',
    ));
  }

  if (input.flowType === 'pricing' && BILLING_SIGNAL.test(input.pricingText) && !PLAN_DETAILS_SIGNAL.test(input.pricingText)) {
    findings.push(finding(
      'plan-comparison-clarity', 'Plan differences or limits were not observed in the supplied pricing text', 'MEDIUM', 'Inferred Risk',
      'The supplied pricing text contains a billing or price cue but no recognizable plan comparison, included-feature, usage-limit, or tier wording. This check may not apply to a product with only one plan.',
      'When several plans exist, buyers need to understand what changes between tiers and which limits apply before choosing.',
      'If multiple plans are offered, state the meaningful differences, usage limits, included features, seats, and upgrade conditions in comparable language. Use the actual product entitlements.',
      'User-supplied pricing text',
    ));
  }

  if (input.flowType === 'cancellation' && !CANCELLATION_SIGNAL.test(input.cancellationText)) {
    findings.push(finding(
      'cancellation-clarity', 'Cancellation steps or terms were not observed in the supplied text', 'HIGH', 'Inferred Risk',
      'The supplied cancellation text did not include common cancellation, downgrade, refund, or renewal terms. This does not prove cancellation is unavailable in the live product.',
      'Unclear exit terms can undermine trust and create avoidable support work or billing disputes.',
      'Document the actual cancellation route, when access ends, any renewal timing, refund eligibility and applicable conditions. Do not create artificial obstacles to cancellation.',
      'User-supplied cancellation text',
    ));
  }

  if (input.flowType === 'retention' && !VALUE_SIGNAL.test(allStepContent)) {
    findings.push(finding(
      'ongoing-value-cue', 'Ongoing value or a return-use cue was not observed', 'LOW', 'Inferred Risk',
      'The supplied retention journey did not contain common signals for returning to a saved task, seeing progress, or reaching a recurring outcome.',
      'Users may need a clear reason and practical next step to return after their first session.',
      'Tie follow-up prompts to a real unfinished task, saved progress, or recurring customer goal. Avoid sending messages without a relevant reason.',
      'User-supplied retention journey text',
    ));
  }

  let metrics: RetentionAnalysisResult['metrics'] = null;
  const m = input.metrics;
  if (m.usersStarted !== null && m.usersCompleted !== null && m.windowLabel.trim() && m.usersStarted > 0 &&
      Number.isInteger(m.usersStarted) && Number.isInteger(m.usersCompleted) && m.usersCompleted >= 0 &&
      m.usersCompleted <= m.usersStarted &&
      (m.activatedUsers === null || (Number.isInteger(m.activatedUsers) && m.activatedUsers >= 0 && m.activatedUsers <= m.usersStarted))) {
    metrics = {
      usersStarted: m.usersStarted,
      usersCompleted: m.usersCompleted,
      activatedUsers: m.activatedUsers,
      completionRatePercent: Math.round(m.usersCompleted / m.usersStarted * 10000) / 100,
      incompleteRatePercent: Math.round((m.usersStarted - m.usersCompleted) / m.usersStarted * 10000) / 100,
      activationRatePercent: m.activatedUsers === null ? null : Math.round(m.activatedUsers / m.usersStarted * 10000) / 100,
      windowLabel: m.windowLabel.trim(),
      source: 'User-supplied aggregate metrics',
    };
  } else if (m.usersStarted !== null || m.usersCompleted !== null || m.activatedUsers !== null) {
    findings.push(finding(
      'metrics-not-calculated', 'Retention metrics were not calculated', 'LOW', 'Recommendation',
      'The supplied counts were incomplete, inconsistent, or lacked a named reporting window. No rate was calculated.',
      'Rates are only meaningful when their numerator, denominator, cohort, and time window are clearly defined.',
      'Enter non-negative whole-number counts from the same cohort and reporting window; completed and activated users must not exceed users started.',
      'User-supplied aggregate metrics (validation)',
    ));
  }

  return { findings, metrics };
}
