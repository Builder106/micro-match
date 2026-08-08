<script lang="ts">
  import Icon from "@iconify/svelte";
  import { onMount } from 'svelte';
  import { fireConfettiBurst } from '$lib/utils/confetti';
  import { getTagStyle } from '$lib/utils/tagColors';
  import { account } from '$lib/appwrite.client';

  export let data: {
    signedIn: boolean;
    user?: { id: string; email?: string } | null;
    userData: any;
  };

  let badges: Array<{ label: string; color?: string }> = [];
  let firstName = '';
  let lottieReady = false;

  const approvedClaimsCount: number = data.userData?.approvedClaimsCount || 0;
  const totalHours: number = data.userData?.totalHours || 0;
  const level = Math.floor(approvedClaimsCount / 3) + 1;
  const xpToNextLevel = Math.max(0, 3 - (approvedClaimsCount % 3));
  const progress = approvedClaimsCount % 3 === 0 && approvedClaimsCount !== 0
    ? 100
    : Math.round(((approvedClaimsCount % 3) / 3) * 100);

  const allClaims: Array<{ id: string; status: string; createdAt?: string; task?: { title?: string } }> = data.userData?.myClaims || [];
  const statusOrder: Record<string, number> = { pending: 0, rejected: 1, approved: 2 };
  const recentClaims = [...allClaims]
    .sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9))
    .slice(0, 5);
  const pendingCount = allClaims.filter(c => c.status === 'pending').length;
  const recommendations: Array<{ id: string; title: string; shortDescription: string; estimatedMinutes?: number; tags?: string[] }> = data.userData?.recommendations || [];
  const todayMission = recommendations[0];
  const otherMissions = recommendations.slice(1, 3);

  const RING_CIRCUMFERENCE = 251;
  const ringDashOffset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * progress) / 100;

  function relativeTime(iso?: string): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const diff = Date.now() - then;
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const d = Math.floor(hr / 24);
    return `${d}d ago`;
  }

  function statusLabel(s: string): string {
    if (s === 'approved') return 'Approved';
    if (s === 'pending') return 'Under review';
    if (s === 'rejected') return 'Needs revision';
    return s;
  }

  function statusIcon(s: string): string {
    if (s === 'approved') return 'lucide:check-circle-2';
    if (s === 'pending') return 'lucide:clock';
    return 'lucide:alert-circle';
  }

  const lockedBadges = [
    { label: 'First Mission', icon: 'hugeicons:trophy-01', gradient: 'linear-gradient(135deg, #FDE68A, #F59E0B)' },
    { label: 'Speed Demon', icon: 'hugeicons:fire', gradient: 'linear-gradient(135deg, #FCA5A5, #E11D48)' },
    { label: 'Global Citizen', icon: 'hugeicons:globe-02', gradient: 'linear-gradient(135deg, #93C5FD, #4F46E5)' },
    { label: 'Perfect Week', icon: 'hugeicons:sparkles', gradient: 'linear-gradient(135deg, #6EE7B7, #059669)' },
  ];

  onMount(async () => {
    import('@dotlottie/player-component').then(() => { lottieReady = true; }).catch(() => {});

    if (data.signedIn) {
      try {
        const me = await account.get();
        const displayName = me?.name ?? '';
        firstName = displayName.trim().split(/\s+/)[0] || (data.user?.email?.split('@')[0] ?? '');
      } catch {}
      try {
        const res = await fetch('/api/badges', { credentials: 'include' });
        if (res.ok) {
          const payload = await res.json();
          badges = payload.map((b: any) => ({ label: b.label, color: b.color }));
        }
      } catch {}
    }

    const url = new URL(window.location.href);
    const shouldCelebrate = url.searchParams.get('celebrate') === '1' || localStorage.getItem('celebrate') === '1';
    const toast = localStorage.getItem('toast');
    if (shouldCelebrate) {
      fireConfettiBurst();
      try { localStorage.removeItem('celebrate'); } catch {}
    }
    if (toast) {
      const el = document.getElementById('toast');
      if (el) {
        el.textContent = toast;
        el.style.display = 'block';
        setTimeout(() => (el.style.display = 'none'), 3000);
      }
      try { localStorage.removeItem('toast'); } catch {}
    }
  });
</script>

<div class="vol-dash">
  <!-- ───── Hero ───── -->
  <section class="vol-hero brand-card">
    <div class="vol-hero-blob vol-hero-blob-yellow"></div>
    <div class="vol-hero-blob vol-hero-blob-coral"></div>

    <div class="vol-hero-text">
      {#if data.signedIn}
        <h1>Hey, <span class="coral-gradient">{firstName || 'there'}</span>.</h1>
        {#if approvedClaimsCount === 0}
          <p>Let's land your first task. It only takes a few minutes.</p>
        {:else}
          <p>Level {level} volunteer <span class="pipe-sep">|</span> {approvedClaimsCount} task{approvedClaimsCount === 1 ? '' : 's'} done <span class="pipe-sep">|</span> {totalHours.toFixed(1)} hour{totalHours === 1 ? '' : 's'} given.</p>
        {/if}
      {:else}
        <h1>Welcome to <span class="coral-gradient">Impact HQ</span>.</h1>
        <p>Claim your first mission and start building momentum.</p>
      {/if}
      <div class="vol-hero-actions">
        <a href="/tasks" class="btn-coral">
          {approvedClaimsCount === 0 ? 'Pick up a task' : 'Browse tasks'}
          <Icon icon="lucide:arrow-right" width="16" height="16" />
        </a>
        <a href="/profile" class="btn-outline-dark">Update profile</a>
      </div>
    </div>

    <div class="vol-hero-ring">
      <svg viewBox="0 0 100 100" class="progress-ring">
        <circle cx="50" cy="50" r="40" class="ring-bg" />
        <circle cx="50" cy="50" r="40" class="ring-fg" style:stroke-dashoffset={ringDashOffset} />
      </svg>
      <div class="ring-label">
        <span class="ring-pct">Lv {level}</span>
        <span class="ring-sub">{xpToNextLevel} task{xpToNextLevel === 1 ? '' : 's'} to Lv {level + 1}</span>
      </div>
    </div>
  </section>

  <!-- ───── Stats strip ───── -->
  <section class="stats-strip brand-card">
    <div class="stat">
      <div class="stat-icon stat-icon-green"><Icon icon="lucide:check-circle-2" width="20" height="20" /></div>
      <div class="stat-body">
        <div class="stat-num">{approvedClaimsCount}</div>
        <div class="stat-label">Tasks done</div>
      </div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat">
      <div class="stat-icon stat-icon-blue"><Icon icon="lucide:clock" width="20" height="20" /></div>
      <div class="stat-body">
        <div class="stat-num">{totalHours.toFixed(1)}</div>
        <div class="stat-label">Hours given</div>
      </div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat">
      <div class="stat-icon stat-icon-amber"><Icon icon="lucide:hourglass" width="20" height="20" /></div>
      <div class="stat-body">
        <div class="stat-num">{pendingCount}</div>
        <div class="stat-label">Awaiting review</div>
      </div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat">
      <div class="stat-icon stat-icon-coral"><Icon icon="hugeicons:trophy-01" width="20" height="20" /></div>
      <div class="stat-body">
        <div class="stat-num">{badges.length}</div>
        <div class="stat-label">Badges earned</div>
      </div>
    </div>
  </section>

  <!-- ───── Today's mission ───── -->
  <section>
    <div class="section-head">
      <h2>Today's mission</h2>
      {#if recommendations.length > 0}
        <a href="/tasks" class="section-link">View all
          <Icon icon="lucide:arrow-right" width="14" height="14" />
        </a>
      {/if}
    </div>

    {#if todayMission}
      <a href="/task/{todayMission.id}" class="mission-card">
        <div class="mission-card-top">
          <div class="mission-avatar"><Icon icon="lucide:heart-handshake" width="28" height="28" /></div>
          {#if todayMission.estimatedMinutes}
            <span class="mission-time"><Icon icon="lucide:clock" width="14" height="14" /> {todayMission.estimatedMinutes} min</span>
          {/if}
        </div>
        <h3>{todayMission.title}</h3>
        <p>{todayMission.shortDescription}</p>
        <div class="mission-card-bottom">
          <div class="mission-tags">
            {#each (todayMission.tags ?? []).slice(0, 3) as tag (tag)}
              {@const s = getTagStyle(tag)}
              <span class="tag" style:background={s.bg} style:color={s.color}>#{tag}</span>
            {/each}
          </div>
          <span class="mission-cta">Take it
            <Icon icon="lucide:arrow-right" width="16" height="16" />
          </span>
        </div>
      </a>
    {:else}
      <div class="empty-card">
        <div class="empty-mascot">
          {#if lottieReady}
            <dotlottie-player src="/animations/empty_state_mascot.lottie" autoplay loop="true"></dotlottie-player>
          {:else}
            <Icon icon="lucide:rocket" width="64" height="64" />
          {/if}
        </div>
        <h3>You're all caught up.</h3>
        <p>No tasks waiting right now. Check back soon, or browse the full feed.</p>
        <a href="/tasks" class="btn-dark-pill">
          Browse all tasks
          <Icon icon="lucide:arrow-right" width="16" height="16" />
        </a>
      </div>
    {/if}
  </section>

  <!-- ───── More for you ───── -->
  {#if otherMissions.length > 0}
    <section>
      <div class="section-head">
        <h2>More for you</h2>
        <a href="/tasks" class="section-link">View all
          <Icon icon="lucide:arrow-right" width="14" height="14" />
        </a>
      </div>
      <div class="more-grid">
        {#each otherMissions as task (task.id)}
          <a href="/task/{task.id}" class="mini-mission">
            <div class="mini-top">
              <div class="mini-avatar"><Icon icon="lucide:heart-handshake" width="20" height="20" /></div>
              {#if task.estimatedMinutes}
                <span class="mini-time"><Icon icon="lucide:clock" width="12" height="12" /> {task.estimatedMinutes} min</span>
              {/if}
            </div>
            <h4>{task.title}</h4>
            <p>{task.shortDescription}</p>
            <div class="mini-tags">
              {#each (task.tags ?? []).slice(0, 2) as tag (tag)}
                {@const s = getTagStyle(tag)}
                <span class="tag" style:background={s.bg} style:color={s.color}>#{tag}</span>
              {/each}
            </div>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  <!-- ───── Recent activity ───── -->
  <section>
    <div class="section-head">
      <h2>Recent activity</h2>
    </div>
    {#if data.signedIn && recentClaims.length > 0}
      <div class="activity brand-card">
        {#each recentClaims as claim, i (claim.id || i)}
          <div class="activity-row" class:has-divider={i > 0}>
            <div class="activity-icon" data-status={claim.status}>
              <Icon icon={statusIcon(claim.status)} width="20" height="20" />
            </div>
            <div class="activity-text">
              <strong>{claim.task?.title || 'Task'}</strong>
              <small>{statusLabel(claim.status)}{claim.createdAt ? ` | ${relativeTime(claim.createdAt)}` : ''}</small>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty-card empty-card-compact">
        <Icon icon="hugeicons:trophy-01" width="44" height="44" style="color: var(--color-primary-light);" />
        <p>Complete your first task to start filling this feed.</p>
      </div>
    {/if}
  </section>

  <!-- ───── Badge vault ───── -->
  <section>
    <div class="section-head">
      <h2>Badge vault</h2>
      <a href="/dashboard" class="section-link">{badges.length} earned</a>
    </div>
    <div class="vault-grid">
      {#if badges.length > 0}
        {#each badges.slice(0, 4) as badge (badge.label)}
          <div class="badge-card">
            <div class="badge-icon" style="background: linear-gradient(135deg, {badge.color || '#FDE68A'}, var(--color-primary)); box-shadow: 0 8px 24px {badge.color || 'rgba(245,158,11,0.4)'};">
              <Icon icon="hugeicons:trophy-01" width="32" height="32" />
            </div>
            <span class="badge-title">{badge.label}</span>
          </div>
        {/each}
      {:else}
        {#each lockedBadges as badge (badge.label)}
          <div class="badge-card locked">
            <div class="badge-icon" style:background={badge.gradient}>
              <Icon icon={badge.icon} width="32" height="32" />
              <div class="badge-lock"><Icon icon="lucide:lock" width="14" height="14" /></div>
            </div>
            <span class="badge-title">{badge.label}</span>
          </div>
        {/each}
      {/if}
    </div>
  </section>
</div>

<div id="toast" class="toast"></div>

<style>
  .vol-dash { display: flex; flex-direction: column; gap: 24px; max-width: 1040px; margin: 0 auto; }

  /* Hero */
  .vol-hero { position: relative; overflow: hidden; padding: 28px 32px; border-radius: 24px; display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: center; }
  @media (max-width: 768px) { .vol-hero { grid-template-columns: 1fr; padding: 24px 20px; gap: 20px; } }
  .vol-hero-blob { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; opacity: 0.5; }
  .vol-hero-blob-yellow { top: -50%; right: -10%; width: 360px; height: 360px; background: rgba(253, 224, 71, 0.4); }
  .vol-hero-blob-coral { bottom: -50%; left: 30%; width: 320px; height: 320px; background: rgba(255, 107, 107, 0.18); }
  .vol-hero-text { position: relative; z-index: 1; max-width: 500px; }
  .vol-hero-text h1 { font-size: clamp(1.5rem, 2.2vw + 0.5rem, 2.1rem); font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; margin: 0 0 8px; }
  .vol-hero-text p { color: color-mix(in srgb, var(--color-text) 70%, transparent); font-size: 14px; font-weight: 500; line-height: 1.5; margin: 0 0 18px; max-width: 440px; }
  .vol-hero-actions { display: flex; flex-wrap: wrap; gap: 10px; }
  .vol-hero-ring { position: relative; width: 128px; height: 128px; flex-shrink: 0; z-index: 1; }
  @media (max-width: 768px) { .vol-hero-ring { width: 110px; height: 110px; align-self: center; } }
  .ring-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .ring-pct { font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: var(--color-text); }
  .ring-sub { font-size: 9px; font-weight: 700; color: color-mix(in srgb, var(--color-text) 50%, transparent); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; max-width: 90px; text-align: center; line-height: 1.2; }

  /* Stats strip */
  .stats-strip { display: flex; align-items: stretch; padding: 8px 4px; border-radius: 20px; }
  .stat { flex: 1; padding: 12px 10px; display: flex; align-items: center; gap: 12px; min-width: 0; }
  .stat-icon { width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .stat-icon-green { background: #D1FAE5; color: #059669; }
  .stat-icon-blue { background: #DBEAFE; color: #2563EB; }
  .stat-icon-amber { background: #FEF3C7; color: #D97706; }
  .stat-icon-coral { background: rgba(255, 107, 107, 0.12); color: var(--color-primary); }
  .stat-body { min-width: 0; }
  .stat-num { font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; font-size: 19px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; color: var(--color-text); }
  .stat-label { font-size: 11px; font-weight: 600; color: color-mix(in srgb, var(--color-text) 55%, transparent); margin-top: 2px; }
  .stat-divider { width: 1px; background: color-mix(in srgb, var(--color-text) 8%, transparent); margin: 10px 0; }
  @media (max-width: 768px) {
    .stats-strip { flex-wrap: wrap; padding: 6px; }
    .stat { flex: 1 1 calc(50% - 6px); }
    .stat-divider { display: none; }
  }

  /* Mission card (today's mission) */
  .mission-card {
    display: block;
    background: var(--color-surface);
    border-radius: 22px;
    border: 1px solid var(--card-border);
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.03);
    padding: 22px;
    text-decoration: none;
    color: inherit;
    transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .mission-card:hover { transform: translateY(-3px); box-shadow: 0 20px 48px rgba(15, 23, 42, 0.06); }
  .mission-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .mission-avatar { width: 44px; height: 44px; border-radius: 16px; background: linear-gradient(135deg, #FFE5DC, #FFD1C2); color: var(--color-primary); display: flex; align-items: center; justify-content: center; }
  .mission-time { padding: 5px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; background: rgba(255, 107, 107, 0.1); color: var(--color-primary); display: inline-flex; align-items: center; gap: 5px; }
  .mission-card h3 { font-size: 18px; font-weight: 700; line-height: 1.3; margin: 0 0 6px; }
  .mission-card p { color: color-mix(in srgb, var(--color-text) 65%, transparent); font-size: 14px; line-height: 1.5; margin: 0 0 16px; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .mission-card-bottom { display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap; }
  .mission-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .mission-cta { display: inline-flex; align-items: center; gap: 5px; color: var(--color-primary); font-size: 13px; font-weight: 700; }

  /* "More for you" mini cards */
  .more-grid { display: grid; gap: 14px; grid-template-columns: 1fr 1fr; }
  @media (max-width: 640px) { .more-grid { grid-template-columns: 1fr; } }
  .mini-mission {
    display: block;
    background: var(--color-surface);
    border-radius: 18px;
    border: 1px solid var(--card-border);
    padding: 16px;
    text-decoration: none;
    color: inherit;
    transition: all .25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .mini-mission:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05); }
  .mini-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .mini-avatar { width: 36px; height: 36px; border-radius: 12px; background: linear-gradient(135deg, #FFE5DC, #FFD1C2); color: var(--color-primary); display: flex; align-items: center; justify-content: center; }
  .mini-time { font-size: 11px; font-weight: 700; color: color-mix(in srgb, var(--color-text) 50%, transparent); display: inline-flex; align-items: center; gap: 4px; }
  .mini-mission h4 { font-size: 15px; font-weight: 700; margin: 0 0 4px; line-height: 1.3; }
  .mini-mission p { font-size: 12px; color: color-mix(in srgb, var(--color-text) 60%, transparent); margin: 0 0 10px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .mini-tags { display: flex; flex-wrap: wrap; gap: 5px; }

  /* Activity */
  .activity { padding: 6px; }
  .activity-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; transition: background .15s; }
  .activity-row.has-divider { border-top: 1px solid color-mix(in srgb, var(--color-text) 4%, transparent); border-radius: 0; }
  .activity-row:hover { background: color-mix(in srgb, var(--color-text) 3%, transparent); }
  .activity-icon { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .activity-icon[data-status="approved"] { background: #D1FAE5; color: #059669; }
  .activity-icon[data-status="pending"] { background: #FEF3C7; color: #D97706; }
  .activity-icon[data-status="rejected"] { background: #FEE2E2; color: #DC2626; }
  .activity-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .activity-text strong { font-size: 13px; font-weight: 700; color: var(--color-text); }
  .activity-text small { font-size: 11px; font-weight: 500; color: color-mix(in srgb, var(--color-text) 55%, transparent); }

  /* Empty state cards */
  .empty-card {
    background: var(--color-surface);
    border-radius: 24px;
    border: 1px solid color-mix(in srgb, var(--color-primary) 12%, transparent);
    padding: 32px 24px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    box-shadow: 0 12px 32px rgba(255, 107, 107, 0.04);
  }
  .empty-card-compact { padding: 24px 20px; }
  .empty-mascot { width: 110px; height: 110px; display: flex; align-items: center; justify-content: center; color: var(--color-primary-light); }
  .empty-mascot :global(dotlottie-player) { width: 100%; height: 100%; }
  .empty-card h3 { font-size: 18px; font-weight: 800; margin: 0; }
  .empty-card p { color: color-mix(in srgb, var(--color-text) 60%, transparent); font-size: 13px; font-weight: 500; max-width: 340px; margin: 0; }

  /* Badge vault */
  .vault-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
  @media (max-width: 768px) { .vault-grid { grid-template-columns: repeat(2, 1fr); } }
  .badge-card { background: var(--color-surface); border-radius: 18px; padding: 18px 14px; display: flex; flex-direction: column; align-items: center; gap: 10px; border: 1px solid var(--card-border); transition: transform .25s cubic-bezier(0.4, 0, 0.2, 1); }
  .badge-card:hover { transform: translateY(-3px); }
  .badge-card.locked { opacity: 0.6; }
  .badge-icon { position: relative; width: 58px; height: 58px; border-radius: 18px; display: flex; align-items: center; justify-content: center; color: #fff; transition: transform .25s; }
  .badge-card:hover .badge-icon { transform: scale(1.05); }
  .badge-lock { position: absolute; bottom: -5px; right: -5px; width: 22px; height: 22px; border-radius: 50%; background: var(--color-text); color: var(--color-surface); display: flex; align-items: center; justify-content: center; border: 2px solid var(--color-surface); }
  .badge-title { font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; font-size: 12px; font-weight: 700; text-align: center; line-height: 1.3; color: var(--color-text); }

  /* Toast */
  .toast { display:none; position: fixed; bottom: 110px; left: 50%; transform: translateX(-50%); padding: 12px 20px; background: var(--color-surface); border: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent); box-shadow: 0 16px 40px rgba(0, 0, 0, 0.1); border-radius: 14px; font-weight: 700; color: var(--color-text); z-index: 60; }
</style>
