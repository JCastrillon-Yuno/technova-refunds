import { useState } from 'react';
import type { FilterState, RefundReason, PaymentMethod, SavedView } from '../types';
import { DATA_START, DATA_END } from '../data/mockData';
import { formatReason, formatMethod } from '../utils/dataHelpers';

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  savedViews: SavedView[];
  onSaveView: (label: string) => void;
  onDeleteView: (id: string) => void;
  onLoadView: (v: SavedView) => void;
}

const COUNTRIES = ['Brazil', 'Mexico', 'Colombia'];
const REASONS: RefundReason[] = ['customer_request', 'defective_product', 'delivery_failure', 'duplicate_charge', 'fraud_prevention'];
const METHODS: PaymentMethod[] = ['visa_credit', 'mastercard_credit', 'visa_debit', 'mastercard_debit', 'pix', 'oxxo'];

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

function Section({
  label,
  defaultOpen = false,
  badge,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  badge?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-t border-neutral-800 first:border-t-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-2.5 text-left group"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-neutral-500 group-hover:text-neutral-300 transition-colors font-medium">
            {label}
          </span>
          {badge !== undefined && badge > 0 && (
            <span className="text-xs bg-red-600 text-white rounded-full px-1.5 py-0 leading-4 font-semibold">
              {badge}
            </span>
          )}
        </div>
        <span className={`text-neutral-600 text-xs transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {open && <div className="pb-3">{children}</div>}
    </section>
  );
}

export default function FilterPanel({ filters, onChange, savedViews, onSaveView, onDeleteView, onLoadView }: Props) {
  const [bookmarkLabel, setBookmarkLabel] = useState('');
  const [showBookmarkInput, setShowBookmarkInput] = useState(false);
  const set = (partial: Partial<FilterState>) => onChange({ ...filters, ...partial });

  const activeCountries = filters.countries.length;
  const activeReasons = filters.reasons.length;
  const activeMethods = filters.paymentMethods.length;
  const amountActive = filters.amountMin > 0 || filters.amountMax < 1500 ? 1 : 0;

  return (
    <aside className="bg-neutral-900 border border-neutral-800 rounded-xl text-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <h2 className="text-xs uppercase tracking-widest text-neutral-400 font-semibold">Filters</h2>
        <button
          onClick={() =>
            onChange({
              dateStart: DATA_START,
              dateEnd: DATA_END,
              countries: [],
              cities: [],
              reasons: [],
              paymentMethods: [],
              amountMin: 0,
              amountMax: 1500,
              riskLevel: 'all',
            })
          }
          className="text-xs text-neutral-500 hover:text-red-400 transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="px-4 flex flex-col">

        {/* Active city chip — always visible when set */}
        {filters.cities && filters.cities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 py-2.5 border-b border-neutral-800">
            {filters.cities.map((city) => (
              <span
                key={city}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-950 border border-red-800 text-xs text-red-300"
              >
                📍 {city}
                <button
                  onClick={() => set({ cities: filters.cities?.filter((c) => c !== city) })}
                  className="ml-0.5 text-red-500 hover:text-red-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Saved views */}
        <Section label="Saved views" defaultOpen badge={savedViews.length}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-600">
              {savedViews.length === 0 ? 'No saved views yet' : `${savedViews.length} saved`}
            </span>
            <button
              onClick={() => setShowBookmarkInput((v) => !v)}
              className="text-xs text-neutral-500 hover:text-neutral-200 transition-colors"
            >
              {showBookmarkInput ? 'Cancel' : '＋ Bookmark'}
            </button>
          </div>

          {showBookmarkInput && (
            <div className="flex gap-1.5 mb-2">
              <input
                autoFocus
                type="text"
                placeholder="View name…"
                value={bookmarkLabel}
                onChange={(e) => setBookmarkLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && bookmarkLabel.trim()) {
                    onSaveView(bookmarkLabel.trim());
                    setBookmarkLabel('');
                    setShowBookmarkInput(false);
                  }
                }}
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-neutral-500"
              />
              <button
                onClick={() => {
                  if (bookmarkLabel.trim()) {
                    onSaveView(bookmarkLabel.trim());
                    setBookmarkLabel('');
                    setShowBookmarkInput(false);
                  }
                }}
                className="px-2 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            {savedViews.map((v) => (
              <div key={v.id} className="flex items-center gap-1.5 group">
                <button
                  onClick={() => onLoadView(v)}
                  className="flex-1 text-left px-2 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 hover:text-white transition-colors truncate"
                  title={v.label}
                >
                  🔖 {v.label}
                </button>
                <button
                  onClick={() => onDeleteView(v.id)}
                  className="opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-red-400 text-sm transition-all"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* Date range — open by default */}
        <Section label="Date range" defaultOpen>
          <div className="flex flex-col gap-2">
            <div>
              <label className="text-xs text-neutral-500 block mb-1">From</label>
              <input
                type="date"
                value={filters.dateStart}
                min={DATA_START}
                max={filters.dateEnd}
                onChange={(e) => set({ dateStart: e.target.value })}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-neutral-500"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 block mb-1">To</label>
              <input
                type="date"
                value={filters.dateEnd}
                min={filters.dateStart}
                max={DATA_END}
                onChange={(e) => set({ dateEnd: e.target.value })}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-neutral-500"
              />
            </div>
          </div>
        </Section>

        {/* Risk level — open by default */}
        <Section label="Risk level" defaultOpen>
          <div className="flex flex-col gap-1.5">
            {(['all', 'low', 'medium', 'high'] as const).map((lvl) => (
              <label key={lvl} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="riskLevel"
                  value={lvl}
                  checked={filters.riskLevel === lvl}
                  onChange={() => set({ riskLevel: lvl })}
                  className="accent-red-500 w-3.5 h-3.5"
                />
                <span className="text-neutral-300 group-hover:text-white capitalize transition-colors">{lvl}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Country — open by default */}
        <Section label="Country" defaultOpen badge={activeCountries}>
          <div className="flex flex-col gap-1.5">
            {COUNTRIES.map((c) => (
              <label key={c} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.countries.includes(c)}
                  onChange={() => set({ countries: toggle(filters.countries, c) })}
                  className="accent-red-500 w-3.5 h-3.5"
                />
                <span className="text-neutral-300 group-hover:text-white transition-colors">{c}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Reason — collapsed by default */}
        <Section label="Refund reason" badge={activeReasons}>
          <div className="flex flex-col gap-1.5">
            {REASONS.map((r) => (
              <label key={r} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.reasons.includes(r)}
                  onChange={() => set({ reasons: toggle(filters.reasons, r) })}
                  className="accent-red-500 w-3.5 h-3.5"
                />
                <span className="text-neutral-300 group-hover:text-white transition-colors">{formatReason(r)}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Payment method — collapsed by default */}
        <Section label="Payment method" badge={activeMethods}>
          <div className="flex flex-col gap-1.5">
            {METHODS.map((m) => (
              <label key={m} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.paymentMethods.includes(m)}
                  onChange={() => set({ paymentMethods: toggle(filters.paymentMethods, m) })}
                  className="accent-red-500 w-3.5 h-3.5"
                />
                <span className="text-neutral-300 group-hover:text-white transition-colors">{formatMethod(m)}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Amount — collapsed by default */}
        <Section label="Amount (USD)" badge={amountActive}>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={filters.amountMax}
              value={filters.amountMin}
              onChange={(e) => set({ amountMin: Number(e.target.value) })}
              className="w-20 bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-neutral-500"
            />
            <span className="text-neutral-600">–</span>
            <input
              type="number"
              min={filters.amountMin}
              max={1500}
              value={filters.amountMax}
              onChange={(e) => set({ amountMax: Number(e.target.value) })}
              className="w-20 bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-neutral-500"
            />
          </div>
          <input
            type="range"
            min={0}
            max={1500}
            value={filters.amountMax}
            onChange={(e) => set({ amountMax: Number(e.target.value) })}
            className="w-full mt-2 accent-red-500"
          />
        </Section>

      </div>
    </aside>
  );
}
