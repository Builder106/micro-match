<script lang="ts">
  import Seo from '#lib/components/Seo.svelte';
  import Rich from '#lib/components/Rich.svelte';
  import * as m from '#lib/paraglide/messages.js';

  const sample = `[
  {
    "id": "task_123",
    "title": "Translate a medical flyer into Spanish",
    "shortDescription": "Help patients understand a one-page flyer about diabetes screenings.",
    "tags": ["translation", "spanish", "health"],
    "estimatedMinutes": 15,
    "language": "English"
  }
]`;

  type Row = [method: string, path: string, what: () => string, body?: string];
  const endpoints: { id: string; group: () => string; rows: Row[] }[] = [
    { id: 'open', group: m.api_group_open, rows: [
      ['GET', '/api/tasks', m.api_ep_tasks],
      ['GET', '/api/tasks/{id}/translation?lang=es', m.api_ep_translation],
      ['POST', '/api/tasks/translation', m.api_ep_translation_batch, '{ taskIds, locale }']
    ] },
    { id: 'signed', group: m.api_group_signed, rows: [
      ['POST', '/api/tasks/{id}/claim', m.api_ep_claim, '{ proofUrl, notes }'],
      ['GET', '/api/claims', m.api_ep_claims, 'status, limit, offset'],
      ['GET', '/api/badges', m.api_ep_badges],
      ['POST', '/api/profile/update', m.api_ep_profile],
      ['POST', '/api/profile/role', m.api_ep_role, '{ newRole: "volunteer" | "ngo" }'],
      ['POST', '/api/profile/avatar', m.api_ep_avatar, 'file']
    ] },
    { id: 'ngo', group: m.api_group_ngo, rows: [
      ['POST', '/api/tasks', m.api_ep_post, 'title, shortDescription, description, tags, estimatedMinutes, language, maxVolunteers, deadline'],
      ['PATCH', '/api/tasks/{id}', m.api_ep_status],
      ['DELETE', '/api/tasks/{id}', m.api_ep_delete],
      ['POST', '/api/claims/{id}/approve', m.api_ep_approve],
      ['POST', '/api/claims/{id}/reject', m.api_ep_reject],
      ['GET POST DELETE', '/api/badges/manage', m.api_ep_badges_manage, 'label, color, icon, criteria, taskId, description'],
      ['POST', '/api/verifications', m.api_ep_verify, '{ orgName, country, taxId, docFileId }'],
      ['GET DELETE', '/api/verifications/me', m.api_ep_verify_me],
      ['POST', '/api/verifications/upload', m.api_ep_verify_upload]
    ] },
    { id: 'admin', group: m.api_group_admin, rows: [
      ['GET', '/api/verifications', m.api_ep_queue],
      ['POST', '/api/verifications/{userId}/approve', m.api_ep_verify_approve],
      ['POST', '/api/verifications/{userId}/reject', m.api_ep_verify_reject, '{ reason }']
    ] }
  ];
</script>

<Seo title={m.api_meta_title()} description={m.api_meta_description()} />

<header class="page-head">
  <h1 class="display h-xl" tabindex="-1">{m.block_api_title()}</h1>
  <p class="lede">{m.api_lede()}</p>
</header>

<section class="part" aria-labelledby="feed">
  <h2 id="feed">{m.api_feed_title()}</h2>
  <p><Rich text={m.api_feed_body()} /></p>
  <!-- A scrollable code sample has to be reachable by keyboard; code always reads left to right. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <pre dir="ltr" tabindex="0" role="region" aria-label={m.api_sample_label()}><code>{sample}</code></pre>
</section>

{#each endpoints as group (group.id)}
  <section class="part" aria-labelledby="g-{group.id}">
    <h2 id="g-{group.id}">{group.group()}</h2>
    <dl class="eps">
      {#each group.rows as [method, path, what, body] (path + method)}
        <div class="ep">
          <dt><span class="ep__method">{method}</span> <code dir="ltr">{path}</code></dt>
          <dd>{what()}{#if body} <code dir="ltr">{body}</code>{/if}</dd>
        </div>
      {/each}
    </dl>
  </section>
{/each}

<p class="small muted"><Rich text={m.api_errors()} /> <code>{'{ "error": "...", "reasons": [] }'}</code></p>

<style>
  .eps {
    display: grid;
    gap: 0.9rem;
  }
  .ep {
    display: grid;
    gap: 0.2rem;
  }
  .ep dt {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: baseline;
  }
  .ep__method {
    font-family: var(--f-display);
    font-weight: 700;
    font-size: var(--t-xs);
    padding: 0.1rem 0.45rem;
    border-radius: var(--radius);
    background: var(--c-fg);
    color: var(--c-bg);
  }
  .ep dd {
    margin: 0;
    color: var(--c-muted);
    font-size: 0.95rem;
  }
  code {
    overflow-wrap: anywhere;
  }
</style>
