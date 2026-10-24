import { describe, expect, it } from 'vitest';
import { FEATURE_SPECIFICATIONS, buildFeatureSystemPrompt, getFeatureSpecification, listFeatureSpecifications } from '../lib/intelligence/feature-specifications';

describe('feature specification registry', () => {
  it('defines all requested features with unique IDs', () => {
    expect(FEATURE_SPECIFICATIONS).toHaveLength(20);
    expect(new Set(FEATURE_SPECIFICATIONS.map((item) => item.id)).size).toBe(20);
  });

  it('assigns each feature objective, inputs, processing, output and a system prompt', () => {
    for (const item of FEATURE_SPECIFICATIONS) {
      expect(item.objective.length, item.id).toBeGreaterThan(20);
      expect(item.requiredInputs.length, item.id).toBeGreaterThan(0);
      expect(item.processingSteps.length, item.id).toBeGreaterThan(0);
      expect(item.systemPrompt.length, item.id).toBeGreaterThan(200);
      expect(item.output.fields.some((field) => field.key === 'findings')).toBe(true);
      expect(item.output.fields.some((field) => field.key === 'actions')).toBe(true);
      expect(item.safetyRules.length).toBeGreaterThan(0);
    }
  });

  it('keeps the requested sections filterable', () => {
    expect(listFeatureSpecifications('ANALYSIS')).toHaveLength(9);
    expect(listFeatureSpecifications('OPTIMIZATION')).toHaveLength(10);
    expect(listFeatureSpecifications('AI_WORKBENCH')).toHaveLength(1);
  });

  it('returns null for unknown prompts and the exact prompt for known features', () => {
    expect(buildFeatureSystemPrompt('unknown-feature')).toBeNull();
    expect(buildFeatureSystemPrompt('grounded-copy-fixes')).toContain('Rewrite exact text');
    expect(getFeatureSpecification('impact-analysis')?.output.fields.some((field) => field.key === 'estimate')).toBe(true);
  });

  it('requires evidence and approval safeguards throughout the registry', () => {
    for (const item of FEATURE_SPECIFICATIONS) {
      expect(item.systemPrompt).toContain('Never fabricate observations');
      expect(item.systemPrompt).toContain('Return schema-valid JSON only');
      expect(item.output.rules.some((rule) => rule.includes('approvalRequired: true'))).toBe(true);
    }
  });
});
