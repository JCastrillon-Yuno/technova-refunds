import { useState } from 'react';
import type { ScoredRefund, FilterState } from '../types';
import { computeCohorts, formatReason, formatMethod } from '../utils/dataHelpers';
import type { CohortDimension, Cohort } from '../utils/dataHelpers';

interface Props {
  data: ScoredRefund[];
  onInvestigate: (partial: Partial<FilterState>) => void;
  onFlag: (label: string, partial: Partial<FilterState>) => void;
}

const DIMENSIONS: { value: CohortDimension; label: string }[] = [
  { value: 'city×processor', label: 'City × Processor' },
  { value: 'city×reason', label: 'City × Reason' },
  { value: 'method×reason', label: 'Method × Reason' },
];

function AnomalyBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-red-500' : score >= 40 ? 'bg-yellow-500' : 'bg-emerald-500';
  return (
    <div className="w-full bg-neutral-800 rounded-full h-1.5">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

function CohortCard({ cohort, onInvestigate, onFlag }: { cohort: Cohort; onInvestigate: () => void; onFlag: () => void }) {
  const riskColor = cohort.anomalyScore >= 70 ? 'text-red-400 border-red-900 bg-red-950/40' : cohort.anomalyScore >= 40 ? 'text-yellow-400 border-yellow-900 bg-yellow-950/30' : 'text-emerald-400 border-emerald-900 bg-emerald-950/30';

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${riskColor}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white leading-tight">{cohort.dim1Value}</p>
          <p className="text-xs text-neutral-400 mt-0.5">
            {cohort.dim2Label}: {cohort.dim2Value.includes('_') ? (cohort.dim2Label === 'Reason' ? formatReason(cohort.dim2Value) : formatMethod(cohort.dim2Value)) : cohort.dim2Value}
          </p>
        </div>
        <span className="shrink-0 text-xs font-bold px-2 py-1 rounded-full bg-neutral-900/60 border border-current">
          {cohort.count} refunds
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>Anomaly score</span>
          <span className="font-semibold text-current">{cohort.anomalyScore}</span>
        </div>
        <AnomalyBar score={cohort.anomalyScore} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-neutral-900/60 rounded-lg p-2">
          <p className="text-neutral-500 mb-0.5">Avg risk score</p>
          <p className="font-semibold text-neutral-200">{cohort.avgRiskScore.toFixed(0)}</p>
        </div>
        <div className="bg-neutral-900/60 rounded-lg p-2">
          <p className="text-neutral-500 mb-0.5">High risk</p>
          <p className="font-semibold text-neutral-200">{(cohort.pctHigh * 100).toFixed(0)}%</p>
        </div>
      </div>

      {cohort.topReason && (
        <p className="text-xs text-neutral-500">
          Top reason: <span className="text-neutral-300">{formatReason(cohort.topReason)}</span>
        </p>
      )}

      <div className="flex items-center gap-2 pt-1 border-t border-current/20">
        <button
          onClick={onInvestigate}
          className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-neutral-200 transition-colors text-center"
        >
          Investigate →
        </button>
        <button
          onClick={onFlag}
          title="Save as investigation bookmark"
          className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-400 hover:text-orange-400 transition-colors"
        >
          🚩
        </button>
      </div>
    </div>
  );
}

export default function PatternDiscovery({ data, onInvestigate, onFlag }: Props) {
  const [dimension, setDimension] = useState<CohortDimension>('city×processor');
  const [collapsed, setCollapsed] = useState(false);

  const cohorts = computeCohorts(data, dimension);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-200">Pattern Discovery</span>
          <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">
            {cohorts.length} cohorts
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 hidden sm:block">
            Auto-ranked unusual cohorts
          </span>
          <span className="text-neutral-500 text-sm">{collapsed ? '▼' : '▲'}</span>
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 flex flex-col gap-4 border-t border-neutral-800">
          {/* Dimension selector */}
          <div className="flex items-center gap-2 pt-3 flex-wrap">
            <span className="text-xs text-neutral-500">Group by:</span>
            {DIMENSIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDimension(d.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  dimension === d.value
                    ? 'bg-red-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {cohorts.length === 0 ? (
            <p className="text-sm text-neutral-500 py-4 text-center">
              Not enough data to surface cohorts — try widening the date range
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {cohorts.map((cohort) => (
                <CohortCard
                  key={cohort.key}
                  cohort={cohort}
                  onInvestigate={() => onInvestigate(cohort.investigateFilters)}
                  onFlag={() => {
                    const label = `${cohort.dim1Value} × ${cohort.dim2Value} (${cohort.count} refunds)`;
                    onFlag(label, cohort.investigateFilters);
                  }}
                />
              ))}
            </div>
          )}

          <p className="text-xs text-neutral-600">
            Anomaly score = weighted blend of refund frequency, avg risk score, and % high-risk. Scores normalised to 0–100 within the current view.
          </p>
        </div>
      )}
    </div>
  );
}
