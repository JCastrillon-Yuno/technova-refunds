import type { Refund, ScoredRefund, RiskLevel } from '../types';

export function scoreRefund(refund: Refund, allRefunds: Refund[]): ScoredRefund {
  let score = 0;
  const reasons: string[] = [];

  // How many times this customer appears in the dataset
  const customerRefunds = allRefunds.filter((r) => r.customerId === refund.customerId);
  const customerTotal = customerRefunds.length;

  // How many times within 30 days of this refund
  const refundDate = new Date(refund.date).getTime();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const refundsIn30Days = customerRefunds.filter((r) => {
    const diff = Math.abs(new Date(r.date).getTime() - refundDate);
    return diff <= thirtyDays && r.id !== refund.id;
  }).length;

  if (refundsIn30Days >= 2) {
    score += 30;
    reasons.push('3+ refunds in 30 days');
  }

  if (customerTotal >= 5) {
    score += 15;
    reasons.push('5+ lifetime refunds');
  }

  if (refund.amountUSD > 500) {
    score += 20;
    reasons.push('High-value refund');
  }

  if (refund.accountAgeDays < 60) {
    score += 15;
    reasons.push('New account, high value');
  }

  if (refund.reason === 'fraud_prevention') {
    score += 15;
    reasons.push('Fraud prevention flag');
  }

  if (refund.reason === 'duplicate_charge') {
    score += 10;
    reasons.push('Duplicate charge pattern');
  }

  // Geographic/processor cluster: 5+ others with same city + processor within 7 days
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const clusterCount = allRefunds.filter((r) => {
    if (r.id === refund.id) return false;
    if (r.city !== refund.city || r.processor !== refund.processor) return false;
    const diff = Math.abs(new Date(r.date).getTime() - refundDate);
    return diff <= sevenDays;
  }).length;

  if (clusterCount >= 4) {
    score += 20;
    reasons.push('Geographic/processor cluster');
  }

  // Refund > 90% of order amount
  if (refund.orderAmountUSD > 0 && refund.amountUSD / refund.orderAmountUSD >= 0.9) {
    score += 10;
    reasons.push('Full-amount refund');
  }

  const level: RiskLevel = score >= 61 ? 'high' : score >= 31 ? 'medium' : 'low';

  return {
    ...refund,
    riskScore: Math.min(score, 100),
    riskLevel: level,
    riskReasons: reasons,
  };
}

export function scoreAll(refunds: Refund[]): ScoredRefund[] {
  return refunds.map((r) => scoreRefund(r, refunds));
}
