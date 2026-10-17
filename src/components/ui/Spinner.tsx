import React from 'react';

export const Spinner: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <div className={`${className} border-2 border-neutral-700 border-t-emerald-500 rounded-full animate-spin`} />
);

export const FullScreenSpinner: React.FC = () => (
  <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
    <Spinner className="w-8 h-8" />
  </div>
);
