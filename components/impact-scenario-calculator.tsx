'use client';

import { useMemo, useState } from 'react';
import { calculateImpactScenario } from '@/lib/impact/scenario';

const currencies: Record<string, string> = { USD: '$', NGN: '₦', GBP: '£', EUR: '€' };
const numberFormat = (value: number) => new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);

export default function ImpactScenarioCalculator() {
  const [visits, setVisits] = useState('10000');
  const [conversion, setConversion] = useState('2');
  const [aov, setAov] = useState('50');
  const [change, setChange] = useState('0.2');
  const [currency, setCurrency] = useState('USD');
  const scenario = useMemo(() => calculateImpactScenario({
    monthlyVisits: visits.trim() ? Number(visits) : Number.NaN,
    conversionRatePercent: conversion.trim() ? Number(conversion) : Number.NaN,
    averageOrderValue: aov.trim() ? Number(aov) : Number.NaN,
    absoluteConversionChangePoints: change.trim() ? Number(change) : Number.NaN,
  }), [visits, conversion, aov, change]);
  const money = (value: number) => currencies[currency] + numberFormat(value);
  return <div className="impact-calculator-layout">
    <form className="card impact-calculator-form" onSubmit={e=>e.preventDefault()}>
      <div className="label">SELLER-PROVIDED ASSUMPTIONS</div><h2>Build a scenario</h2>
      <p className="muted">Enter your own figures. These values are not pulled from analytics and are not saved or treated as verified data.</p>
      <label>Monthly page visits<input type="number" min="0" step="1" value={visits} onChange={e=>setVisits(e.target.value)} /></label>
      <label>Current conversion rate (%)<input type="number" min="0" max="100" step="0.01" value={conversion} onChange={e=>setConversion(e.target.value)} /></label>
      <label>Average order value<select value={currency} onChange={e=>setCurrency(e.target.value)}><option value="USD">USD — US dollar</option><option value="NGN">NGN — Nigerian naira</option><option value="GBP">GBP — British pound</option><option value="EUR">EUR — euro</option></select><input type="number" min="0" step="0.01" value={aov} onChange={e=>setAov(e.target.value)} /></label>
      <label>Hypothetical absolute conversion change (percentage points)<input type="number" min="0" max="100" step="0.01" value={change} onChange={e=>setChange(e.target.value)} /></label>
      {!scenario && <p className="impact-input-error" role="alert">Check your values. Conversion rate plus the hypothetical change cannot exceed 100%.</p>}
    </form>
    <section className="impact-calculator-results">
      <div className="card impact-result-card"><div className="label">BASELINE FROM YOUR INPUTS</div><div className="impact-result-number">{scenario ? money(scenario.baselineRevenue) : '—'}</div><p>Illustrative monthly revenue at the stated conversion rate and average order value.</p><div className="impact-result-detail"><span>Expected orders (mathematical estimate)</span><strong>{scenario ? numberFormat(scenario.baselineOrders) : '—'}</strong></div></div>
      <div className="card impact-result-card impact-result-highlight"><div className="label">HYPOTHETICAL SCENARIO</div><div className="impact-result-number">{scenario ? money(scenario.scenarioRevenue) : '—'}</div><p>Illustrative revenue if the conversion rate changed by the absolute percentage-point amount entered.</p><div className="impact-result-detail"><span>Scenario order difference</span><strong>{scenario ? numberFormat(scenario.deltaOrders) : '—'}</strong></div><div className="impact-result-detail"><span>Illustrative revenue difference</span><strong>{scenario ? money(scenario.deltaRevenue) : '—'}</strong></div></div>
      <div className="impact-assumption-note"><strong>This is scenario math—not a forecast.</strong><p>It assumes visits and average order value stay constant and does not establish that PageFix caused, can cause, or will cause the entered conversion change. It excludes margins, refunds, costs, seasonality and traffic mix. Use measured outcomes only when reliable business data and an appropriate evaluation method are available.</p></div>
    </section>
  </div>;
}
