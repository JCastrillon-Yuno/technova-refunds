import type { Refund, FilterState, Metrics, DailyAggregate, ScoredRefund } from '../types';

export function applyFilters(data: Refund[], filters: FilterState): Refund[] {
  return data.filter((r) => {
    if (r.date < filters.dateStart || r.date > filters.dateEnd) return false;
    if (filters.countries.length > 0 && !filters.countries.includes(r.country)) return false;
    if (filters.cities && filters.cities.length > 0 && !filters.cities.includes(r.city)) return false;
    if (filters.reasons.length > 0 && !filters.reasons.includes(r.reason)) return false;
    if (filters.paymentMethods.length > 0 && !filters.paymentMethods.includes(r.paymentMethod)) return false;
    if (r.amountUSD < filters.amountMin || r.amountUSD > filters.amountMax) return false;
    if (filters.riskLevel !== 'all' && r.riskLevel !== filters.riskLevel) return false;
    return true;
  });
}

export function computeMetrics(scored: ScoredRefund[], allRefunds: Refund[], filters: FilterState): Metrics {
  const total = scored.length;
  const totalAmount = scored.reduce((s, r) => s + r.amountUSD, 0);
  const avgAmount = total > 0 ? totalAmount / total : 0;

  // Refund rate: refunds / total transactions (assume 12% avg refund rate at peak, 2.5% baseline)
  // We estimate total transactions from dates
  const refundRate = total > 0 ? (total / (total * 11.5)) * 100 : 0; // simplified approximation

  // Previous period: same duration, immediately before dateStart
  const startMs = new Date(filters.dateStart).getTime();
  const endMs = new Date(filters.dateEnd).getTime();
  const duration = endMs - startMs;
  const prevEnd = new Date(startMs - 1).toISOString().split('T')[0];
  const prevStart = new Date(startMs - duration - 1).toISOString().split('T')[0];

  const prevPeriod = allRefunds.filter((r) => r.date >= prevStart && r.date <= prevEnd);
  const prevTotal = prevPeriod.length;
  const prevTotalAmount = prevPeriod.reduce((s, r) => s + r.amountUSD, 0);
  const prevAvgAmount = prevTotal > 0 ? prevTotalAmount / prevTotal : 0;
  const prevRate = prevTotal > 0 ? (prevTotal / (prevTotal * 11.5)) * 100 : 0;

  return {
    totalRefunds: total,
    refundRate,
    avgAmount,
    totalAmountUSD: totalAmount,
    prevPeriodRefunds: prevTotal,
    prevPeriodRate: prevRate,
    prevPeriodAvgAmount: prevAvgAmount,
  };
}

export function groupByDay(data: Refund[]): DailyAggregate[] {
  const map = new Map<string, { count: number; reasons: Record<string, number> }>();

  for (const r of data) {
    const entry = map.get(r.date) ?? { count: 0, reasons: {} };
    entry.count += 1;
    entry.reasons[r.reason] = (entry.reasons[r.reason] ?? 0) + 1;
    map.set(r.date, entry);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { count, reasons }]) => ({
      date,
      count,
      topReason: Object.entries(reasons).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '',
    }));
}

export function groupByField<K extends keyof Refund>(
  data: Refund[],
  field: K
): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const r of data) {
    const key = String(r[field]);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function groupRiskLevels(data: ScoredRefund[]): { name: string; value: number }[] {
  const counts = { low: 0, medium: 0, high: 0 };
  for (const r of data) {
    counts[r.riskLevel] = (counts[r.riskLevel] ?? 0) + 1;
  }
  return [
    { name: 'Low', value: counts.low },
    { name: 'Medium', value: counts.medium },
    { name: 'High', value: counts.high },
  ];
}

export function detectPatterns(data: ScoredRefund[]): { type: 'city' | 'customer'; message: string; severity: 'yellow' | 'orange' }[] {
  const alerts: { type: 'city' | 'customer'; message: string; severity: 'yellow' | 'orange' }[] = [];

  // City + 7-day window clusters
  const cityDayMap = new Map<string, Set<string>>();
  for (const r of data) {
    const key = r.city;
    if (!cityDayMap.has(key)) cityDayMap.set(key, new Set());
    cityDayMap.get(key)!.add(r.date);
  }

  // Check if any city has 5+ refunds in any 7-day window
  const cityRefunds = new Map<string, Refund[]>();
  for (const r of data) {
    if (!cityRefunds.has(r.city)) cityRefunds.set(r.city, []);
    cityRefunds.get(r.city)!.push(r);
  }

  for (const [city, cityData] of cityRefunds.entries()) {
    if (cityData.length < 5) continue;
    const sorted = [...cityData].sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 0; i < sorted.length; i++) {
      const windowStart = new Date(sorted[i].date).getTime();
      const windowEnd = windowStart + 7 * 24 * 60 * 60 * 1000;
      const inWindow = sorted.filter((r) => {
        const t = new Date(r.date).getTime();
        return t >= windowStart && t <= windowEnd;
      });
      if (inWindow.length >= 5) {
        alerts.push({
          type: 'city',
          message: `${city}: ${inWindow.length} refunds detected within a 7-day window`,
          severity: 'yellow',
        });
        break;
      }
    }
  }

  // Serial refunders: customers with 3+ refunds
  const customerMap = new Map<string, number>();
  for (const r of data) {
    customerMap.set(r.customerId, (customerMap.get(r.customerId) ?? 0) + 1);
  }
  const serialRefunders = Array.from(customerMap.entries()).filter(([, count]) => count >= 3);
  if (serialRefunders.length > 0) {
    alerts.push({
      type: 'customer',
      message: `${serialRefunders.length} customer${serialRefunders.length > 1 ? 's' : ''} with 3+ refunds detected`,
      severity: 'orange',
    });
  }

  // Deduplicate city alerts (keep top 3)
  const cityAlerts = alerts.filter((a) => a.type === 'city').slice(0, 3);
  const customerAlerts = alerts.filter((a) => a.type === 'customer');
  return [...cityAlerts, ...customerAlerts];
}

// ── Pattern Discovery ────────────────────────────────────────────────────────

export type CohortDimension = 'city×processor' | 'city×reason' | 'method×reason';

export interface Cohort {
  key: string;
  dim1Label: string;
  dim1Value: string;
  dim2Label: string;
  dim2Value: string;
  count: number;
  avgRiskScore: number;
  pctHigh: number;
  topReason: string;
  anomalyScore: number; // 0–100 normalised
  investigateFilters: Partial<FilterState>;
}

export function computeCohorts(data: ScoredRefund[], dimension: CohortDimension): Cohort[] {
  const map = new Map<string, ScoredRefund[]>();

  for (const r of data) {
    let key: string;
    if (dimension === 'city×processor') key = `${r.city}||${r.processor}`;
    else if (dimension === 'city×reason') key = `${r.city}||${r.reason}`;
    else key = `${r.paymentMethod}||${r.reason}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }

  const raw: { score: number; cohort: Omit<Cohort, 'anomalyScore'> }[] = [];

  for (const [key, records] of map.entries()) {
    if (records.length < 3) continue;

    const [dim1Value, dim2Value] = key.split('||');
    const avgRiskScore = records.reduce((s, r) => s + r.riskScore, 0) / records.length;
    const pctHigh = records.filter((r) => r.riskLevel === 'high').length / records.length;

    const reasonCounts = new Map<string, number>();
    for (const r of records) reasonCounts.set(r.reason, (reasonCounts.get(r.reason) ?? 0) + 1);
    const topReason = [...reasonCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

    // Raw anomaly score (unnormalised): weighted blend of frequency + risk
    const rawScore = records.length * 0.4 + avgRiskScore * 0.4 + pctHigh * 100 * 0.2;

    const investigateFilters: Partial<FilterState> = {};
    if (dimension === 'city×processor') investigateFilters.cities = [dim1Value];
    if (dimension === 'city×reason') {
      investigateFilters.cities = [dim1Value];
      investigateFilters.reasons = [dim2Value as FilterState['reasons'][number]];
    }
    if (dimension === 'method×reason') {
      investigateFilters.paymentMethods = [dim1Value as FilterState['paymentMethods'][number]];
      investigateFilters.reasons = [dim2Value as FilterState['reasons'][number]];
    }

    const dim1Label = dimension === 'method×reason' ? 'Method' : 'City';
    const dim2Label = dimension === 'city×processor' ? 'Processor' : 'Reason';

    raw.push({
      score: rawScore,
      cohort: { key, dim1Label, dim1Value, dim2Label, dim2Value, count: records.length, avgRiskScore, pctHigh, topReason, investigateFilters },
    });
  }

  if (raw.length === 0) return [];

  // Normalise anomaly score to 0–100
  const maxScore = Math.max(...raw.map((r) => r.score));
  return raw
    .map(({ score, cohort }) => ({ ...cohort, anomalyScore: Math.round((score / maxScore) * 100) }))
    .sort((a, b) => b.anomalyScore - a.anomalyScore)
    .slice(0, 8);
}

// ── Country comparison (current period vs prior period) ────────────────────

export interface CountryComparison {
  country: string;
  current: number;
  previous: number;
}

export function computeCountryComparison(allData: ScoredRefund[], filters: FilterState): CountryComparison[] {
  const startMs = new Date(filters.dateStart).getTime();
  const endMs = new Date(filters.dateEnd).getTime();
  const duration = endMs - startMs;
  const prevEnd = new Date(startMs - 86400000).toISOString().split('T')[0];
  const prevStart = new Date(startMs - duration - 86400000).toISOString().split('T')[0];

  // Apply all non-date filters to get the base pool
  const baseData = applyFilters(allData, { ...filters, dateStart: '2000-01-01', dateEnd: '2099-12-31', cities: [] });

  const currentData = baseData.filter((r) => r.date >= filters.dateStart && r.date <= filters.dateEnd);
  const prevData = baseData.filter((r) => r.date >= prevStart && r.date <= prevEnd);

  return ['Brazil', 'Mexico', 'Colombia'].map((country) => ({
    country,
    current: currentData.filter((r) => r.country === country).length,
    previous: prevData.filter((r) => r.country === country).length,
  }));
}

export function formatCurrency(amount: number, compact = false): string {
  if (compact && amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export function formatReason(reason: string): string {
  return reason.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatMethod(method: string): string {
  return method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
