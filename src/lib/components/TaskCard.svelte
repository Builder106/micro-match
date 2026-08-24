<script lang="ts">
  import Icon from "@iconify/svelte";
  import { getTagStyle } from "$lib/utils/tagColors";
  import { resolve } from '$app/paths';
  export let id: string;
  export let title: string;
  export let shortDescription: string;
  export let tags: string[] = [];
  export let estimatedMinutes: number | undefined = undefined;
  export let language: string | undefined = undefined;
  export let href: string = "/task/" + id;
  export let status: string | undefined = undefined;
  export let deadline: string | undefined = undefined;
  export let maxVolunteers: number | undefined = undefined;
  export let isVerified: boolean | undefined = undefined;

  function getStatusInfo(s: string | undefined) {
    switch (s) {
      case 'completed': return { color: '#2563EB', bg: '#DBEAFE', icon: 'lucide:flag', label: 'Completed' };
      case 'expired': return { color: '#DC2626', bg: '#FEE2E2', icon: 'lucide:alarm-clock-off', label: 'Expired' };
      case 'moderated': return { color: '#D97706', bg: '#FEF3C7', icon: 'lucide:shield-alert', label: 'Under review' };
      default: return null;
    }
  }

  function formatDeadline(d: string | undefined): { text: string; tone: 'soon' | 'late' | 'normal' } | null {
    if (!d) return null;
    const date = new Date(d);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: 'Expired', tone: 'late' };
    if (diffDays === 0) return { text: 'Due today', tone: 'soon' };
    if (diffDays === 1) return { text: 'Due tomorrow', tone: 'soon' };
    if (diffDays <= 7) return { text: `Due in ${diffDays} days`, tone: 'soon' };
    return { text: `Due ${date.toLocaleDateString()}`, tone: 'normal' };
  }

  $: statusInfo = getStatusInfo(status);
  $: deadlineInfo = formatDeadline(deadline);
</script>

<article class="task-card" class:dimmed={status && status !== 'active'}>
  <div class="tc-top">
    <div class="tc-avatar">
      <Icon icon="lucide:heart-handshake" width="24" height="24" />
    </div>
    {#if typeof estimatedMinutes === 'number'}
      <span class="tc-time"><Icon icon="lucide:clock" width="14" height="14" /> {estimatedMinutes} min</span>
    {/if}
  </div>

  {#if statusInfo || isVerified === false}
    <div class="tc-flags">
      {#if statusInfo}
        <span class="tc-flag" style:background={statusInfo.bg} style:color={statusInfo.color}>
          <Icon icon={statusInfo.icon} width="12" height="12" /> {statusInfo.label}
        </span>
      {/if}
      {#if isVerified === false}
        <span class="tc-flag" style="background:#FEE2E2;color:#DC2626;">
          <Icon icon="lucide:shield-alert" width="12" height="12" /> Unverified
        </span>
      {/if}
    </div>
  {/if}

  <div class="tc-body">
    {#if language}
      <p class="tc-ngo"><Icon icon="lucide:globe" width="12" height="12" /> {language}</p>
    {/if}
    <h2><a href={resolve(href, {})}>{title}</a></h2>
    <p class="tc-desc">{shortDescription}</p>
  </div>

  <div class="tc-foot">
    <div class="tc-tags">
      {#each tags as tag (tag)}
        {@const s = getTagStyle(tag)}
        <span class="tag" style:background={s.bg} style:color={s.color}>#{tag}</span>
      {/each}
      {#if maxVolunteers}
        <span class="tag" style="background:#F1F5F9;color:#334155;">
          <Icon icon="lucide:users" width="12" height="12" /> Max {maxVolunteers}
        </span>
      {/if}
      {#if deadlineInfo}
        <span class="tag" class:tone-soon={deadlineInfo.tone === 'soon'} class:tone-late={deadlineInfo.tone === 'late'} class:tone-normal={deadlineInfo.tone === 'normal'}>
          <Icon icon="lucide:calendar-clock" width="12" height="12" /> {deadlineInfo.text}
        </span>
      {/if}
    </div>
    <a href={resolve(href, {})} class="btn-dark-pill btn-sm" aria-label={`View ${title}`}>
      View task
      <Icon icon="lucide:arrow-right" width="14" height="14" />
    </a>
  </div>
</article>

<style>
  .task-card {
    background: var(--color-surface);
    border-radius: 28px;
    padding: 28px;
    border: 1px solid var(--card-border);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
    display: flex;
    flex-direction: column;
    gap: 18px;
    transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .task-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
  }
  .task-card.dimmed { opacity: 0.7; }

  .tc-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .tc-avatar {
    width: 52px;
    height: 52px;
    border-radius: 18px;
    background: #FFE5DC;
    color: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform .3s;
  }
  .task-card:hover .tc-avatar { transform: scale(1.08); }
  .tc-time {
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 700;
    background: var(--color-surface-variant);
    color: var(--color-text-secondary);
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .tc-flags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: -8px; }
  .tc-flag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
  }

  .tc-body { flex: 1; display: flex; flex-direction: column; gap: 6px; }
  .tc-ngo {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 700;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0;
  }
  .tc-body h2 {
    font-size: 20px;
    font-weight: 700;
    line-height: 1.3;
    margin: 0;
  }
  .tc-body h2 a {
    color: inherit;
    text-decoration: none;
    transition: color .2s;
  }
  .tc-body h2 a:hover { color: var(--color-primary); }
  .tc-desc {
    color: var(--color-text-secondary);
    font-size: 14px;
    line-height: 1.55;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .tc-foot {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .tc-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .tag.tone-soon { background: #FEF3C7; color: #D97706; }
  .tag.tone-late { background: #FEE2E2; color: #DC2626; }
  .tag.tone-normal { background: #F1F5F9; color: #334155; }

  .btn-dark-pill {
    align-self: stretch;
    text-align: center;
  }

  @media (min-width: 640px) {
    .tc-foot { flex-direction: row; align-items: center; justify-content: space-between; }
    .btn-dark-pill { align-self: auto; flex-shrink: 0; }
  }
</style>
