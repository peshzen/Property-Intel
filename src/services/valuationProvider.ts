import type { Comp, PropertyFacts, InvestorMetrics } from '../types';

export function calculateInvestorMetrics(property: PropertyFacts, comps: Comp[]): InvestorMetrics {
  const prices = comps.map((c) => c.soldPrice).sort((a, b) => a - b);
  const averageCompValue = prices.reduce((a, b) => a + b, 0) / Math.max(prices.length, 1);
  const medianCompValue = prices.length ? prices[Math.floor(prices.length / 2)] : 0;
  const avgPpsf = comps.reduce((acc, c) => acc + c.soldPrice / Math.max(c.squareFeet, 1), 0) / Math.max(comps.length, 1);
  const estimatedArv = Math.round(avgPpsf * property.squareFeet);
  const rehabAdjustedArv = Math.round(estimatedArv * 0.94);
  const suggestedMaxOffer = Math.round(rehabAdjustedArv * 0.7 - 30000);
  const estimatedEquity = Math.max(0, estimatedArv - property.lastSalePrice);
  const projectedProfit = Math.max(0, rehabAdjustedArv - suggestedMaxOffer - 30000);
  const rentalEstimate = property.estimatedRent ?? Math.round((property.estimatedValue ?? estimatedArv) * 0.007);
  const capRate = Number((((rentalEstimate * 12 * 0.92 - (property.taxAssessment ?? 0) * 0.015) / Math.max(suggestedMaxOffer, 1)) * 100).toFixed(2));
  const cashOnCash = Number(((projectedProfit / Math.max(suggestedMaxOffer * 0.25, 1)) * 100).toFixed(2));
  const confidence = Math.min(99, Math.max(45, comps.length * 10 + (property.estimatedValue ? 20 : 5)));
  return { averageCompValue, medianCompValue, pricePerSqft: Math.round(avgPpsf), estimatedArv, rehabAdjustedArv, suggestedMaxOffer, estimatedEquity, projectedProfit, rentalEstimate, capRate, cashOnCash, confidence };
}
