<script lang="ts">
  import { refreshAll } from '$app/navigation';
  import Seo from '#lib/components/Seo.svelte';
  import AccountTabs from '#lib/components/AccountTabs.svelte';
  import PatchDesigner from '#lib/components/PatchDesigner.svelte';
  import PatchPreview from '#lib/components/PatchPreview.svelte';
  import { callApi } from '#lib/api.js';
  import { iconValue, resolvePatchIcon, type PatchIcon } from '#lib/quilt/icons.js';
  import { swatchName } from '#lib/quilt/fabrics.js';
  import { relativeTime } from '#lib/time.js';
  import * as m from '#lib/paraglide/messages.js';
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

  const taskTitle = (id?: string) => data.tasks.find((t) => t.id === id)?.title ?? m.badges_removed_task();

  async function save(e: SubmitEvent) {
    e.preventDefault();
    if (!label.trim()) return void (error = m.badges_need_name());
    if (criteria === 'task-specific' && !taskId) return void (error = m.badges_need_task());
    saving = true;
    error = '';
    const res = await callApi('/api/badges/manage', {
      body: { label: label.trim(), color, icon: iconValue(icon), criteria, taskId: criteria === 'task-specific' ? taskId : undefined, description: description.trim() || undefined },
      fallback: m.badges_save_error()
    });
    saving = false;
    if (!res.ok) return void (error = res.error);
    note = m.badges_ready({ name: label.trim() });
    label = '';
    description = '';
    await refreshAll();
  }

  async function remove(id: string, name: string) {
    if (!confirm(m.badges_delete_confirm({ name }))) return;
    const res = await callApi(`/api/badges/manage?id=${encodeURIComponent(id)}`, { method: 'DELETE', fallback: m.badges_delete_error() });
    note = res.ok ? m.badges_deleted({ name }) : res.error;
    if (res.ok) await refreshAll();
  }
</script>

<Seo title={m.badges_meta_title()} description={m.badges_meta_description()} noindex />

<AccountTabs />

<header class="page-head">
  <h1 class="display h-l" tabindex="-1">{m.badges_title()}</h1>
  <p class="lede">{m.badges_lede()}</p>
</header>

<div class="studio">
  <form class="studio__form" onsubmit={save}>
    <PatchDesigner bind:color bind:icon label={label.trim() || m.patch_your_patch()} idPrefix="badge" />
    <div class="field">
      <label for="b-name">{m.field_name()}</label>
      <input id="b-name" class="input" maxlength="100" bind:value={label} placeholder={m.badges_name_placeholder()} />
    </div>
    <fieldset class="field rule">
      <legend class="label">{m.badges_rule_legend()}</legend>
      <label><input type="radio" name="rule" value="task-completion" bind:group={criteria} /> {m.badges_rule_any()}</label>
      <label><input type="radio" name="rule" value="task-specific" bind:group={criteria} /> {m.badges_rule_one()}</label>
      {#if criteria === 'task-specific'}
        {#if data.tasks.length}
          <select class="input" bind:value={taskId} aria-label={m.badges_task_label()}>
            <option value="">{m.badges_pick_task()}</option>
            {#each data.tasks as t (t.id)}<option value={t.id}>{t.title}</option>{/each}
          </select>
        {:else}
          <p class="hint">{m.badges_post_first()}</p>
        {/if}
      {/if}
    </fieldset>
    <div class="field">
      <label for="b-desc">{m.badges_desc()}</label>
      <textarea id="b-desc" class="input" maxlength="500" bind:value={description}></textarea>
    </div>
    {#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}
    {#if note}<p class="notice notice--ok" role="status">{note}</p>{/if}
    <button class="patch-btn" type="submit" disabled={saving}>{saving ? m.status_saving() : m.badges_save()}</button>
  </form>

  <section class="studio__list" aria-labelledby="yours">
    <h2 id="yours" class="h-m">{m.badges_yours()}</h2>
    {#if data.badges.length}
      <ul>
        {#each data.badges as b (b.id)}
          <li>
            <PatchPreview color={b.color} icon={resolvePatchIcon(b.icon)} size="3.4rem" />
            <div>
              <strong>{b.label}</strong>
              <span class="small muted">
                {swatchName(b.color)}, {b.criteria === 'task-specific' ? m.badges_for_task({ task: taskTitle(b.taskId) }) : b.criteria === 'task-completion' ? m.badges_for_any() : m.badges_rule_inactive()}{b.createdAt ? m.badges_made({ time: relativeTime(b.createdAt) }) : ''}
              </span>
              {#if b.description}<span class="small">{b.description}</span>{/if}
            </div>
            <button type="button" class="link small" onclick={() => remove(b.id, b.label)}>{m.action_delete()}</button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="muted">{m.badges_none()}</p>
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
