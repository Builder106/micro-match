<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';

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

  const endpoints = [
    { group: 'Open to everyone', rows: [
      ['GET', '/api/tasks', 'Open tasks from verified nonprofits.'],
      ['GET', '/api/tasks/{id}/translation?lang=es', 'One task translated into a supported locale (es, fr, de, pt, zh, ar).'],
      ['POST', '/api/tasks/translation', 'Several tasks translated at once. Body: { taskIds, locale }.']
    ] },
    { group: 'Signed in', rows: [
      ['POST', '/api/tasks/{id}/claim', 'Claim a task with proof. Body: { proofUrl, notes }.'],
      ['GET', '/api/claims', 'Your claims. Query: status, limit (up to 100), offset.'],
      ['GET', '/api/badges', 'Badges you have been awarded.'],
      ['POST', '/api/profile/update', 'Update your display name, bio and organization name.'],
      ['POST', '/api/profile/role', 'Switch role. Body: { newRole: "volunteer" | "ngo" }.'],
      ['POST', '/api/profile/avatar', 'Upload an avatar image (form field file).']
    ] },
    { group: 'Nonprofits', rows: [
      ['POST', '/api/tasks', 'Post a task. Body: title, shortDescription, description, tags, estimatedMinutes, language, maxVolunteers, deadline.'],
      ['PATCH', '/api/tasks/{id}', 'Change the status of a task you posted.'],
      ['DELETE', '/api/tasks/{id}', 'Delete a task you posted.'],
      ['POST', '/api/claims/{id}/approve', 'Approve a claim on your task and award matching badges.'],
      ['POST', '/api/claims/{id}/reject', 'Reject a claim on your task.'],
      ['GET POST DELETE', '/api/badges/manage', 'List, create (label, color, icon, criteria, taskId, description) and delete your badge designs.'],
      ['POST', '/api/verifications', 'Send or update your verification. Body: { orgName, country, taxId, docFileId }.'],
      ['GET DELETE', '/api/verifications/me', 'Read or withdraw your verification.'],
      ['POST', '/api/verifications/upload', 'Upload a registration document (PDF, PNG or JPEG).']
    ] },
    { group: 'Admins', rows: [
      ['GET', '/api/verifications', 'The verification queue, with ProPublica results for US EINs.'],
      ['POST', '/api/verifications/{userId}/approve', 'Approve a nonprofit and mark its tasks verified.'],
      ['POST', '/api/verifications/{userId}/reject', 'Reject with a reason. Body: { reason }.']
    ] }
  ];
</script>

<Seo title="API | MicroMatch" description="The MicroMatch REST API: the public open-task feed as JSON, plus the endpoints for claims, badges, verification and reviews." />

<header class="page-head">
  <h1 class="display h-xl" tabindex="-1">API</h1>
  <p class="lede">The open task feed is public JSON, so anyone can show MicroMatch tasks elsewhere. Everything else needs a signed-in session.</p>
</header>

<section class="part" aria-labelledby="feed">
  <h2 id="feed">The open task feed</h2>
  <p><code>GET /api/tasks</code> needs no key. It returns tasks that are active, not past their deadline and posted by verified nonprofits.</p>
  <pre><code>{sample}</code></pre>
</section>

{#each endpoints as group (group.group)}
  <section class="part" aria-labelledby="g-{group.group}">
    <h2 id="g-{group.group}">{group.group}</h2>
    <dl class="eps">
      {#each group.rows as [method, path, what] (path + method)}
        <div class="ep">
          <dt><span class="ep__method">{method}</span> <code>{path}</code></dt>
          <dd>{what}</dd>
        </div>
      {/each}
    </dl>
  </section>
{/each}

<p class="small muted">Errors come back as <code>{'{ "error": "...", "reasons": [] }'}</code>. Text blocked by content safety returns 400 with its reasons.</p>

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
