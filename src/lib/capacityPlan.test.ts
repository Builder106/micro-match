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
      reviewMinutes: 144
    });
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
    ).toEqual({ missionCount: 0, missionsPerDay: 0, reviewMinutes: 0 });
  });
});

describe('formatReviewTime', () => {
  it('uses a readable hours and minutes label', () => {
    expect(formatReviewTime(144)).toBe('2 hr 24 min');
    expect(formatReviewTime(60)).toBe('1 hr');
    expect(formatReviewTime(15)).toBe('15 min');
  });
});
