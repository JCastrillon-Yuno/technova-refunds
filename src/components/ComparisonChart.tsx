import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { CountryComparison } from '../utils/dataHelpers';

interface Props {
  data: CountryComparison[];
  currentLabel: string;
  previousLabel: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const [current, previous] = payload;
  const pctChange = previous?.value > 0 ? ((current.value - previous.value) / previous.value) * 100 : null;

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-neutral-400 mb-2">{label}</p>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-neutral-400">{current?.name}:</span>
          <span className="text-white font-semibold">{current?.value}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neutral-500" />
          <span className="text-neutral-400">{previous?.name}:</span>
          <span className="text-white font-semibold">{previous?.value}</span>
        </div>
        {pctChange !== null && (
          <p className={`mt-1 font-semibold ${pctChange > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {pctChange > 0 ? '▲' : '▼'} {Math.abs(pctChange).toFixed(0)}% vs prior period
          </p>
        )}
      </div>
    </div>
  );
}

export default function ComparisonChart({ data, currentLabel, previousLabel }: Props) {
  const hasData = data.some((d) => d.current > 0 || d.previous > 0);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-200">Period Comparison by Country</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Current period vs equivalent prior period</p>
        </div>
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-neutral-500 text-sm">No comparison data available for this window</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis dataKey="country" tick={{ fill: '#a3a3a3', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#737373', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => <span className="text-xs text-neutral-400">{value}</span>}
              iconSize={8}
              iconType="circle"
            />
            <Bar dataKey="current" name={currentLabel} fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={60} />
            <Bar dataKey="previous" name={previousLabel} fill="#525252" radius={[4, 4, 0, 0]} maxBarSize={60} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
