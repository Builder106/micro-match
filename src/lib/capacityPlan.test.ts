import { describe, expect, it } from 'vitest';
import { createCapacityPlan, formatReviewTime } from './capacityPlan';

describe('createCapacityPlan', () => {
  it('splits backlog hours into whole, claimable missions', () => {
    expect(
      createCapacityPlan({
        backlogHours: 12,
        taskMinutes: 15,
        deliveryDays: 4
      })
    ).toEqual({
      missionCount: 48,
      missionsPerDay: 12,
      dailyMissionCounts: [12, 12, 12, 12],
      reviewMinutes: 144
    });
  });

  it('spreads a remainder across the first release days without inventing missions', () => {
    const plan = createCapacityPlan({
      backlogHours: 3,
      taskMinutes: 5,
      deliveryDays: 7
    });

    expect(plan.dailyMissionCounts).toEqual([6, 5, 5, 5, 5, 5, 5]);
    expect(plan.dailyMissionCounts.reduce((total, count) => total + count, 0)).toBe(plan.missionCount);
    expect(Math.max(...plan.dailyMissionCounts) - Math.min(...plan.dailyMissionCounts)).toBeLessThanOrEqual(1);
  });

  it('rounds a partial mission up so the whole backlog has a home', () => {
    expect(
      createCapacityPlan({
        backlogHours: 1,
        taskMinutes: 30,
        deliveryDays: 3
      })
    ).toMatchObject({ missionCount: 2, missionsPerDay: 1 });
  });

  it('keeps invalid amounts from producing negative plans', () => {
    expect(
      createCapacityPlan({
        backlogHours: -4,
        taskMinutes: 15,
        deliveryDays: 0
      })
    ).toEqual({ missionCount: 0, missionsPerDay: 0, dailyMissionCounts: [0], reviewMinutes: 0 });

    // Non-finite values
    expect(
      createCapacityPlan({
        backlogHours: Number.NaN,
        taskMinutes: 15,
        deliveryDays: Number.POSITIVE_INFINITY
      })
    ).toEqual({ missionCount: 0, missionsPerDay: 0, dailyMissionCounts: [0], reviewMinutes: 0 });
  });

  it('rounds finite delivery days to a usable whole-number schedule', () => {
    expect(
      createCapacityPlan({
        backlogHours: 1,
        taskMinutes: 15,
        deliveryDays: 2.6
      })
    ).toMatchObject({
      missionCount: 4,
      missionsPerDay: 2,
      dailyMissionCounts: [2, 1, 1]
    });
  });

});

describe('formatReviewTime', () => {
  it('uses a readable hours and minutes label', () => {
    expect(formatReviewTime(144)).toBe('2 hr 24 min');
    expect(formatReviewTime(60)).toBe('1 hr');
    expect(formatReviewTime(15)).toBe('15 min');
  });

  it('rounds fractional minutes and clamps negative review time to zero', () => {
    expect(formatReviewTime(59.6)).toBe('1 hr');
    expect(formatReviewTime(-0.6)).toBe('0 min');
  });
});
