<script lang="ts">
  import Icon from '@iconify/svelte';
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import type { BadgeDefinition } from '$lib/types';
  export let data: {
    userRole: 'anonymous' | 'user' | 'ngo' | 'volunteer';
    user: { id: string; email?: string } | null;
    tasks: Array<{ id: string; title: string; shortDescription: string; tags: string[]; estimatedMinutes?: number }>;
    badges: BadgeDefinition[];
  };

  let showCreateModal = false;
  let editingBadge: BadgeDefinition | null = null;
  let lottieReady = false;
  let firstInputBtn: HTMLInputElement | undefined;
  let saving = false;
  let saveError: string | null = null;
  let toast = '';

  const badgeTemplates = [
    { id: 'task-completion',    label: 'Task Completed',    color: '#16a34a', icon: 'lucide:check-circle-2',  description: 'Awarded for completing any task' },
    { id: 'quick-responder',    label: 'Quick Responder',   color: '#3b82f6', icon: 'lucide:zap',             description: 'Awarded for completing tasks under 15 minutes' },
    { id: 'dedicated-volunteer', label: 'Dedicated Volunteer', color: '#f59e0b', icon: 'lucide:heart',          description: 'Awarded for completing 5+ tasks' },
    { id: 'translation-expert', label: 'Translation Expert', color: '#8b5cf6', icon: 'lucide:languages',       description: 'Awarded for completing translation tasks' },
    { id: 'data-champion',      label: 'Data Champion',     color: '#ef4444', icon: 'lucide:database',        description: 'Awarded for completing data entry tasks' },
    { id: 'first-contribution', label: 'First Contribution', color: '#10b981', icon: 'lucide:star',           description: 'Awarded for first task completion' }
  ];

  let newBadge = {
    template: '',
    customLabel: '',
    customColor: '#FF6B6B',
    customIcon: 'lucide:trophy',
    criteria: 'task-completion' as BadgeDefinition['criteria'],
    taskId: '',
    description: ''
  };

  function resetForm() {
    newBadge = {
      template: '',
      customLabel: '',
      customColor: '#FF6B6B',
      customIcon: 'lucide:trophy',
      criteria: 'task-completion',
      taskId: '',
      description: ''
    };
    saveError = null;
  }

  function openCreateModal() {
    editingBadge = null;
    resetForm();
    showCreateModal = true;
    setTimeout(() => firstInputBtn?.focus(), 80);
  }

  function showToast(msg: string) {
    toast = msg;
    setTimeout(() => (toast = ''), 3500);
  }

  function closeModal() {
    showCreateModal = false;
    editingBadge = null;
  }

  function selectTemplate(template: typeof badgeTemplates[0]) {
    editingBadge = null;
    saveError = null;
    newBadge.template = template.id;
    newBadge.customLabel = template.label;
    newBadge.customColor = template.color;
    newBadge.customIcon = template.icon;
    newBadge.description = template.description;
    newBadge.criteria = 'task-completion';
    newBadge.taskId = '';
    if (!showCreateModal) {
      showCreateModal = true;
      setTimeout(() => firstInputBtn?.focus(), 80);
    }
  }

  async function saveBadge() {
    saveError = null;
    if (!newBadge.customLabel.trim()) { saveError = 'Badge name is required.'; return; }
    if (newBadge.criteria === 'task-specific' && !newBadge.taskId) { saveError = 'Pick a specific task or change the criterion.'; return; }

    saving = true;
    try {
      const res = await fetch('/api/badges/manage', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newBadge.customLabel.trim(),
          color: newBadge.customColor,
          icon: newBadge.customIcon,
          criteria: newBadge.criteria,
          taskId: newBadge.taskId || undefined,
          description: newBadge.description?.trim() || undefined
        })
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || 'Save failed');
      closeModal();
      await invalidateAll();
      showToast('Badge created');
    } catch (err) {
      saveError = (err as Error).message;
    } finally {
      saving = false;
    }
  }

  async function deleteBadge(badge: BadgeDefinition) {
    if (!confirm(`Delete "${badge.label}"? Volunteers who already earned it keep theirs — only the template goes away.`)) return;
    try {
      const res = await fetch(`/api/badges/manage?id=${encodeURIComponent(badge.id)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || 'Delete failed');
      await invalidateAll();
      showToast('Badge deleted');
    } catch (err) {
      showToast((err as Error).message);
    }
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && showCreateModal) closeModal();
  }

  function relativeDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 1) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  }

  onMount(() => {
    import('@dotlottie/player-component').then(() => { lottieReady = true; }).catch(() => {});
  });
</script>

<svelte:head><title>Manage badges · MicroMatch</title></svelte:head>
<svelte:window on:keydown={handleKey} />

<div class="bm-page">
  <!-- ───── Hero ───── -->
  <section class="bm-hero brand-card">
    <div class="bm-hero-blob"></div>
    <div class="bm-hero-text">
      <h1>Reward what <span class="coral-gradient">matters</span>.</h1>
      <p>Design custom badges to celebrate the moments that move your mission. Pick from a template, or build from scratch.</p>
      <div class="bm-hero-actions">
        <button class="btn-coral" on:click={openCreateModal}>
          <Icon icon="lucide:plus" width="16" height="16" /> Create badge
        </button>
        <a href="/badges/analytics" class="btn-outline-dark">
          <Icon icon="lucide:bar-chart-3" width="16" height="16" /> View analytics
        </a>
      </div>
    </div>
  </section>

  <!-- ───── Templates ───── -->
  <section>
    <div class="section-head">
      <h2>Start from a template</h2>
      <span class="bm-count">{badgeTemplates.length} ready</span>
    </div>
    <div class="bm-templates">
      {#each badgeTemplates as template (template.id)}
        <button class="bm-template" type="button" on:click={() => selectTemplate(template)}>
          <div class="bm-template-icon" style="background: {template.color}1A; color: {template.color};">
            <Icon icon={template.icon} width="24" height="24" />
          </div>
          <h3>{template.label}</h3>
          <p>{template.description}</p>
        </button>
      {/each}
    </div>
  </section>

  <!-- ───── Active badges ───── -->
  <section>
    <div class="section-head">
      <h2>Active badges</h2>
      <span class="bm-count">{data.badges.length} live</span>
    </div>

    {#if data.badges.length === 0}
      <div class="bm-empty">
        <div class="bm-mascot">
          {#if lottieReady}
            <dotlottie-player src="/animations/empty_state_mascot.lottie" autoplay loop="true"></dotlottie-player>
          {:else}
            <Icon icon="lucide:trophy" width="64" height="64" />
          {/if}
        </div>
        <h3>No badges yet.</h3>
        <p>Create your first badge from a template above — volunteers see them on completed tasks.</p>
        <button class="btn-coral" on:click={openCreateModal}>
          <Icon icon="lucide:plus" width="16" height="16" /> Create your first badge
        </button>
      </div>
    {:else}
      <div class="bm-badges">
        {#each data.badges as badge (badge.id)}
          <article class="bm-badge">
            <div class="bm-badge-icon" style="background: linear-gradient(135deg, {badge.color}, var(--color-primary)); box-shadow: 0 8px 20px {badge.color}40;">
              <Icon icon={badge.icon || 'lucide:trophy'} width="28" height="28" />
            </div>
            <div class="bm-badge-meta">
              <h4>{badge.label}</h4>
              <small>
                {#if badge.criteria === 'task-completion'}Awarded for any task{:else if badge.criteria === 'task-specific'}Awarded for a specific task{:else if badge.criteria === 'time-based'}Time-based{:else if badge.criteria === 'milestone'}Milestone{:else}Custom rule{/if}
                {#if badge.createdAt} <span class="pipe-sep">|</span> created {relativeDate(badge.createdAt)}{/if}
              </small>
            </div>
            <div class="bm-badge-actions">
              <button class="bm-icon-btn bm-danger" on:click={() => deleteBadge(badge)} aria-label="Delete"><Icon icon="lucide:trash-2" width="14" height="14" /></button>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </section>
</div>

<!-- ───── Create / edit modal ───── -->
{#if showCreateModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="bm-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="bm-modal-title"
    on:click={closeModal}
    tabindex="-1"
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="bm-modal-card" on:click|stopPropagation>
      <header class="bm-modal-head">
        <h2 id="bm-modal-title">{editingBadge ? 'Edit badge' : 'Create new badge'}</h2>
        <button class="bm-icon-btn" on:click={closeModal} aria-label="Close">
          <Icon icon="lucide:x" width="18" height="18" />
        </button>
      </header>

      <div class="bm-preview">
        <div class="bm-preview-icon" style="background: linear-gradient(135deg, {newBadge.customColor}, var(--color-primary)); box-shadow: 0 12px 30px {newBadge.customColor}40;">
          <Icon icon={newBadge.customIcon} width="36" height="36" />
        </div>
        <strong>{newBadge.customLabel || 'Badge name'}</strong>
        <small>Preview</small>
      </div>

      <div class="bm-form">
        <label class="bm-field">
          <span>Badge name</span>
          <input bind:this={firstInputBtn} bind:value={newBadge.customLabel} placeholder="e.g. Translation Hero" />
        </label>

        <label class="bm-field">
          <span>Color</span>
          <div class="bm-color-row">
            <input type="color" bind:value={newBadge.customColor} class="bm-color-swatch" />
            <code>{newBadge.customColor}</code>
          </div>
        </label>

        <label class="bm-field">
          <span>Award when</span>
          <select bind:value={newBadge.criteria}>
            <option value="task-completion">Any of your tasks is completed</option>
            <option value="task-specific">A specific task is completed</option>
          </select>
          <small class="bm-hint">More criteria types (time-based, milestones) coming soon.</small>
        </label>

        {#if newBadge.criteria === 'task-specific'}
          <label class="bm-field">
            <span>Which task</span>
            <select bind:value={newBadge.taskId}>
              <option value="">Pick a task…</option>
              {#each data.tasks as task (task.id)}
                <option value={task.id}>{task.title}</option>
              {/each}
            </select>
          </label>
        {/if}

        <label class="bm-field">
          <span>Description <small>(optional)</small></span>
          <textarea bind:value={newBadge.description} placeholder="What does earning this say about a volunteer?" rows="3"></textarea>
        </label>
      </div>

      {#if saveError}
        <div class="bm-error">
          <Icon icon="lucide:alert-circle" width="14" height="14" />
          {saveError}
        </div>
      {/if}

      <footer class="bm-modal-foot">
        <button class="bm-cancel" on:click={closeModal} disabled={saving}>Cancel</button>
        <button class="btn-coral" on:click={saveBadge} disabled={saving}>
          {#if saving}
            <Icon icon="lucide:loader-2" width="14" height="14" class="spin" />
          {/if}
          {editingBadge ? 'Update badge' : 'Create badge'}
          {#if !saving}<Icon icon="lucide:arrow-right" width="14" height="14" />{/if}
        </button>
      </footer>
    </div>
  </div>
{/if}

{#if toast}
  <div class="bm-toast" role="status">{toast}</div>
{/if}

<style>
  .bm-page { display: flex; flex-direction: column; gap: 32px; max-width: 1100px; margin: 0 auto; }

  /* Hero */
  .bm-hero { position: relative; overflow: hidden; padding: 40px 36px; }
  .bm-hero-blob { position: absolute; top: -50%; right: -10%; width: 360px; height: 360px; border-radius: 50%; background: rgba(255, 107, 107, 0.18); filter: blur(80px); pointer-events: none; }
  .bm-hero-text { position: relative; z-index: 1; max-width: 560px; }
  .bm-hero-text h1 { font-size: clamp(1.75rem, 3vw + 0.5rem, 2.75rem); font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; margin: 0 0 12px; }
  .bm-hero-text p { color: color-mix(in srgb, var(--color-text) 70%, transparent); font-size: 16px; font-weight: 500; line-height: 1.6; margin: 0 0 24px; max-width: 480px; }
  .bm-hero-actions { display: flex; flex-wrap: wrap; gap: 12px; }

  /* Section count chip */
  .bm-count { font-size: 12px; font-weight: 800; color: color-mix(in srgb, var(--color-text) 60%, transparent); background: color-mix(in srgb, var(--color-text) 5%, transparent); padding: 4px 10px; border-radius: 9999px; }

  /* Templates */
  .bm-templates { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
  .bm-template {
    text-align: left;
    background: var(--color-surface);
    border: 1px solid var(--card-border);
    border-radius: 24px;
    padding: 20px;
    cursor: pointer;
    font-family: inherit;
    color: inherit;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: all .25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .bm-template:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06); border-color: color-mix(in srgb, var(--color-primary) 25%, transparent); }
  .bm-template-icon { width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
  .bm-template h3 { font-size: 16px; font-weight: 700; margin: 0; }
  .bm-template p { font-size: 13px; color: color-mix(in srgb, var(--color-text) 60%, transparent); margin: 0; line-height: 1.5; }

  /* Active badges */
  .bm-badges { display: flex; flex-direction: column; gap: 12px; }
  .bm-badge {
    display: flex;
    align-items: center;
    gap: 16px;
    background: var(--color-surface);
    border: 1px solid var(--card-border);
    border-radius: 20px;
    padding: 16px 20px;
    transition: all .2s;
  }
  .bm-badge:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04); }
  .bm-badge-icon { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
  .bm-badge-meta { flex: 1; min-width: 0; }
  .bm-badge-meta h4 { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
  .bm-badge-meta small { font-size: 12px; color: color-mix(in srgb, var(--color-text) 55%, transparent); font-weight: 500; }
  .bm-badge-actions { display: flex; gap: 6px; }

  .bm-icon-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: color-mix(in srgb, var(--color-text) 5%, transparent);
    color: color-mix(in srgb, var(--color-text) 65%, transparent);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all .15s;
  }
  .bm-icon-btn:hover { background: color-mix(in srgb, var(--color-text) 10%, transparent); color: var(--color-text); }
  .bm-icon-btn.bm-danger:hover { background: color-mix(in srgb, var(--color-error) 12%, transparent); color: var(--color-error); }

  /* Empty */
  .bm-empty {
    background: var(--color-surface);
    border: 1px solid color-mix(in srgb, var(--color-primary) 12%, transparent);
    border-radius: 32px;
    padding: 48px 32px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    box-shadow: 0 16px 40px rgba(255, 107, 107, 0.05);
  }
  .bm-mascot { width: 140px; height: 140px; display: flex; align-items: center; justify-content: center; color: var(--color-primary-light); }
  .bm-mascot :global(dotlottie-player) { width: 100%; height: 100%; }
  .bm-empty h3 { font-size: 22px; font-weight: 800; margin: 0; }
  .bm-empty p { color: color-mix(in srgb, var(--color-text) 60%, transparent); font-size: 15px; font-weight: 500; max-width: 380px; margin: 0; }

  /* Modal */
  .bm-modal {
    position: fixed; inset: 0;
    background: rgba(15, 23, 42, 0.45);
    display: flex; align-items: center; justify-content: center;
    padding: 16px; z-index: 80;
    backdrop-filter: blur(4px);
    animation: bmFade .18s ease-out;
  }
  @keyframes bmFade { from { opacity: 0; } to { opacity: 1; } }
  .bm-modal-card {
    background: var(--color-surface);
    border-radius: 28px;
    padding: 28px;
    max-width: 520px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 32px 80px rgba(0, 0, 0, 0.25);
    display: flex; flex-direction: column; gap: 20px;
    animation: bmScale .22s cubic-bezier(0.4, 0, 0.2, 1);
  }
  @keyframes bmScale { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }

  .bm-modal-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .bm-modal-head h2 { font-size: 20px; font-weight: 700; margin: 0; }

  .bm-preview {
    background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 6%, var(--color-surface-variant)), var(--color-surface-variant));
    border-radius: 20px;
    padding: 24px 16px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    border: 1px solid var(--card-border);
  }
  .bm-preview-icon { width: 80px; height: 80px; border-radius: 22px; display: flex; align-items: center; justify-content: center; color: #fff; transition: transform .25s; }
  .bm-preview:hover .bm-preview-icon { transform: scale(1.05); }
  .bm-preview strong { font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; font-size: 17px; font-weight: 700; }
  .bm-preview small { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: color-mix(in srgb, var(--color-text) 50%, transparent); }

  .bm-form { display: flex; flex-direction: column; gap: 14px; }
  .bm-field { display: flex; flex-direction: column; gap: 6px; }
  .bm-field > span { font-size: 13px; font-weight: 700; color: var(--color-text); }
  .bm-field > span small { font-weight: 500; color: color-mix(in srgb, var(--color-text) 50%, transparent); margin-left: 4px; }
  .bm-field input:not([type]), .bm-field select, .bm-field textarea {
    padding: 12px 14px;
    border: 1px solid var(--card-border-strong);
    border-radius: 12px;
    background: var(--color-surface-variant);
    color: var(--color-text);
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    transition: all .2s;
  }
  .bm-field input:focus, .bm-field select:focus, .bm-field textarea:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.12); }
  .bm-field textarea { resize: vertical; min-height: 80px; line-height: 1.5; }

  .bm-color-row { display: flex; align-items: center; gap: 12px; }
  .bm-color-swatch { width: 48px; height: 48px; padding: 0; border: 1px solid var(--card-border-strong); border-radius: 12px; cursor: pointer; background: transparent; }
  .bm-color-row code { font-size: 13px; font-family: 'SF Mono', Menlo, monospace; color: color-mix(in srgb, var(--color-text) 70%, transparent); padding: 4px 10px; background: color-mix(in srgb, var(--color-text) 5%, transparent); border-radius: 8px; }

  .bm-error { display: inline-flex; align-items: center; gap: 6px; padding: 10px 14px; background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); border-radius: 12px; font-size: 13px; font-weight: 600; }
  .bm-hint { font-size: 12px; color: color-mix(in srgb, var(--color-text) 50%, transparent); margin-top: 2px; }

  .bm-modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding-top: 12px; border-top: 1px solid var(--card-border); }
  .bm-cancel {
    padding: 10px 20px;
    border-radius: 9999px;
    border: 1px solid var(--card-border-strong);
    background: var(--color-surface);
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text);
  }
  .bm-cancel:hover { background: color-mix(in srgb, var(--color-text) 5%, transparent); }
  .bm-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

  .bm-toast { position: fixed; bottom: 110px; left: 50%; transform: translateX(-50%); padding: 12px 20px; background: var(--color-text); color: var(--color-surface); border-radius: 14px; font-size: 13px; font-weight: 700; z-index: 70; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2); }
</style>
