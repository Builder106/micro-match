<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import Seo from '$lib/components/Seo.svelte';
  import AccountTabs from '$lib/components/AccountTabs.svelte';
  import PatchDesigner from '$lib/components/PatchDesigner.svelte';
  import PatchPreview from '$lib/components/PatchPreview.svelte';
  import { callApi } from '$lib/api';
  import { iconValue, resolvePatchIcon, type PatchIcon } from '$lib/quilt/icons';
  import { swatchName } from '$lib/quilt/fabrics';
  import { relativeTime } from '$lib/time';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let label = $state('');
  let color = $state('#FF6B6B');
  let icon = $state<PatchIcon>('heart');
  let criteria = $state<'task-completion' | 'task-specific'>('task-completion');
  let taskId = $state('');
  let description = $state('');
  let saving = $state(false);
  let error = $state('');
  let note = $state('');

  const taskTitle = (id?: string) => data.tasks.find((t) => t.id === id)?.title ?? 'a task that was removed';

  async function save(e: SubmitEvent) {
    e.preventDefault();
    if (!label.trim()) return void (error = 'Give the patch a name.');
    if (criteria === 'task-specific' && !taskId) return void (error = 'Pick the task this patch is for.');
    saving = true;
    error = '';
    const res = await callApi('/api/badges/manage', {
      body: { label: label.trim(), color, icon: iconValue(icon), criteria, taskId: criteria === 'task-specific' ? taskId : undefined, description: description.trim() || undefined },
      fallback: 'Could not save the patch.'
    });
    saving = false;
    if (!res.ok) return void (error = res.error);
    note = `${label.trim()} is ready. Volunteers earn it from your next approval.`;
    label = '';
    description = '';
    await invalidateAll();
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete "${name}"? Volunteers who earned it keep it; only the design goes.`)) return;
    const res = await callApi(`/api/badges/manage?id=${encodeURIComponent(id)}`, { method: 'DELETE', fallback: 'Could not delete it.' });
    note = res.ok ? `${name} deleted.` : res.error;
    if (res.ok) await invalidateAll();
  }
</script>

<Seo title="Design a patch | MicroMatch" description="Design the patches volunteers earn for your nonprofit's tasks." noindex />

<AccountTabs />

<header class="page-head">
  <h1 class="display h-l" tabindex="-1">Design a patch</h1>
  <p class="lede">Each patch is a badge. Volunteers earn it when you approve their work, and it is sewn into the quilt in your fabric.</p>
</header>

<div class="studio">
  <form class="studio__form" onsubmit={save}>
    <PatchDesigner bind:color bind:icon label={label.trim() || 'Your patch'} idPrefix="badge" />
    <div class="field">
      <label for="b-name">Name</label>
      <input id="b-name" class="input" maxlength="100" bind:value={label} placeholder="Clinic translator" />
    </div>
    <fieldset class="field rule">
      <legend class="label">Who earns it</legend>
      <label><input type="radio" name="rule" value="task-completion" bind:group={criteria} /> Anyone whose work you approve on any of your tasks</label>
      <label><input type="radio" name="rule" value="task-specific" bind:group={criteria} /> Only people who finish one task</label>
      {#if criteria === 'task-specific'}
        {#if data.tasks.length}
          <select class="input" bind:value={taskId} aria-label="Task">
            <option value="">Pick a task</option>
            {#each data.tasks as t (t.id)}<option value={t.id}>{t.title}</option>{/each}
          </select>
        {:else}
          <p class="hint">Post a task first.</p>
        {/if}
      {/if}
    </fieldset>
    <div class="field">
      <label for="b-desc">What it is for (optional)</label>
      <textarea id="b-desc" class="input" maxlength="500" bind:value={description}></textarea>
    </div>
    {#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}
    {#if note}<p class="notice notice--ok" role="status">{note}</p>{/if}
    <button class="patch-btn" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save this patch'}</button>
  </form>

  <section class="studio__list" aria-labelledby="yours">
    <h2 id="yours" class="h-m">Your patches</h2>
    {#if data.badges.length}
      <ul>
        {#each data.badges as b (b.id)}
          <li>
            <PatchPreview color={b.color} icon={resolvePatchIcon(b.icon)} size="3.4rem" />
            <div>
              <strong>{b.label}</strong>
              <span class="small muted">
                {swatchName(b.color)}, {b.criteria === 'task-specific' ? `for "${taskTitle(b.taskId)}"` : b.criteria === 'task-completion' ? 'for any task' : 'rule not active yet'}{b.createdAt ? `, made ${relativeTime(b.createdAt)}` : ''}
              </span>
              {#if b.description}<span class="small">{b.description}</span>{/if}
            </div>
            <button type="button" class="link small" onclick={() => remove(b.id, b.label)}>Delete</button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="muted">None yet. Until you design one, approved work on your tasks is sewn in as plain, undyed cloth.</p>
    {/if}
  </section>
</div>

<style>
  .studio {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(16rem, 1fr);
    gap: clamp(1.5rem, 4vw, 3.5rem);
    align-items: start;
  }
  .studio__form {
    display: grid;
    gap: 1.25rem;
  }
  .studio__form > .patch-btn {
    justify-self: start;
  }
  .rule {
    border: 0;
    padding: 0;
    display: grid;
    gap: 0.5rem;
  }
  .rule label {
    display: flex;
    gap: 0.6rem;
    align-items: baseline;
    font-weight: 400;
    font-family: var(--f-body);
  }
  .studio__list {
    display: grid;
    gap: 1rem;
  }
  .studio__list ul {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 1rem;
  }
  .studio__list li {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.9rem;
    align-items: center;
  }
  .studio__list li div {
    display: grid;
    gap: 0.1rem;
  }
  @media (max-width: 899px) {
    .studio {
      grid-template-columns: 1fr;
    }
  }
</style>
