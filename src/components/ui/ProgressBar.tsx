import React from 'react';

interface ProgressBarProps {
  value:   number; // 0–100
  color?:  string;
  label?:  string;
  height?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color  = 'bg-castle-gold',
  label,
  height = 'h-3',
}) => (
  <div className="w-full">
    {label && (
      <div className="flex justify-between text-xs text-parchment-300 mb-1">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
    )}
    <div className={`w-full bg-castle-dark rounded-full overflow-hidden ${height}`}>
      <div
        className={`${height} ${color} rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  </div>
);
