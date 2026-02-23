import type { Metrics } from '../types';
import { formatCurrency } from '../utils/dataHelpers';

interface Props {
  metrics: Metrics;
}

function TrendArrow({ current, prev }: { current: number; prev: number }) {
  if (prev === 0) return null;
  const pct = ((current - prev) / prev) * 100;
  const up = pct > 0;
  const color = up ? 'text-red-400' : 'text-emerald-400';
  const arrow = up ? '▲' : '▼';
  return (
    <span className={`text-xs font-semibold ${color} ml-1`}>
      {arrow} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function KpiCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: React.ReactNode;
}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-1">
      <p className="text-xs text-neutral-500 uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-1">
        <p className="text-2xl font-bold text-white">{value}</p>
        {trend}
      </div>
      {sub && <p className="text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}

export default function MetricsBar({ metrics }: Props) {
  const { totalRefunds, refundRate, avgAmount, prevPeriodRefunds, prevPeriodAvgAmount } = metrics;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard
        label="Total Refunds"
        value={String(totalRefunds)}
        sub={`prev period: ${prevPeriodRefunds}`}
        trend={<TrendArrow current={totalRefunds} prev={prevPeriodRefunds} />}
      />
      <KpiCard
        label="Refund Rate"
        value={`${(refundRate).toFixed(1)}%`}
        sub="of total transactions"
        trend={<TrendArrow current={refundRate} prev={metrics.prevPeriodRate} />}
      />
      <KpiCard
        label="Avg Refund Amount"
        value={formatCurrency(avgAmount)}
        sub="per refund"
        trend={<TrendArrow current={avgAmount} prev={prevPeriodAvgAmount} />}
      />
      <KpiCard
        label="Total Refund Volume"
        value={formatCurrency(metrics.totalAmountUSD, true)}
        sub="USD equivalent"
      />
    </div>
  );
}
