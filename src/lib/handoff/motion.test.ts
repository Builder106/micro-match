import { describe, expect, it } from 'vitest';
import {
  activeScene,
  along,
  assetTimelines,
  clamp,
  clockText,
  DEFAULT_MINUTES,
  dialStill,
  END_AT,
  LANES_LINGER,
  local,
  SCENES,
  seekSeconds,
  stageState,
  STEP_ORDER,
  taskMinutes,
  ticketPosition,
  vignetteFor
} from './motion';

describe('Handoff Table motion', () => {
  it('clamps and maps scene ranges', () => {
    expect(clamp(-1)).toBe(0);
    expect(clamp(2)).toBe(1);
    expect(local(0.1, SCENES.claim)).toBe(0);
    expect(local(0.225, SCENES.claim)).toBeCloseTo(0.5);
    expect(local(0.5, SCENES.claim)).toBe(1);
  });

  it('carries the ticket to the volunteer and back', () => {
    expect(along(0.05)).toBe(0);
    expect(along(0.2)).toBeGreaterThan(0);
    expect(along(0.2)).toBeLessThan(1);
    expect(along(0.4)).toBe(1);
    expect(along(0.6)).toBeGreaterThan(0);
    expect(along(0.6)).toBeLessThan(1);
    expect(along(0.8)).toBe(0);
  });

  it('shows one caption per scene, in order', () => {
    expect(STEP_ORDER.map((scene) => activeScene(SCENES[scene][0] + 0.01))).toEqual(STEP_ORDER);
    expect(activeScene(1)).toBe('badge');
    expect(activeScene(1.5)).toBe('badge');
  });

  it('caps task minutes to the dial and defaults missing ones', () => {
    expect(taskMinutes(undefined)).toBe(DEFAULT_MINUTES);
    expect(taskMinutes(0)).toBe(DEFAULT_MINUTES);
    expect(taskMinutes(8)).toBe(8);
    expect(taskMinutes(45)).toBe(30);
  });

  it('counts the clock up during the work scene', () => {
    expect(clockText(0, 15)).toBe('0:00');
    expect(clockText(SCENES.work[0] + 0.125, 15)).toBe('7:30');
    expect(clockText(1, 15)).toBe('15:00');
  });

  it('rounds dial stills up to five-minute steps', () => {
    expect(dialStill(1)).toBe('minute-dial-05');
    expect(dialStill(12)).toBe('minute-dial-15');
    expect(dialStill(30)).toBe('minute-dial-30');
    expect(dialStill(90)).toBe('minute-dial-30');
  });

  it('picks a work vignette from task tags', () => {
    expect(vignetteFor(['#Spanish', 'health'])).toBe('translate');
    expect(vignetteFor(['data', 'water'])).toBe('data');
    expect(vignetteFor(['Education'])).toBe('proofread');
    expect(vignetteFor(['history'])).toBe('photos');
    expect(vignetteFor([])).toBe('translate');
  });

  it('maps stage progress to each asset timeline', () => {
    const start = assetTimelines(0, 15);
    expect(Object.values(start).every((value) => value === 0)).toBe(true);
    const done = assetTimelines(1, 15);
    expect(done['minute-dial']).toBe(0.5);
    expect(done['badge-press']).toBe(1);
    expect(done['ink-stamp-approved']).toBe(1);
  });

  it('reports scene state changes', () => {
    expect(stageState(0)).toEqual({ scene: 'post', reviewing: false, lanesVisible: true, ended: false });
    expect(stageState(SCENES.work[0] + LANES_LINGER).lanesVisible).toBe(false);
    expect(stageState(SCENES.review[0]).reviewing).toBe(true);
    expect(stageState(END_AT).ended).toBe(true);
  });

  it('places the ticket on desktop, in right-to-left locales, and on phones', () => {
    expect(ticketPosition(0, { width: 1000, height: 800, rtl: false })).toEqual({ x: 250, y: 400 });
    expect(ticketPosition(0.4, { width: 1000, height: 800, rtl: false })).toEqual({ x: 750, y: 400 });
    expect(ticketPosition(0, { width: 1000, height: 800, rtl: true })).toEqual({ x: 750, y: 400 });
    expect(ticketPosition(0, { width: 1000, height: 800, rtl: false, bottomInset: 200 })).toEqual({ x: 250, y: 300 });
    expect(ticketPosition(0, { width: 390, height: 700, rtl: false })).toEqual({ x: 195, y: 182 });
    expect(ticketPosition(0.4, { width: 390, height: 700, rtl: false }).y).toBeCloseTo(378);
  });

  it('keeps seek times inside each asset timeline', () => {
    expect(seekSeconds(-1)).toBe(0);
    expect(seekSeconds(0.5)).toBe(0.5);
    expect(seekSeconds(1)).toBe(0.9999);
  });
});
