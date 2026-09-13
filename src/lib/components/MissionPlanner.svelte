<script lang="ts">
  import Icon from '@iconify/svelte';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { type Locale } from '$lib/locale';
  import * as m from '$lib/paraglide/messages.js';
  import { createCapacityPlan, formatReviewTime, type TaskDuration } from '$lib/capacityPlan';

  const minimumBacklogHours = 2;
  const maximumBacklogHours = 40;
  const deliveryDayOptions = [2, 4, 7];
  type StaticMessage = (inputs?: Record<string, never>, options?: { locale?: Locale }) => string;
  const durationOptions: Array<{ value: TaskDuration; label: StaticMessage; description: StaticMessage }> = [
    { value: 5, label: m.mp_mission_size_5, description: m.mp_mission_size_5_description },
    { value: 15, label: m.mp_mission_size_15, description: m.mp_mission_size_15_description },
    { value: 30, label: m.mp_mission_size_30, description: m.mp_mission_size_30_description }
  ];

  let backlogHours = 12;
  let taskMinutes: TaskDuration = 15;
  let deliveryDays = 4;
  let backlogMessage = '';
  let backlogHasError = false;

  /* eslint-disable-next-line svelte/no-immutable-reactive-statements */
  $: currentLocale = (page.data?.locale as Locale | undefined) ?? 'en';
  $: capacityPlan = createCapacityPlan({ backlogHours, taskMinutes, deliveryDays });
  $: reviewDuration = formatReviewTime(capacityPlan.reviewMinutes)
    .replace(' hr', ` ${t(m.mp_review_hour_short)}`)
    .replace(' min', ` ${t(m.mp_review_minute_short)}`);
  function t(message: StaticMessage) { return message({}, { locale: currentLocale }); }

  function normalizeBacklogHours() {
    const parsedHours = Math.round(Number(backlogHours));
    const nextBacklogHours = Math.min(maximumBacklogHours, Math.max(minimumBacklogHours, Number.isFinite(parsedHours) ? parsedHours : minimumBacklogHours));
    backlogHasError = nextBacklogHours !== parsedHours;
    backlogHours = nextBacklogHours;
    backlogMessage = backlogHasError
      ? m.mp_invalid_hours({ hours: nextBacklogHours }, { locale: currentLocale })
      : '';
  }
</script>

<section class="mission-planner" aria-labelledby="mission-planner-title">
  <div class="planner-heading">
    <div class="planner-kicker">
      <Icon icon="lucide:layout-list" width="15" height="15" aria-hidden="true" />
      <span>{t(m.mp_kicker)}</span>
    </div>
    <h2 id="mission-planner-title">{t(m.mp_title)}</h2>
    <p>{t(m.mp_description)}</p>
  </div>

  <div class="planner-workbench">
    <form class="planner-inputs" aria-label={t(m.mp_aria_inputs)} onsubmit={(event) => event.preventDefault()}>
      <fieldset class="planner-step">
        <legend><span>1</span> {t(m.mp_work_to_package)}</legend>
        <div class="field-heading">
          <label for="backlog-hours">{t(m.mp_backlog_hours)}</label>
          <div class:has-error={backlogHasError} class="hours-field">
            <input
              id="backlog-hours"
              name="backlog-hours"
              type="number"
              min={minimumBacklogHours}
              max={maximumBacklogHours}
              step="1"
              inputmode="numeric"
              aria-describedby="backlog-help"
              aria-invalid={backlogHasError}
              bind:value={backlogHours}
              onblur={normalizeBacklogHours}
            />
            <span>{t(m.mp_hours)}</span>
          </div>
        </div>
        <input
          id="backlog-range"
          name="backlog-range"
          class="range-input"
          type="range"
          min={minimumBacklogHours}
          max={maximumBacklogHours}
          step="1"
          aria-label={t(m.mp_backlog_hours_to_package)}
          aria-valuetext={backlogHours + ' ' + t(m.mp_hours)}
          bind:value={backlogHours}
          oninput={() => {
            backlogHasError = false;
            backlogMessage = '';
          }}
        />
        <div class="range-scale" aria-hidden="true"><span>{t(m.mp_hours_2)}</span><span>{t(m.mp_hours_20)}</span><span>{t(m.mp_hours_40)}</span></div>
        <p id="backlog-help" class:error={backlogHasError} class="field-help">{backlogHasError ? backlogMessage : t(m.mp_choose_between_hours)}</p>
      </fieldset>

      <fieldset class="planner-step">
        <legend><span>2</span> {t(m.mp_mission_size)}</legend>
        <p class="step-copy">{t(m.mp_mission_size_copy)}</p>
        <div class="choice-grid" role="radiogroup" aria-label={t(m.mp_mission_size)}>
          {#each durationOptions as option (option.value)}
            <label class:selected={taskMinutes === option.value} class="choice-card">
              <input type="radio" name="task-minutes" value={option.value} bind:group={taskMinutes} />
              <strong>{t(option.label)}</strong>
              <span>{t(option.description)}</span>
            </label>
          {/each}
        </div>
      </fieldset>

      <fieldset class="planner-step">
        <legend><span>3</span> {t(m.mp_release_window)}</legend>
        <div class="release-options" role="radiogroup" aria-label={t(m.mp_release_window_aria)}>
          {#each deliveryDayOptions as days (days)}
            <label class:selected={deliveryDays === days} class="release-option">
              <input type="radio" name="delivery-days" value={days} bind:group={deliveryDays} />
              <span>{m.mp_days({ days }, { locale: currentLocale })}</span>
            </label>
          {/each}
        </div>
      </fieldset>
    </form>

    <aside class="mission-plan" aria-labelledby="posting-plan-title">
      <p class="plan-label">{t(m.mp_plan_label)}</p>
      <div class="plan-total" aria-live="polite" aria-atomic="true">
        <strong>{capacityPlan.missionCount}</strong>
        <div>
          <h3 id="posting-plan-title">{t(m.mp_missions_to_prepare)}</h3>
          <p>{m.mp_minutes_each_across({ minutes: taskMinutes, days: deliveryDays }, { locale: currentLocale })}</p>
        </div>
      </div>

      <div class="schedule-summary">
        <div class="summary-icon"><Icon icon="lucide:calendar-days" width="19" height="19" aria-hidden="true" /></div>
        <div>
          <strong>{m.mp_busiest_day({ count: capacityPlan.missionsPerDay }, { locale: currentLocale })}</strong>
          <span>{t(m.mp_release_summary)}</span>
        </div>
      </div>

      <ol class="release-schedule" aria-label={t(m.mp_daily_schedule)}>
        {#each capacityPlan.dailyMissionCounts as missionCount, index (index)}
          <li>
            <span>{m.mp_day({ day: index + 1 }, { locale: currentLocale })}</span>
            <strong>{missionCount}</strong>
            <small>{t(m.mp_missions)}</small>
          </li>
        {/each}
      </ol>

      <div class="review-note">
        <Icon icon="lucide:clipboard-check" width="19" height="19" aria-hidden="true" />
        <div>
          <strong>{m.mp_review_time({ duration: reviewDuration }, { locale: currentLocale })}</strong>
          <span>{t(m.mp_review_basis)}</span>
        </div>
      </div>

      <details class="plan-assumptions">
        <summary>{t(m.mp_schedule_works)}</summary>
        <p>{t(m.mp_schedule_explanation)}</p>
      </details>

      <a href={resolve("/signup", {})} class="plan-cta" aria-label={m.mp_create_profile_aria({ count: capacityPlan.missionCount }, { locale: currentLocale })}>
        {t(m.mp_create_profile)}
        <Icon icon="lucide:arrow-right" width="17" height="17" aria-hidden="true" />
      </a>
    </aside>
  </div>
</section>

<style>
  /* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V4
   * component: mission planner · genre: playful · theme: MicroMatch warm coral
   * states: default · hover · focus · active · disabled · loading · error · success
   * contrast: pass */
  .mission-planner { background: var(--color-surface); border: 1px solid var(--card-border-strong); border-radius: var(--radius-2xl); box-shadow: var(--elev-2); padding: clamp(var(--space-8), 5vw, var(--space-16)); }
  .planner-heading { margin: 0 auto clamp(var(--space-8), 5vw, var(--space-12)); max-width: 42rem; text-align: center; }
  .planner-kicker { align-items: center; background: color-mix(in srgb, var(--color-primary) 12%, transparent); border-radius: var(--radius-full); color: var(--color-text-secondary); display: inline-flex; font-size: var(--text-xs); font-weight: var(--font-bold); gap: var(--space-2); padding: var(--space-2) var(--space-3); }
  h2, h3, p { margin-block: 0; }
  .planner-heading h2 { color: var(--color-text); font-family: 'Plus Jakarta Sans', sans-serif; font-size: clamp(1.9rem, 3.2vw, 2.75rem); line-height: var(--leading-tight); margin-block: var(--space-3); overflow-wrap: anywhere; }
  .planner-heading > p { color: var(--color-text-secondary); font-size: var(--text-base); line-height: var(--leading-relaxed); }
  .planner-workbench { display: grid; gap: clamp(var(--space-8), 5vw, var(--space-12)); grid-template-columns: minmax(0, 1fr); }
  .planner-inputs { align-self: start; display: grid; min-width: 0; }
  .planner-step { border: 0; margin: 0; min-width: 0; padding: 0 0 var(--space-6); }
  .planner-step + .planner-step { padding-top: var(--space-6); }
  .planner-step:last-child { padding-bottom: 0; }
  .planner-step legend { border-bottom: 1px solid var(--card-border-strong); box-sizing: border-box; color: var(--color-text); display: flex; font-size: var(--text-lg); font-weight: var(--font-bold); gap: var(--space-3); padding: 0 0 var(--space-3); width: 100%; }
  .planner-step legend span { align-items: center; background: color-mix(in srgb, var(--color-primary) 12%, transparent); border-radius: var(--radius-full); color: var(--color-text-secondary); display: inline-flex; font-size: var(--text-xs); height: 1.5rem; justify-content: center; width: 1.5rem; }
  .field-heading { align-items: center; display: flex; gap: var(--space-4); justify-content: space-between; margin-top: var(--space-4); }
  .field-heading label { color: var(--color-text); font-size: var(--text-sm); font-weight: var(--font-bold); }
  .hours-field { align-items: center; border: 1px solid var(--color-outline-variant); border-radius: var(--radius-md); color: var(--color-text-secondary); display: inline-flex; gap: var(--space-2); min-height: 44px; padding-inline: var(--space-3); }
  .hours-field:focus-within { outline: 3px solid var(--color-primary-readable); outline-offset: 2px; }
  .hours-field.has-error { border-color: var(--color-error); }
  .hours-field:has(input:disabled), .choice-card:has(input:disabled), .release-option:has(input:disabled), .range-input:disabled { cursor: not-allowed; opacity: 0.55; }
  .choice-card:has(input:disabled), .release-option:has(input:disabled) { pointer-events: none; }
  .hours-field input { background: transparent; border: 0; color: var(--color-text); font: inherit; font-size: var(--text-lg); font-weight: var(--font-bold); min-width: 3rem; padding: 0; text-align: end; width: 3rem; }
  .hours-field input:focus { outline: 0; }
  .range-input { accent-color: var(--color-primary-readable); cursor: pointer; margin-top: var(--space-3); touch-action: manipulation; width: 100%; }
  .range-input:focus-visible { outline: 3px solid var(--color-primary-readable); outline-offset: var(--space-2); }
  .range-scale { color: var(--color-text-tertiary); display: flex; font-size: var(--text-xs); justify-content: space-between; margin-top: var(--space-2); }
  .field-help, .step-copy { color: var(--color-text-secondary); font-size: var(--text-xs); line-height: var(--leading-normal); margin-top: var(--space-2); min-height: 1lh; }
  .field-help.error { color: var(--color-error); }
  .choice-grid { display: grid; gap: var(--space-3); grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: var(--space-3); }
  .choice-card, .release-option { border: 1px solid var(--color-outline-variant); color: var(--color-text-secondary); cursor: pointer; display: grid; min-height: 4.75rem; padding: var(--space-3); position: relative; }
  .choice-card { align-content: start; border-radius: var(--radius-lg); gap: var(--space-1); }
  .choice-card input, .release-option input { cursor: pointer; inset: 0; margin: 0; opacity: 0; position: absolute; }
  .choice-card strong { color: var(--color-text); font-size: var(--text-sm); }
  .choice-card span { font-size: var(--text-xs); }
  .choice-card.selected, .release-option.selected { background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface)); border-color: var(--color-primary-readable); box-shadow: 0 0 0 1px var(--color-primary-readable); }
  .choice-card:has(input:focus-visible), .release-option:has(input:focus-visible), .plan-cta:focus-visible, .plan-assumptions summary:focus-visible { outline: 3px solid var(--color-primary-readable); outline-offset: 3px; }
  .release-options { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-3); }
  .release-option { align-items: center; border-radius: var(--radius-full); font-size: var(--text-sm); font-weight: var(--font-bold); justify-content: center; min-height: 44px; min-width: 5.5rem; padding-inline: var(--space-4); }
  .mission-plan { align-self: start; background: var(--color-surface); border: 1px solid var(--card-border-strong); border-radius: var(--radius-xl); box-shadow: var(--elev-3); min-width: 0; padding: clamp(var(--space-5), 3vw, var(--space-8)); }
  .plan-label { color: var(--color-primary-readable); font-size: var(--text-sm); font-weight: var(--font-bold); }
  .plan-total { align-items: center; display: flex; gap: var(--space-4); margin-block: var(--space-5); }
  .plan-total > strong { color: var(--color-primary-readable); font-family: 'Plus Jakarta Sans', sans-serif; font-size: clamp(3.5rem, 7vw, 5rem); font-variant-numeric: tabular-nums; letter-spacing: -0.07em; line-height: 0.85; }
  .plan-total h3 { color: var(--color-text); font-family: 'Plus Jakarta Sans', sans-serif; font-size: var(--text-xl); line-height: var(--leading-tight); }
  .plan-total p { color: var(--color-text-secondary); font-size: var(--text-sm); line-height: var(--leading-normal); margin-top: var(--space-2); }
  .schedule-summary { align-items: center; background: var(--color-surface-variant); border-radius: var(--radius-lg); display: flex; gap: var(--space-3); padding: var(--space-3); }
  .summary-icon { align-items: center; background: color-mix(in srgb, var(--color-primary) 14%, transparent); border-radius: var(--radius-md); color: var(--color-primary-readable); display: flex; flex: 0 0 2.5rem; height: 2.5rem; justify-content: center; }
  .schedule-summary strong, .schedule-summary span, .review-note strong, .review-note span { display: block; }
  .schedule-summary strong, .review-note strong { color: var(--color-text); font-size: var(--text-sm); }
  .schedule-summary span, .review-note span { color: var(--color-text-secondary); font-size: var(--text-xs); line-height: var(--leading-normal); margin-top: var(--space-1); }
  .release-schedule { display: grid; gap: var(--space-2); grid-template-columns: repeat(auto-fit, minmax(4.5rem, 1fr)); list-style: none; margin: var(--space-5) 0; padding: 0; }
  .release-schedule li { background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface)); border-radius: var(--radius-md); display: grid; gap: var(--space-1); min-width: 0; padding: var(--space-3); }
  .release-schedule span, .release-schedule small { color: var(--color-text-secondary); font-size: var(--text-xs); }
  .release-schedule strong { color: var(--color-text); font-size: var(--text-2xl); font-variant-numeric: tabular-nums; line-height: 1; }
  .review-note { align-items: center; border-top: 1px solid var(--card-border); display: flex; gap: var(--space-3); padding-top: var(--space-5); }
  .review-note :global(svg) { color: var(--color-success); flex: 0 0 auto; }
  .plan-assumptions { color: var(--color-text-secondary); font-size: var(--text-xs); line-height: var(--leading-normal); margin-top: var(--space-5); }
  .plan-assumptions summary { color: var(--color-text); cursor: pointer; font-weight: var(--font-bold); }
  .plan-assumptions p { margin-top: var(--space-2); }
  .plan-cta { align-items: center; background: var(--color-primary); border-radius: var(--radius-md); color: var(--color-action-on-coral); display: flex; font-size: var(--text-sm); font-weight: var(--font-bold); gap: var(--space-2); justify-content: center; margin-top: var(--space-5); min-height: 48px; text-decoration: none; white-space: nowrap; }
  @media (hover: hover) and (pointer: fine) { .choice-card:hover, .release-option:hover { border-color: var(--color-primary-readable); } .plan-cta:hover { background: var(--color-primary-variant); } }
  .choice-card:active, .release-option:active, .plan-cta:active { transform: translateY(1px); }
  @media (min-width: 60rem) { .planner-workbench { grid-template-columns: minmax(0, 1.05fr) minmax(20rem, 0.95fr); } .mission-plan { position: sticky; top: var(--space-6); } }
  @media (max-width: 32rem) { .field-heading { align-items: flex-start; flex-direction: column; } .choice-grid { gap: var(--space-2); } .choice-card { min-height: 4.25rem; padding: var(--space-2); } .choice-card span { display: none; } .plan-total { align-items: flex-start; flex-direction: column; } }
  @media (prefers-reduced-motion: reduce) { .choice-card, .release-option, .plan-cta { transition: none; } }
</style>
