<script lang="ts">
  import Icon from '@iconify/svelte';
  import LottieAnimation from '$lib/components/LottieAnimation.svelte';
  import { resolve } from '$app/paths';

  export let data: {
    userRole: 'anonymous' | 'user' | 'ngo' | 'volunteer';
    user: { id: string; email?: string } | null;
    tasks: Array<{ id: string; title: string; shortDescription: string; tags: string[]; estimatedMinutes?: number }>;
    analytics: {
      totalBadgesAwarded: number;
      totalVolunteersEngaged: number;
      averageTasksPerVolunteer: number;
      topBadgeTypes: Array<{ type: string; count: number; percentage: number }>;
      engagementTrend: Array<{ month: string; badges: number; volunteers: number }>;
      recentAwards: Array<{ volunteer: string; badge: string; task: string; date: string }>;
    };
  };

  const { analytics } = data;

  // Cycle through warm/cool tones for the distribution rows so they read at a glance.
  const distroPalette = [
    { bg: 'rgba(255, 107, 107, 0.12)', accent: '#FF6B6B' },
    { bg: 'rgba(124, 58, 237, 0.12)',  accent: '#7C3AED' },
    { bg: 'rgba(59, 130, 246, 0.12)',  accent: '#2563EB' },
    { bg: 'rgba(5, 150, 105, 0.12)',   accent: '#059669' },
    { bg: 'rgba(217, 119, 6, 0.12)',   accent: '#D97706' },
    { bg: 'rgba(219, 39, 119, 0.12)',  accent: '#DB2777' }
  ];

  // Trend chart scaling.
  const maxTrendBadges = Math.max(1, ...analytics.engagementTrend.map((t) => t.badges));

  function relativeWhen(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const diffMs = Date.now() - d.getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const days = Math.floor(hr / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  }

  const hasData = analytics.totalBadgesAwarded > 0;
</script>

<svelte:head><title>Badge analytics · MicroMatch</title></svelte:head>

<div class="ba-page">
  <!-- ───── Hero ───── -->
  <section class="ba-hero brand-card">
    <div class="ba-hero-blob"></div>
    <div class="ba-hero-text">
      <h1>The story your <span class="coral-gradient">badges</span> tell.</h1>
      <p>See how volunteers are engaging with your work — which badges land, who's earning them, and how engagement is trending.</p>
      <div class="ba-hero-actions">
        <a href={resolve("/badges/manage", {})} class="btn-coral">
          <Icon icon="lucide:shield-check" width="16" height="16" /> Manage badges
        </a>
        <a href={resolve("/dashboard", {})} class="btn-outline-dark">
          <Icon icon="lucide:arrow-left" width="14" height="14" /> Dashboard
        </a>
      </div>
    </div>
  </section>

  <!-- ───── Stats strip ───── -->
  <section class="ba-stats brand-card">
    <div class="ba-stat">
      <div class="ba-stat-icon ba-icon-coral"><Icon icon="lucide:trophy" width="20" height="20" /></div>
      <div class="ba-stat-body">
        <div class="ba-stat-num">{analytics.totalBadgesAwarded}</div>
        <div class="ba-stat-label">Badges awarded</div>
      </div>
    </div>
    <div class="ba-divider"></div>
    <div class="ba-stat">
      <div class="ba-stat-icon ba-icon-blue"><Icon icon="lucide:users" width="20" height="20" /></div>
      <div class="ba-stat-body">
        <div class="ba-stat-num">{analytics.totalVolunteersEngaged}</div>
        <div class="ba-stat-label">Volunteers engaged</div>
      </div>
    </div>
    <div class="ba-divider"></div>
    <div class="ba-stat">
      <div class="ba-stat-icon ba-icon-green"><Icon icon="lucide:trending-up" width="20" height="20" /></div>
      <div class="ba-stat-body">
        <div class="ba-stat-num">{analytics.averageTasksPerVolunteer}</div>
        <div class="ba-stat-label">Avg badges per volunteer</div>
      </div>
    </div>
  </section>

  {#if !hasData}
    <!-- ───── Empty state for no data ───── -->
    <div class="ba-empty">
      <div class="ba-mascot">
        <LottieAnimation src="/animations/empty_state_mascot.json">
          <Icon icon="lucide:bar-chart-3" width="64" height="64" />
        </LottieAnimation>
      </div>
      <h2>No data yet.</h2>
      <p>Once volunteers complete tasks and earn your badges, this is where you'll see distribution, trends, and recent activity.</p>
      <a href={resolve("/badges/manage", {})} class="btn-dark-pill">
        Create your first badge
        <Icon icon="lucide:arrow-right" width="14" height="14" />
      </a>
    </div>
  {:else}
    <!-- ───── Distribution + Trend ───── -->
    <div class="ba-grid">
      <section>
        <div class="section-head">
          <h2>Distribution</h2>
          <span class="ba-count">{analytics.topBadgeTypes.length} types</span>
        </div>
        <div class="brand-card ba-card-pad">
          {#if analytics.topBadgeTypes.length === 0}
            <p class="ba-mute">No badges awarded yet.</p>
          {:else}
            <ul class="ba-distro">
              {#each analytics.topBadgeTypes as bt, i (bt.type)}
                {@const tone = distroPalette[i % distroPalette.length]}
                <li class="ba-distro-row">
                  <div class="ba-distro-head">
                    <div class="ba-distro-dot" style="background: {tone.accent};"></div>
                    <strong>{bt.type}</strong>
                    <span class="ba-distro-count">{bt.count}</span>
                  </div>
                  <div class="ba-distro-bar" style="background: {tone.bg};">
                    <div class="ba-distro-fill" style="width: {bt.percentage}%; background: {tone.accent};"></div>
                  </div>
                  <span class="ba-distro-pct">{bt.percentage}%</span>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </section>

      <section>
        <div class="section-head">
          <h2>Engagement trend</h2>
          <span class="ba-count">{analytics.engagementTrend.length} mo</span>
        </div>
        <div class="brand-card ba-card-pad">
          {#if analytics.engagementTrend.length === 0}
            <p class="ba-mute">Not enough history yet — the chart shows up after the first month of activity.</p>
          {:else}
            <div class="ba-trend">
              {#each analytics.engagementTrend as t (t.month)}
                <div class="ba-trend-col">
                  <div class="ba-trend-bar">
                    <div class="ba-trend-fill" style="height: {(t.badges / maxTrendBadges) * 100}%;" aria-label="{t.badges} badges"></div>
                  </div>
                  <div class="ba-trend-meta">
                    <strong>{t.badges}</strong>
                    <small>{t.volunteers} vol</small>
                    <span>{t.month}</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </section>
    </div>

    <!-- ───── Recent awards ───── -->
    <section>
      <div class="section-head">
        <h2>Recent awards</h2>
        <span class="ba-count">last {Math.min(analytics.recentAwards.length, 10)}</span>
      </div>
      {#if analytics.recentAwards.length === 0}
        <div class="brand-card ba-card-pad">
          <p class="ba-mute">No awards yet.</p>
        </div>
      {:else}
        <div class="brand-card ba-awards">
          {#each analytics.recentAwards as award, i (i)}
            <div class="ba-award" class:has-divider={i > 0}>
              <div class="ba-award-icon">
                <Icon icon="lucide:trophy" width="18" height="18" />
              </div>
              <div class="ba-award-text">
                <strong>{award?.volunteer || 'Anonymous'}</strong>
                <small>earned <em>{award?.badge || 'Unknown'}</em> for "{award?.task || 'a task'}"</small>
              </div>
              <span class="ba-award-time">{award?.date ? relativeWhen(award.date) : ''}</span>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</div>

<style>
  .ba-page { display: flex; flex-direction: column; gap: 32px; max-width: 1100px; margin: 0 auto; }

  /* Hero */
  .ba-hero { position: relative; overflow: hidden; padding: 40px 36px; }
  .ba-hero-blob { position: absolute; top: -50%; right: -10%; width: 360px; height: 360px; border-radius: 50%; background: rgba(124, 58, 237, 0.15); filter: blur(80px); pointer-events: none; }
  .ba-hero-text { position: relative; z-index: 1; max-width: 560px; padding: 8px 12px; border-radius: 12px; background: var(--color-surface); }
  .ba-hero-text h1 { font-size: clamp(1.75rem, 3vw + 0.5rem, 2.75rem); font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; margin: 0 0 12px; }
  .ba-hero-text p { color: var(--color-text-secondary); font-size: 16px; font-weight: 500; line-height: 1.6; margin: 0 0 24px; max-width: 480px; }
  .ba-hero-actions { display: flex; flex-wrap: wrap; gap: 12px; }

  /* Stats strip */
  .ba-stats { display: flex; align-items: stretch; padding: 12px 8px; }
  .ba-stat { flex: 1; padding: 16px 12px; display: flex; align-items: center; gap: 14px; min-width: 0; }
  .ba-stat-icon { width: 40px; height: 40px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ba-icon-green { background: #D1FAE5; color: #059669; }
  .ba-icon-blue { background: #DBEAFE; color: #2563EB; }
  .ba-icon-coral { background: rgba(255, 107, 107, 0.12); color: var(--color-primary-readable); }
  .ba-stat-body { min-width: 0; }
  .ba-stat-num { font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; color: var(--color-text); }
  .ba-stat-label { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); margin-top: 2px; }
  .ba-divider { width: 1px; background: var(--card-border); margin: 12px 0; }
  @media (max-width: 768px) {
    .ba-stats { flex-wrap: wrap; padding: 8px; }
    .ba-stat { flex: 1 1 calc(50% - 8px); }
    .ba-divider { display: none; }
  }

  .ba-count { font-size: 12px; font-weight: 800; color: var(--color-text-secondary); background: color-mix(in srgb, var(--color-text) 5%, transparent); padding: 4px 10px; border-radius: 9999px; }

  .ba-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  @media (max-width: 768px) { .ba-grid { grid-template-columns: 1fr; } }
  .ba-card-pad { padding: 24px; }

  .ba-mute { color: var(--color-text-secondary); font-size: 14px; margin: 0; }

  /* Distribution */
  .ba-distro { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 16px; }
  .ba-distro-row { display: grid; grid-template-columns: 1fr; gap: 6px; }
  .ba-distro-head { display: flex; align-items: center; gap: 10px; font-size: 14px; }
  .ba-distro-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .ba-distro-head strong { font-weight: 700; color: var(--color-text); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ba-distro-count { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); }
  .ba-distro-bar { height: 8px; border-radius: 9999px; overflow: hidden; }
  .ba-distro-fill { height: 100%; border-radius: 9999px; transition: width .8s cubic-bezier(0.4, 0, 0.2, 1); }
  .ba-distro-pct { font-size: 12px; font-weight: 800; color: var(--color-text); align-self: flex-end; }

  /* Trend chart */
  .ba-trend { display: grid; grid-template-columns: repeat(auto-fit, minmax(60px, 1fr)); gap: 12px; align-items: end; min-height: 200px; }
  .ba-trend-col { display: flex; flex-direction: column; align-items: stretch; gap: 8px; min-width: 0; }
  .ba-trend-bar { height: 140px; background: color-mix(in srgb, var(--color-text) 5%, transparent); border-radius: 12px; display: flex; align-items: flex-end; overflow: hidden; }
  .ba-trend-fill {
    width: 100%;
    background: var(--color-primary);
    border-radius: 12px 12px 0 0;
    min-height: 4px;
    transition: height .8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ba-trend-meta { display: flex; flex-direction: column; align-items: center; gap: 1px; text-align: center; min-width: 0; }
  .ba-trend-meta strong { font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; font-size: 16px; font-weight: 800; color: var(--color-text); }
  .ba-trend-meta small { font-size: 11px; color: var(--color-text-secondary); font-weight: 600; }
  .ba-trend-meta span { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-text-tertiary); margin-top: 2px; }

  /* Recent awards list */
  .ba-awards { padding: 8px; }
  .ba-award { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 14px; transition: background .15s; }
  .ba-award.has-divider { border-top: 1px solid var(--card-border); border-radius: 0; }
  .ba-award:hover { background: color-mix(in srgb, var(--color-text) 3%, transparent); }
  .ba-award-icon { width: 36px; height: 36px; border-radius: 12px; background: #FDE68A; color: #D97706; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ba-award-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
  .ba-award-text strong { font-size: 14px; font-weight: 700; color: var(--color-text); }
  .ba-award-text small { font-size: 12px; color: var(--color-text-secondary); font-weight: 500; }
  .ba-award-text small em { font-style: normal; font-weight: 700; color: var(--color-primary-readable); }
  .ba-award-time { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); flex-shrink: 0; }

  /* Empty state */
  .ba-empty {
    background: var(--color-surface);
    border: 1px solid color-mix(in srgb, var(--color-primary-readable) 12%, transparent);
    border-radius: 32px;
    padding: 48px 32px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    box-shadow: 0 16px 40px rgba(255, 107, 107, 0.05);
  }
  .ba-mascot { width: 140px; height: 140px; display: flex; align-items: center; justify-content: center; color: var(--color-primary-light); }
  .ba-mascot :global(.lottie-animation) { width: 100%; height: 100%; }
  .ba-empty h2 { font-size: 22px; font-weight: 800; margin: 0; }
  .ba-empty p { color: var(--color-text-secondary); font-size: 15px; font-weight: 500; max-width: 380px; margin: 0; }
</style>
