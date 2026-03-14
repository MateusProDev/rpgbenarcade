/**
 * TimeSystem — timestamp-based timer management.
 * No real-time loops. All calculations derive from server timestamps.
 */

import type { TimerInfo } from '../../types/time';

export const TimeSystem = {
  /**
   * Creates a timer starting now.
   */
  createTimer(durationSeconds: number, now: number = Date.now()): TimerInfo {
    return {
      startedAt: now,
      finishAt: now + durationSeconds * 1000,
      durationSeconds,
    };
  },

  /**
   * Returns remaining seconds.
   */
  getRemainingSeconds(timer: TimerInfo, now: number = Date.now()): number {
    return Math.max(0, Math.ceil((timer.finishAt - now) / 1000));
  },

  /**
   * Whether the timer is complete.
   */
  isComplete(timer: TimerInfo, now: number = Date.now()): boolean {
    return now >= timer.finishAt;
  },

  /**
   * Returns progress as 0..1.
   */
  getProgress(timer: TimerInfo, now: number = Date.now()): number {
    if (timer.durationSeconds === 0) return 1;
    const elapsed = now - timer.startedAt;
    return Math.min(1, Math.max(0, elapsed / (timer.durationSeconds * 1000)));
  },

  /**
   * Formats remaining seconds as "Xh Ym Zs".
   */
  formatRemaining(seconds: number): string {
    if (seconds <= 0) return 'Pronto';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    return parts.join(' ');
  },

  /**
   * Calculates march time between two map coordinates (in seconds).
   */
  calculateMarchTime(
    fromX: number, fromY: number,
    toX: number, toY: number,
    tilesPerMinute: number,
  ): number {
    const distance = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
    return Math.ceil((distance / tilesPerMinute) * 60);
  },
};
