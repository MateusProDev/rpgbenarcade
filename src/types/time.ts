/** Time system types — all timers use server timestamps */

export interface TimerInfo {
  startedAt: number;
  finishAt: number;
  /** Duration in seconds */
  durationSeconds: number;
}

/** Computes remaining seconds from a timer */
export function getRemainingSeconds(timer: TimerInfo, now: number = Date.now()): number {
  return Math.max(0, Math.ceil((timer.finishAt - now) / 1000));
}

/** Checks if a timer has completed */
export function isTimerComplete(timer: TimerInfo, now: number = Date.now()): boolean {
  return now >= timer.finishAt;
}
