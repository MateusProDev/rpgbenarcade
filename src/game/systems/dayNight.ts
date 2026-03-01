// ========================
// Day/Night System
// ========================
import type { TimeOfDay } from "../../types";

/**
 * Get the current time of day based on real time
 * Full cycle = ~10 minutes
 */
export function getTimeOfDay(elapsed: number): TimeOfDay {
  const cycleLength = 600000; // 10 min
  const phase = (elapsed % cycleLength) / cycleLength;

  if (phase < 0.1) return "dawn";
  if (phase < 0.5) return "day";
  if (phase < 0.6) return "dusk";
  return "night";
}

export function getTimeOverlayAlpha(timeOfDay: TimeOfDay): number {
  switch (timeOfDay) {
    case "dawn": return 0.1;
    case "day": return 0;
    case "dusk": return 0.15;
    case "night": return 0.35;
  }
}

export function getAmbientColor(timeOfDay: TimeOfDay): number {
  switch (timeOfDay) {
    case "dawn": return 0x332211;
    case "day": return 0x000000;
    case "dusk": return 0x221100;
    case "night": return 0x000033;
  }
}
