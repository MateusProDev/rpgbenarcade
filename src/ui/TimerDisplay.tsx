/**
 * TimerDisplay — shows a countdown timer with progress bar.
 */

import { useTimer } from '../hooks/useTimer';
import type { TimerInfo } from '../types/time';

interface TimerDisplayProps {
  timer: TimerInfo | null;
  label?: string;
}

export function TimerDisplay({ timer, label }: TimerDisplayProps) {
  const { formatted, progress, isComplete } = useTimer(timer);

  if (isComplete) {
    return <span className="text-green-400 font-medieval text-sm">{label ?? 'Pronto!'}</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-parchment-200 text-xs">{label}</span>}
      <div className="w-full bg-castle-dark rounded-full h-2">
        <div
          className="bg-castle-gold h-2 rounded-full transition-all duration-1000"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className="text-parchment-300 font-medieval text-xs">{formatted}</span>
    </div>
  );
}
