import React from 'react';

export const LoadingSpinner: React.FC = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mb-4"></div>
      <p className="text-white text-lg">Loading...</p>
    </div>
  </div>
);

export const EmptyState: React.FC<{ message: string; icon?: React.ReactNode }> = ({
  message,
  icon,
}) => (
  <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
    {icon && <div className="mb-4 text-5xl">{icon}</div>}
    <p className="text-gray-400 text-lg">{message}</p>
  </div>
);
