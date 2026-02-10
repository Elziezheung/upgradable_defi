import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, unit, change }) => {
  return (
    <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg p-6 border border-slate-600">
      <p className="text-sm text-gray-400 mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl md:text-3xl font-bold text-white">
          {value}
          {unit && <span className="text-lg ml-1">{unit}</span>}
        </h3>
        {change && (
          <span className={`text-sm font-medium ${change.isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {change.isPositive ? '▲' : '▼'} {Math.abs(change.value).toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  );
};
