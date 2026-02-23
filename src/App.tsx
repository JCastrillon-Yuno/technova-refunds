import { useState, useMemo, useCallback } from 'react';
import type { FilterState, SortConfig, ScoredRefund, SavedView } from './types';
import { allRefunds, DATA_START, DATA_END } from './data/mockData';
import { scoreAll } from './utils/riskScoring';
import { applyFilters, computeMetrics, groupByDay, detectPatterns, computeCountryComparison } from './utils/dataHelpers';
import MetricsBar from './components/MetricsBar';
import PatternAlerts from './components/PatternAlerts';
import FilterPanel from './components/FilterPanel';
import TimelineChart from './components/TimelineChart';
import BreakdownCharts from './components/BreakdownCharts';
import PatternDiscovery from './components/PatternDiscovery';
import ComparisonChart from './components/ComparisonChart';
import RefundTable from './components/RefundTable';
import RefundDetailModal from './components/RefundDetailModal';

const SAVED_VIEWS_KEY = 'technova_saved_views';

const defaultFilters: FilterState = {
  dateStart: DATA_START,
  dateEnd: DATA_END,
  countries: [],
  cities: [],
  reasons: [],
  paymentMethods: [],
  amountMin: 0,
  amountMax: 1500,
  riskLevel: 'all',
};

// Score all refunds once against the full dataset
const allScored = scoreAll(allRefunds);

// Spike begins on day 45 of the dataset (2024-10-01 + 44 days = 2024-11-14)
const SPIKE_DATE = '2024-11-14';

function loadSavedViews(): SavedView[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_VIEWS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export default function App() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [_sortConfig, _setSortConfig] = useState<SortConfig>({ key: 'date', dir: 'desc' });
  const [selectedRefund, setSelectedRefund] = useState<ScoredRefund | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [savedViews, setSavedViews] = useState<SavedView[]>(loadSavedViews);

  // Apply filters to the pre-scored data
  const filteredScored = useMemo<ScoredRefund[]>(() => {
    return applyFilters(allScored as ScoredRefund[], filters) as ScoredRefund[];
  }, [filters]);

  const metrics = useMemo(() => computeMetrics(filteredScored, allRefunds, filters), [filteredScored, filters]);
  const dailyData = useMemo(() => groupByDay(filteredScored), [filteredScored]);
  const alerts = useMemo(() => detectPatterns(filteredScored), [filteredScored]);
  const countryComparison = useMemo(() => computeCountryComparison(allScored, filters), [filters]);

  // Period labels for comparison chart
  const currentLabel = `${filters.dateStart} – ${filters.dateEnd}`;
  const startMs = new Date(filters.dateStart).getTime();
  const endMs = new Date(filters.dateEnd).getTime();
  const duration = endMs - startMs;
  const prevEndLabel = new Date(startMs - 86400000).toISOString().split('T')[0];
  const prevStartLabel = new Date(startMs - duration - 86400000).toISOString().split('T')[0];
  const previousLabel = `${prevStartLabel} – ${prevEndLabel}`;

  // Saved views handlers
  const handleSaveView = useCallback((label: string) => {
    const view: SavedView = {
      id: `view_${Date.now()}`,
      label,
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };
    setSavedViews((prev) => {
      const next = [...prev, view];
      localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(next));
      return next;
    });
  }, [filters]);

  const handleDeleteView = useCallback((id: string) => {
    setSavedViews((prev) => {
      const next = prev.filter((v) => v.id !== id);
      localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleLoadView = useCallback((v: SavedView) => {
    setFilters(v.filters);
  }, []);

  // PatternDiscovery: apply partial filter on top of current state
  const handleInvestigate = useCallback((partial: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  // PatternDiscovery: flag a cohort as a saved view
  const handleFlag = useCallback((label: string, partial: Partial<FilterState>) => {
    const view: SavedView = {
      id: `view_${Date.now()}`,
      label,
      filters: { ...filters, ...partial },
      createdAt: new Date().toISOString(),
    };
    setSavedViews((prev) => {
      const next = [...prev, view];
      localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(next));
      return next;
    });
  }, [filters]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors md:hidden"
            aria-label="Toggle filters"
          >
            ☰
          </button>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">TechNova</h1>
            <p className="text-xs text-neutral-500 leading-none">Refund Investigation Suite</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-neutral-500">
            {filteredScored.length} / {allRefunds.length} records
          </span>
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
          >
            <span>⚙</span>
            <span>{sidebarOpen ? 'Hide' : 'Show'} Filters</span>
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed md:sticky top-0 md:top-[53px] z-30 h-screen md:h-[calc(100vh-53px)]
            overflow-y-auto w-64 shrink-0
            transition-transform duration-200
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:-translate-x-full'}
            bg-neutral-950 border-r border-neutral-800 md:bg-transparent md:border-r-0
            pt-16 md:pt-4 pb-8 px-3
          `}
        >
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            savedViews={savedViews}
            onSaveView={handleSaveView}
            onDeleteView={handleDeleteView}
            onLoadView={handleLoadView}
          />
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 py-4 flex flex-col gap-4">
          <MetricsBar metrics={metrics} />
          <PatternAlerts alerts={alerts} />
          <TimelineChart data={dailyData} spikeDate={SPIKE_DATE} />
          <PatternDiscovery
            data={filteredScored}
            onInvestigate={handleInvestigate}
            onFlag={handleFlag}
          />
          <BreakdownCharts data={filteredScored} />
          <ComparisonChart
            data={countryComparison}
            currentLabel={currentLabel}
            previousLabel={previousLabel}
          />
          <RefundTable data={filteredScored} onSelect={setSelectedRefund} />
        </main>
      </div>

      {/* Detail modal */}
      {selectedRefund && (
        <RefundDetailModal
          refund={selectedRefund}
          allData={allScored}
          onClose={() => setSelectedRefund(null)}
        />
      )}
    </div>
  );
}
