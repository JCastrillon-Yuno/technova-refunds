import { useState } from 'react';
import type { ScoredRefund } from '../types';
import { formatCurrency, formatReason, formatMethod } from '../utils/dataHelpers';

interface Props {
  refund: ScoredRefund;
  allData: ScoredRefund[];
  onClose: () => void;
}

const RISK_ICON: Record<string, string> = {
  '3+ refunds in 30 days': '🔄',
  '5+ lifetime refunds': '📊',
  'High-value refund': '💰',
  'New account, high value': '🆕',
  'Fraud prevention flag': '🚨',
  'Duplicate charge pattern': '⚠️',
  'Geographic/processor cluster': '📍',
  'Full-amount refund': '💸',
};

const RISK_COLOR = {
  low: 'text-emerald-400 border-emerald-800 bg-emerald-950',
  medium: 'text-yellow-400 border-yellow-800 bg-yellow-950',
  high: 'text-red-400 border-red-800 bg-red-950',
};

export default function RefundDetailModal({ refund, allData, onClose }: Props) {
  const [reviewed, setReviewed] = useState(false);

  const customerHistory = allData.filter((r) => r.customerId === refund.customerId && r.id !== refund.id);

  function Field({ label, value }: { label: string; value: string }) {
    return (
      <div>
        <p className="text-xs text-neutral-500 mb-0.5">{label}</p>
        <p className="text-sm text-neutral-200">{value}</p>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-white">Refund Details</h2>
            <span className="text-xs font-mono text-neutral-500">{refund.id}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${RISK_COLOR[refund.riskLevel]}`}>
              {refund.riskLevel} risk · {refund.riskScore}
            </span>
            <button onClick={onClose} className="text-neutral-500 hover:text-white text-2xl leading-none">×</button>
          </div>
        </div>

        <div className="px-6 py-5 flex flex-col gap-6">
          {/* Core fields */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Date" value={refund.date} />
            <Field label="Order ID" value={refund.orderId} />
            <Field label="Customer ID" value={refund.customerId} />
            <Field label="Country" value={refund.country} />
            <Field label="City" value={refund.city} />
            <Field label="Account age" value={`${refund.accountAgeDays} days`} />
            <Field label="Reason" value={formatReason(refund.reason)} />
            <Field label="Payment method" value={formatMethod(refund.paymentMethod)} />
            <Field label="Processor" value={refund.processor} />
            <Field label="Refund amount" value={`${formatCurrency(refund.amountUSD)} (${refund.amountLocal.toLocaleString()} ${refund.currency})`} />
            <Field label="Order amount" value={formatCurrency(refund.orderAmountUSD)} />
            <Field label="Refund ratio" value={`${((refund.amountUSD / refund.orderAmountUSD) * 100).toFixed(0)}%`} />
          </div>

          {/* Risk factors */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-300 mb-3">
              Why flagged
              {refund.riskReasons.length === 0 && (
                <span className="ml-2 text-emerald-400 text-xs font-normal">No risk factors detected</span>
              )}
            </h3>
            {refund.riskReasons.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {refund.riskReasons.map((reason) => (
                  <li key={reason} className="flex items-center gap-2 text-sm text-neutral-300">
                    <span className="text-base">{RISK_ICON[reason] ?? '⚡'}</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">This refund passed all risk checks.</p>
            )}
          </div>

          {/* Customer history */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-300 mb-3">
              Customer history
              <span className="ml-2 text-xs font-normal text-neutral-500">
                {customerHistory.length + 1} total refund{customerHistory.length !== 0 ? 's' : ''} from {refund.customerId}
              </span>
            </h3>
            {customerHistory.length === 0 ? (
              <p className="text-sm text-neutral-500">No other refunds from this customer in dataset.</p>
            ) : (
              <div className="rounded-lg border border-neutral-800 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-900/50">
                      <th className="px-3 py-2 text-left text-neutral-500 font-medium">Date</th>
                      <th className="px-3 py-2 text-left text-neutral-500 font-medium">Reason</th>
                      <th className="px-3 py-2 text-left text-neutral-500 font-medium">Amount</th>
                      <th className="px-3 py-2 text-left text-neutral-500 font-medium">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerHistory.slice(0, 10).map((r) => (
                      <tr key={r.id} className="border-b border-neutral-800/50">
                        <td className="px-3 py-2 text-neutral-400">{r.date}</td>
                        <td className="px-3 py-2 text-neutral-400">{formatReason(r.reason)}</td>
                        <td className="px-3 py-2 text-neutral-300">{formatCurrency(r.amountUSD)}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium capitalize ${RISK_COLOR[r.riskLevel]}`}>
                            {r.riskLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {customerHistory.length > 10 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-neutral-500 text-center">
                          +{customerHistory.length - 10} more
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-neutral-800">
            {reviewed ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <span>✓</span>
                <span>Marked as reviewed</span>
              </div>
            ) : (
              <button
                onClick={() => setReviewed(true)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm rounded-lg transition-colors"
              >
                Mark as reviewed
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 text-sm rounded-lg transition-colors ml-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
