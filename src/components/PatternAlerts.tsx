import { useState } from 'react';

interface Alert {
  type: 'city' | 'customer';
  message: string;
  severity: 'yellow' | 'orange';
}

interface Props {
  alerts: Alert[];
}

export default function PatternAlerts({ alerts }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = alerts.filter((a) => !dismissed.has(a.message));
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {visible.map((alert) => {
        const isYellow = alert.severity === 'yellow';
        const bg = isYellow ? 'bg-yellow-950 border-yellow-700' : 'bg-orange-950 border-orange-700';
        const text = isYellow ? 'text-yellow-300' : 'text-orange-300';
        const icon = alert.type === 'city' ? '📍' : '👤';

        return (
          <div
            key={alert.message}
            className={`flex items-start justify-between rounded-lg border px-4 py-2.5 ${bg}`}
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-sm">{icon}</span>
              <div>
                <span className={`text-xs font-semibold uppercase tracking-wide ${text}`}>
                  {alert.type === 'city' ? 'Geographic Cluster' : 'Serial Refunder'}
                </span>
                <p className="text-sm text-neutral-200 mt-0.5">{alert.message}</p>
              </div>
            </div>
            <button
              onClick={() => setDismissed((prev) => new Set([...prev, alert.message]))}
              className="ml-4 text-neutral-500 hover:text-neutral-200 text-lg leading-none"
              aria-label="Dismiss alert"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
