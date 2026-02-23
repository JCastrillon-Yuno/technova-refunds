import { useState } from 'react';
import type { ScoredRefund, SortConfig } from '../types';
import { formatCurrency, formatReason, formatMethod } from '../utils/dataHelpers';

interface Props {
  data: ScoredRefund[];
  onSelect: (r: ScoredRefund) => void;
}

const PAGE_SIZE = 50;

const RISK_BADGE: Record<string, string> = {
  low: 'bg-emerald-950 text-emerald-400 border-emerald-800',
  medium: 'bg-yellow-950 text-yellow-400 border-yellow-800',
  high: 'bg-red-950 text-red-400 border-red-800',
};

const COLUMNS: { key: keyof ScoredRefund; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'customerId', label: 'Customer' },
  { key: 'country', label: 'Country' },
  { key: 'city', label: 'City' },
  { key: 'reason', label: 'Reason' },
  { key: 'paymentMethod', label: 'Method' },
  { key: 'amountUSD', label: 'Amount' },
  { key: 'riskLevel', label: 'Risk' },
];

export default function RefundTable({ data, onSelect }: Props) {
  const [sort, setSort] = useState<SortConfig>({ key: 'date', dir: 'desc' });
  const [page, setPage] = useState(0);

  const sorted = [...data].sort((a, b) => {
    const av = a[sort.key] ?? '';
    const bv = b[sort.key] ?? '';
    if (av < bv) return sort.dir === 'asc' ? -1 : 1;
    if (av > bv) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSort(key: keyof ScoredRefund) {
    setPage(0);
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  }

  function SortIcon({ col }: { col: keyof ScoredRefund }) {
    if (sort.key !== col) return <span className="text-neutral-700 ml-1">↕</span>;
    return <span className="text-red-400 ml-1">{sort.dir === 'asc' ? '↑' : '↓'}</span>;
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <h3 className="text-sm font-semibold text-neutral-200">Refund Records</h3>
        <span className="text-xs text-neutral-500">{data.length} records</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-neutral-800">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-3 py-2.5 text-left text-neutral-500 uppercase tracking-wider font-medium cursor-pointer hover:text-neutral-300 transition-colors select-none whitespace-nowrap"
                >
                  {col.label}
                  <SortIcon col={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-neutral-500">
                  No records match current filters
                </td>
              </tr>
            ) : (
              pageData.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => onSelect(r)}
                  className="border-b border-neutral-800/50 hover:bg-neutral-800/50 cursor-pointer transition-colors"
                >
                  <td className="px-3 py-2.5 text-neutral-400">{r.date}</td>
                  <td className="px-3 py-2.5 text-neutral-300 font-mono">{r.customerId}</td>
                  <td className="px-3 py-2.5 text-neutral-300">{r.country}</td>
                  <td className="px-3 py-2.5 text-neutral-400">{r.city}</td>
                  <td className="px-3 py-2.5 text-neutral-400">{formatReason(r.reason)}</td>
                  <td className="px-3 py-2.5 text-neutral-400">{formatMethod(r.paymentMethod)}</td>
                  <td className="px-3 py-2.5 text-neutral-300 font-medium">{formatCurrency(r.amountUSD)}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${RISK_BADGE[r.riskLevel]}`}>
                      {r.riskLevel}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-800">
          <span className="text-xs text-neutral-500">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="px-2 py-1 text-xs rounded bg-neutral-800 text-neutral-400 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              «
            </button>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-1 text-xs rounded bg-neutral-800 text-neutral-400 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(0, Math.min(page - 2, totalPages - 5));
              const p = start + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-2 py-1 text-xs rounded ${p === page ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
                >
                  {p + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-2 py-1 text-xs rounded bg-neutral-800 text-neutral-400 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ›
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page === totalPages - 1}
              className="px-2 py-1 text-xs rounded bg-neutral-800 text-neutral-400 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
