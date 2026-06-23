/**
 * Weighted momentum scoring. Not all daily wins are equal — staying
 * sober and doing the hard thing matter far more than hitting a
 * hydration target. The score is the share of *weighted* points earned,
 * normalised to 0–100.
 */

export const MOMENTUM_WEIGHTS = {
  no_cannabis: 20,
  hardest_thing_done: 25,
  workout_completed: 15,
  business_growth_action_completed: 15,
  morning_cbt_completed: 10,
  evening_cbt_completed: 10,
  family_connection_completed: 5,
  hydration_goal_hit: 5,
} as const;

export type MomentumKey = keyof typeof MOMENTUM_WEIGHTS;

export const MOMENTUM_ITEMS: { key: MomentumKey; label: string }[] = [
  { key: "hardest_thing_done", label: "Hardest thing" },
  { key: "no_cannabis", label: "No cannabis" },
  { key: "workout_completed", label: "Workout" },
  { key: "business_growth_action_completed", label: "Business growth" },
  { key: "morning_cbt_completed", label: "Morning CBT" },
  { key: "evening_cbt_completed", label: "Evening CBT" },
  { key: "family_connection_completed", label: "Family connection" },
  { key: "hydration_goal_hit", label: "Hydration" },
];

const TOTAL_WEIGHT = Object.values(MOMENTUM_WEIGHTS).reduce((a, b) => a + b, 0);

/** Weighted 0–100 momentum score from a set of completed items. */
export function momentumScore(items: Partial<Record<MomentumKey, boolean>>): number {
  let earned = 0;
  for (const key of Object.keys(MOMENTUM_WEIGHTS) as MomentumKey[]) {
    if (items[key]) earned += MOMENTUM_WEIGHTS[key];
  }
  return Math.round((earned / TOTAL_WEIGHT) * 100);
}
