import React from 'react';

export interface InfoGridItem {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  bold?: boolean;
  highlight?: boolean;
  danger?: boolean;
  success?: boolean;
  colSpan?: 1 | 2 | 3 | 4;
}

export interface InfoGridProps {
  items: InfoGridItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export const InfoGrid: React.FC<InfoGridProps> = ({
  items,
  columns = 4,
  className = '',
}) => {
  const colClass =
    columns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : columns === 3
      ? 'grid-cols-1 sm:grid-cols-3'
      : 'grid-cols-2 sm:grid-cols-4';

  return (
    <div className={`grid ${colClass} gap-3 bg-slate-50 p-3.5 rounded-sm border border-slate-200 ${className}`}>
      {items.map((it, idx) => {
        const spanClass = it.colSpan ? `sm:col-span-${it.colSpan}` : '';
        const textColor = it.danger
          ? 'text-rose-600 font-bold'
          : it.success
          ? 'text-emerald-700 font-bold'
          : it.highlight
          ? 'text-blue-700 font-bold'
          : it.bold
          ? 'text-slate-900 font-bold'
          : 'text-slate-800 font-medium';

        return (
          <div key={idx} className={spanClass}>
            <span className="text-slate-400 block text-[11px] font-medium">{it.label}:</span>
            <div
              className={`text-xs mt-0.5 truncate ${it.mono ? 'font-mono' : ''} ${textColor}`}
              title={typeof it.value === 'string' ? it.value : undefined}
            >
              {it.value ?? '—'}
            </div>
          </div>
        );
      })}
    </div>
  );
};
