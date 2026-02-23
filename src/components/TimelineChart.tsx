import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { DailyAggregate } from '../types';
import { formatReason } from '../utils/dataHelpers';

interface Props {
  data: DailyAggregate[];
  spikeDate: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const item = payload[0] as { value: number; payload: DailyAggregate };
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-neutral-400 mb-1">{label}</p>
      <p className="text-white font-semibold">{item.value} refunds</p>
      {item.payload?.topReason && (
        <p className="text-neutral-400 mt-1">Top: {formatReason(item.payload.topReason)}</p>
      )}
    </div>
  );
}

export default function TimelineChart({ data, spikeDate }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-center h-48">
        <p className="text-neutral-500 text-sm">No data for selected filters</p>
      </div>
    );
  }

  // Format date labels to be shorter
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  // Show spike reference line only if spikeDate is in range
  const showSpike = data.some((d) => d.date === spikeDate);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-200">Daily Refund Volume</h3>
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          {showSpike && (
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 border-t-2 border-dashed border-red-500" />
              Spike begins
            </span>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="refundGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#737373', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={Math.floor(data.length / 8)}
          />
          <YAxis tick={{ fill: '#737373', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          {showSpike && (
            <ReferenceLine
              x={formatted.find((d) => d.date === spikeDate)?.label}
              stroke="#ef4444"
              strokeDasharray="4 2"
              label={{ value: 'Spike begins', position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }}
            />
          )}
          <Area
            type="monotone"
            dataKey="count"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#refundGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#ef4444', stroke: '#1a1a1a', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
