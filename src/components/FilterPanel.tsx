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

export default function FilterPanel({ filters, onChange, savedViews, onSaveView, onDeleteView, onLoadView }: Props) {
  const [bookmarkLabel, setBookmarkLabel] = useState('');
  const [showBookmarkInput, setShowBookmarkInput] = useState(false);
  const set = (partial: Partial<FilterState>) => onChange({ ...filters, ...partial });

  return (
    <aside className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-5 text-sm">
      <div className="flex items-center justify-between">
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

      {/* Active city filter chip */}
      {filters.cities && filters.cities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.cities.map((city) => (
            <span
              key={city}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-950 border border-red-800 text-xs text-red-300"
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

      {/* Saved investigation views */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">Saved views</p>
          <button
            onClick={() => setShowBookmarkInput((v) => !v)}
            className="text-xs text-neutral-500 hover:text-neutral-200 transition-colors"
            title="Bookmark current filters"
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

        {savedViews.length === 0 ? (
          <p className="text-xs text-neutral-600 italic">No saved views yet</p>
        ) : (
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
        )}
      </section>

      {/* Date range */}
      <section>
        <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wide">Date range</p>
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
      </section>

      {/* Countries */}
      <section>
        <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wide">Country</p>
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
      </section>

      {/* Reasons */}
      <section>
        <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wide">Refund reason</p>
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
      </section>

      {/* Payment methods */}
      <section>
        <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wide">Payment method</p>
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
      </section>

      {/* Amount range */}
      <section>
        <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wide">Amount (USD)</p>
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
      </section>

      {/* Risk level */}
      <section>
        <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wide">Risk level</p>
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
      </section>
    </aside>
  );
}
