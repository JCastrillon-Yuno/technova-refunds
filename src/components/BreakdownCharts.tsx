import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ScoredRefund } from '../types';
import { groupByField, groupRiskLevels, formatReason, formatMethod } from '../utils/dataHelpers';

interface Props {
  data: ScoredRefund[];
}

const CHART_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];
const RISK_COLORS: Record<string, string> = { Low: '#22c55e', Medium: '#eab308', High: '#ef4444' };

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-neutral-200 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-40">
      <p className="text-neutral-500 text-xs">No data</p>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-neutral-400 mb-1">{label}</p>
      <p className="text-white font-semibold">{payload[0].value}</p>
    </div>
  );
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-neutral-300">{formatReason(payload[0].name)}</p>
      <p className="text-white font-semibold">{payload[0].value}</p>
    </div>
  );
}

export default function BreakdownCharts({ data }: Props) {
  const byCountry = groupByField(data, 'country');
  const byReason = groupByField(data, 'reason');
  const byMethod = groupByField(data, 'paymentMethod');
  const byRisk = groupRiskLevels(data);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Country */}
      <ChartCard title="Refunds by Country">
        {byCountry.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={byCountry} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#737373', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#a3a3a3', fontSize: 11 }} tickLine={false} axisLine={false} width={75} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {byCountry.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Reason Pie */}
      <ChartCard title="Refund Reasons">
        {byReason.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={byReason}
                cx="45%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {byReason.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-neutral-400">{formatReason(value)}</span>
                )}
                iconSize={8}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Payment method */}
      <ChartCard title="Payment Methods">
        {byMethod.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={byMethod.map((d) => ({ ...d, name: formatMethod(d.name) }))} margin={{ top: 0, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#737373', fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                angle={-25}
                textAnchor="end"
              />
              <YAxis tick={{ fill: '#737373', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {byMethod.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Risk distribution */}
      <ChartCard title="Risk Distribution">
        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={byRisk} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#a3a3a3', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#737373', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {byRisk.map((entry) => (
                  <Cell key={entry.name} fill={RISK_COLORS[entry.name] ?? '#737373'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
