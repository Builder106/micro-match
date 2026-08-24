export const taskDurations = [5, 15, 30] as const;

export type TaskDuration = (typeof taskDurations)[number];

export interface CapacityPlanInput {
  backlogHours: number;
  taskMinutes: TaskDuration;
  deliveryDays: number;
}

export interface CapacityPlan {
  missionCount: number;
  missionsPerDay: number;
  dailyMissionCounts: number[];
  reviewMinutes: number;
}

const REVIEW_MINUTES_PER_MISSION = 3;

export function createCapacityPlan({
  backlogHours,
  taskMinutes,
  deliveryDays
}: CapacityPlanInput): CapacityPlan {
  const safeBacklogHours = Math.max(0, Number.isFinite(backlogHours) ? backlogHours : 0);
  const safeDeliveryDays = Math.max(1, Math.round(Number.isFinite(deliveryDays) ? deliveryDays : 1));
  const missionCount = Math.ceil((safeBacklogHours * 60) / taskMinutes);
  const missionsPerDay = Math.floor(missionCount / safeDeliveryDays);
  const daysWithOneExtraMission = missionCount % safeDeliveryDays;
  const dailyMissionCounts = Array.from(
    { length: safeDeliveryDays },
    (_, index) => missionsPerDay + (index < daysWithOneExtraMission ? 1 : 0)
  );

  return {
    missionCount,
    missionsPerDay: dailyMissionCounts[0]!,
    dailyMissionCounts,
    reviewMinutes: missionCount * REVIEW_MINUTES_PER_MISSION
  };
}

export function formatReviewTime(minutes: number): string {
  const safeMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (hours === 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) return `${hours} hr`;
  return `${hours} hr ${remainingMinutes} min`;
}
