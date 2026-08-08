<script lang="ts">
  import Icon from "@iconify/svelte";
  import { onMount } from 'svelte';
  import { account } from '$lib/appwrite.client';
  import { getTagStyle } from '$lib/utils/tagColors';

  export let data: {
    signedIn: boolean;
    user?: { id: string; email?: string } | null;
    userData: any;
  };

  let orgName = '';
  let lottieReady = false;

  const tasks: Array<{ id: string; title: string; shortDescription: string; estimatedMinutes?: number; tags?: string[]; status?: string }> = data.userData?.myTasks || [];
  const pendingReviews: Array<{ id: string; notes?: string; proofUrl?: string; createdAt?: string; task?: { title?: string } }> = data.userData?.pendingReviews || [];
  const totalTasks: number = data.userData?.totalTasks || 0;
  const pendingReviewsCount: number = data.userData?.pendingReviewsCount || 0;
  const approvedClaimsCount: number = data.userData?.approvedClaimsCount || 0;
  const totalHours: number = data.userData?.totalHours || 0;

  // Ring shows pending reviews proportion (capped at 12 for visual sanity)
  const ringMax = Math.max(12, pendingReviewsCount);
  const ringPct = Math.min(100, Math.round((pendingReviewsCount / ringMax) * 100));
  const RING_CIRCUMFERENCE = 251;
  const ringDashOffset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * ringPct) / 100;

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

  async function handleClaimAction(claimId: string, action: 'approve' | 'reject') {
    try {
      const response = await fetch(`/api/claims/${claimId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (response.ok) {
        window.location.reload();
      } else {
        alert('Failed to process the claim. Please try again.');
      }
    } catch {
      alert('An error occurred. Please try again.');
    }
  }

  onMount(async () => {
    import('@dotlottie/player-component').then(() => { lottieReady = true; }).catch(() => {});

    if (data.signedIn) {
      try {
        const me = await account.get();
        const prefs = (me?.prefs ?? {}) as Record<string, unknown>;
        if (typeof prefs.orgName === 'string' && prefs.orgName.trim()) {
          orgName = prefs.orgName.trim();
        } else if (me?.name) {
          orgName = me.name;
        }
      } catch {}
    }
  });
</script>

<div class="ngo-dash">
  <!-- ───── Hero ───── -->
  <section class="ngo-hero brand-card">
    <div class="ngo-hero-blob ngo-hero-blob-coral"></div>
    <div class="ngo-hero-blob ngo-hero-blob-blue"></div>

    <div class="ngo-hero-text">
      <h1>Welcome back, <span class="coral-gradient">{orgName || 'team'}</span>.</h1>
      <p>
        {#if pendingReviewsCount > 0}
          {pendingReviewsCount} submission{pendingReviewsCount === 1 ? '' : 's'} waiting on you <span class="pipe-sep">|</span> {totalTasks} task{totalTasks === 1 ? '' : 's'} live
        {:else}
          Mission control's all clear. Post your next task or review your impact.
        {/if}
      </p>
      <div class="ngo-hero-actions">
        <a href="/org" class="btn-coral">
          Post a task
          <Icon icon="lucide:plus" width="16" height="16" />
        </a>
        <a href="/badges/manage" class="btn-outline-dark">Manage badges</a>
      </div>
    </div>

    <div class="ngo-hero-ring">
      <svg viewBox="0 0 100 100" class="progress-ring">
        <circle cx="50" cy="50" r="40" class="ring-bg" />
        {#if pendingReviewsCount > 0}
          <circle cx="50" cy="50" r="40" class="ring-fg" style:stroke-dashoffset={ringDashOffset} />
        {/if}
      </svg>
      <div class="ring-label">
        <span class="ring-pct">{pendingReviewsCount}</span>
        <span class="ring-sub">Awaiting review</span>
      </div>
    </div>
  </section>

  <!-- ───── Pending reviews queue (the NGO's main job) ───── -->
  <section>
    <div class="section-head">
      <h2>Awaiting your review</h2>
      <span class="section-count">{pendingReviewsCount} open</span>
    </div>

    {#if data.signedIn && pendingReviews.length > 0}
      <div class="reviews-list">
        {#each pendingReviews as claim (claim.id)}
          <article class="review-card">
            <div class="review-card-head">
              <div class="review-icon"><Icon icon="lucide:file-check-2" width="20" height="20" /></div>
              <div class="review-meta">
                <h3>{claim.task?.title || 'Task'}</h3>
                {#if claim.createdAt}
                  <small>Submitted {relativeTime(claim.createdAt)}</small>
                {/if}
              </div>
            </div>
            <p class="review-notes">{claim.notes || 'No notes provided.'}</p>
            <div class="review-actions">
              {#if claim.proofUrl}
                <a href={claim.proofUrl} target="_blank" rel="noopener" class="review-proof">
                  <Icon icon="lucide:external-link" width="14" height="14" /> View proof
                </a>
              {/if}
              <div class="review-buttons">
                <button class="btn-reject" on:click={() => handleClaimAction(claim.id, 'reject')}>
                  <Icon icon="lucide:x" width="14" height="14" /> Reject
                </button>
                <button class="btn-approve" on:click={() => handleClaimAction(claim.id, 'approve')}>
                  <Icon icon="lucide:check" width="14" height="14" /> Approve
                </button>
              </div>
            </div>
          </article>
        {/each}
      </div>
    {:else}
      <div class="empty-card">
        <div class="empty-mascot">
          {#if lottieReady}
            <dotlottie-player src="/animations/empty_state_mascot.lottie" autoplay loop="true"></dotlottie-player>
          {:else}
            <Icon icon="lucide:inbox" width="64" height="64" />
          {/if}
        </div>
        <h3>Inbox zero.</h3>
        <p>No submissions waiting right now. Volunteers' work will land here as it comes in.</p>
      </div>
    {/if}
  </section>

  <!-- ───── Mission control (stats) ───── -->
  <section class="stats-strip brand-card">
    <div class="stat">
      <div class="stat-icon stat-icon-blue"><Icon icon="lucide:clipboard-list" width="20" height="20" /></div>
      <div class="stat-body">
        <div class="stat-num">{totalTasks}</div>
        <div class="stat-label">Active tasks</div>
      </div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat">
      <div class="stat-icon stat-icon-amber"><Icon icon="lucide:hourglass" width="20" height="20" /></div>
      <div class="stat-body">
        <div class="stat-num">{pendingReviewsCount}</div>
        <div class="stat-label">Pending reviews</div>
      </div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat">
      <div class="stat-icon stat-icon-green"><Icon icon="lucide:check-circle-2" width="20" height="20" /></div>
      <div class="stat-body">
        <div class="stat-num">{approvedClaimsCount}</div>
        <div class="stat-label">Completions</div>
      </div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat">
      <div class="stat-icon stat-icon-coral"><Icon icon="lucide:clock" width="20" height="20" /></div>
      <div class="stat-body">
        <div class="stat-num">{totalHours.toFixed(1)}</div>
        <div class="stat-label">Hours generated</div>
      </div>
    </div>
  </section>

  <!-- ───── Your tasks ───── -->
  <section>
    <div class="section-head">
      <h2>Your tasks</h2>
      <a href="/org" class="section-link">Create new
        <Icon icon="lucide:plus" width="14" height="14" />
      </a>
    </div>

    {#if data.signedIn && tasks.length > 0}
      <div class="task-grid">
        {#each tasks as task (task.id)}
          <a href="/task/{task.id}" class="task-mini">
            <div class="task-mini-top">
              <div class="task-mini-avatar"><Icon icon="lucide:heart-handshake" width="20" height="20" /></div>
              {#if task.estimatedMinutes}
                <span class="mini-time"><Icon icon="lucide:clock" width="12" height="12" /> {task.estimatedMinutes} min</span>
              {/if}
            </div>
            <h4>{task.title}</h4>
            <p>{task.shortDescription}</p>
            <div class="task-mini-foot">
              <div class="mini-tags">
                {#each (task.tags ?? []).slice(0, 2) as tag (tag)}
                  {@const s = getTagStyle(tag)}
                  <span class="tag" style:background={s.bg} style:color={s.color}>#{tag}</span>
                {/each}
              </div>
              {#if task.status && task.status !== 'active'}
                <span class="task-status" data-status={task.status}>{task.status}</span>
              {/if}
            </div>
          </a>
        {/each}
      </div>
    {:else if data.signedIn}
      <div class="empty-card empty-card-compact">
        <Icon icon="lucide:plus-circle" width="44" height="44" style="color: var(--color-primary-light);" />
        <h3>No tasks yet.</h3>
        <p>Post your first micro-task and start matching with volunteers.</p>
        <a href="/org" class="btn-coral btn-sm">
          Post a task
          <Icon icon="lucide:plus" width="14" height="14" />
        </a>
      </div>
    {:else}
      <div class="empty-card empty-card-compact">
        <p>Sign in to manage your NGO workspace.</p>
      </div>
    {/if}
  </section>
</div>

<style>
  .ngo-dash { display: flex; flex-direction: column; gap: 24px; max-width: 1040px; margin: 0 auto; }

  /* Hero */
  .ngo-hero { position: relative; overflow: hidden; padding: 28px 32px; border-radius: 24px; display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: center; }
  @media (max-width: 768px) { .ngo-hero { grid-template-columns: 1fr; padding: 24px 20px; gap: 20px; } }
  .ngo-hero-blob { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; opacity: 0.45; }
  .ngo-hero-blob-coral { top: -50%; right: -10%; width: 360px; height: 360px; background: rgba(255, 107, 107, 0.25); }
  .ngo-hero-blob-blue { bottom: -50%; left: 30%; width: 320px; height: 320px; background: rgba(147, 197, 253, 0.35); }
  .ngo-hero-text { position: relative; z-index: 1; max-width: 500px; }
  .ngo-hero-text h1 { font-size: clamp(1.5rem, 2.2vw + 0.5rem, 2.1rem); font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; margin: 0 0 8px; }
  .ngo-hero-text p { color: color-mix(in srgb, var(--color-text) 70%, transparent); font-size: 14px; font-weight: 500; line-height: 1.5; margin: 0 0 18px; max-width: 440px; }
  .ngo-hero-actions { display: flex; flex-wrap: wrap; gap: 10px; }
  .ngo-hero-ring { position: relative; width: 128px; height: 128px; flex-shrink: 0; z-index: 1; }
  @media (max-width: 768px) { .ngo-hero-ring { width: 110px; height: 110px; align-self: center; } }
  .ring-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .ring-pct { font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; color: var(--color-text); line-height: 1; }
  .ring-sub { font-size: 9px; font-weight: 700; color: color-mix(in srgb, var(--color-text) 50%, transparent); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; max-width: 90px; text-align: center; line-height: 1.2; }

  .pipe-sep {
    display: inline-block;
    margin: 0 6px;
    opacity: 0.4;
    font-weight: 300;
  }

  /* Section count metadata */
  .section-count { font-size: 13px; font-weight: 600; color: color-mix(in srgb, var(--color-text) 55%, transparent); }

  /* Reviews list */
  .reviews-list { display: flex; flex-direction: column; gap: 12px; }
  .review-card { background: var(--color-surface); border-radius: 18px; padding: 18px 20px; border: 1px solid var(--card-border); box-shadow: 0 10px 24px rgba(15, 23, 42, 0.03); display: flex; flex-direction: column; gap: 12px; }
  .review-card-head { display: flex; gap: 12px; align-items: flex-start; }
  .review-icon { width: 38px; height: 38px; border-radius: 12px; background: #FEF3C7; color: #D97706; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .review-meta h3 { font-size: 15px; font-weight: 700; margin: 0 0 3px; }
  .review-meta small { font-size: 12px; font-weight: 500; color: color-mix(in srgb, var(--color-text) 55%, transparent); }
  .review-notes { font-size: 13px; line-height: 1.5; color: color-mix(in srgb, var(--color-text) 75%, transparent); margin: 0; padding: 10px 14px; background: color-mix(in srgb, var(--color-text) 3%, transparent); border-radius: 10px; }
  .review-actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .review-proof { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; background: #DBEAFE; color: #2563EB; border-radius: 9999px; font-size: 12px; font-weight: 700; text-decoration: none; transition: background .2s; }
  .review-proof:hover { background: #BFDBFE; }
  .review-buttons { display: flex; gap: 8px; margin-left: auto; }
  .btn-reject, .btn-approve { display: inline-flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 9999px; font-weight: 700; font-size: 12px; cursor: pointer; border: none; font-family: inherit; transition: all .2s; }
  .btn-reject { background: #FEE2E2; color: #B91C1C; }
  .btn-reject:hover { background: #FECACA; }
  .btn-approve { background: #D1FAE5; color: #047857; }
  .btn-approve:hover { background: #A7F3D0; }

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

  /* Task grid */
  .task-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
  .task-mini {
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: var(--color-surface);
    border-radius: 18px;
    border: 1px solid var(--card-border);
    padding: 16px;
    text-decoration: none;
    color: inherit;
    transition: all .25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .task-mini:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05); }
  .task-mini-top { display: flex; justify-content: space-between; align-items: center; }
  .task-mini-avatar { width: 36px; height: 36px; border-radius: 12px; background: linear-gradient(135deg, #DBEAFE, #BFDBFE); color: #2563EB; display: flex; align-items: center; justify-content: center; }
  .mini-time { font-size: 11px; font-weight: 700; color: color-mix(in srgb, var(--color-text) 50%, transparent); display: inline-flex; align-items: center; gap: 4px; }
  .task-mini h4 { font-size: 15px; font-weight: 700; margin: 0; line-height: 1.3; }
  .task-mini p { font-size: 12px; color: color-mix(in srgb, var(--color-text) 60%, transparent); margin: 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .task-mini-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-top: auto; }
  .mini-tags { display: flex; flex-wrap: wrap; gap: 5px; }
  .task-status { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; text-transform: capitalize; }
  .task-status[data-status="completed"] { background: #DBEAFE; color: #2563EB; }
  .task-status[data-status="expired"] { background: #FEE2E2; color: #B91C1C; }
  .task-status[data-status="moderated"] { background: #FEF3C7; color: #D97706; }

  /* Empty cards */
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
</style>
