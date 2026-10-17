<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
</script>

<Seo title="Help | MicroMatch" description="Answers about accounts, claims, badges, nonprofit verification, moderation and translation on MicroMatch." />

<header class="page-head">
  <h1 class="display h-xl" tabindex="-1">Help</h1>
  <p class="lede">The questions people ask most, answered plainly. Something missing? <Link href="/contact" class="link">Tell us where</Link>.</p>
</header>

<h2 class="h-m">Volunteering</h2>
<div class="qas">
  <details class="qa">
    <summary>Do I need an account?</summary>
    <div><p>Not to look. The task feed and every task page are open to everyone. You need an account to claim a task and send your work.</p></div>
  </details>
  <details class="qa">
    <summary>What counts as proof?</summary>
    <div><p>A link to what you made: a document, a shared folder, a pull request, a design file. Add a short note about how you did it. The person reviewing reads both.</p></div>
  </details>
  <details class="qa">
    <summary>How long does review take?</summary>
    <div><p>A person at the nonprofit reviews each claim, so it depends on them. Your claim stays pinned to your block until they approve or reject it.</p></div>
  </details>
  <details class="qa">
    <summary>Where do my badges go?</summary>
    <div><p>To your block on your dashboard. Each nonprofit designs its own badges, so a patch from one looks different from another.</p></div>
  </details>
</div>

<h2 class="h-m">Nonprofits</h2>
<div class="qas">
  <details class="qa">
    <summary>Does the ProPublica check work outside the US?</summary>
    <div><p>No. ProPublica's Nonprofit Explorer covers US 501(c)(3) organizations. Elsewhere, upload your official registration document (PDF, PNG or JPEG) and an admin reviews it.</p></div>
  </details>
  <details class="qa">
    <summary>What does the verified mark do?</summary>
    <div><p>Once an admin approves your verification, the mark appears on every task you have posted and every task you post later. Unverified tasks do not appear in the public feed.</p></div>
  </details>
  <details class="qa">
    <summary>What if my verification is rejected?</summary>
    <div><p>You get an email with the reviewer's reason. Update your details or upload another document from your account and send it again. The decision is saved even if the email does not arrive.</p></div>
  </details>
  <details class="qa">
    <summary>Can I switch between volunteer and nonprofit?</summary>
    <div><p>Yes, from your profile. Switching from nonprofit to volunteer withdraws any verification application and removes the verified mark from tasks you posted.</p></div>
  </details>
</div>

<h2 class="h-m">Everything else</h2>
<div class="qas">
  <details class="qa">
    <summary>Why was my task or note blocked?</summary>
    <div><p>Task text and claim notes go through Azure AI Content Safety. Text flagged as harmful or offensive is blocked before it is saved, and you see why.</p></div>
  </details>
  <details class="qa">
    <summary>How does password recovery work?</summary>
    <div><p>Use <Link href="/forgot-password" class="link">forgot password</Link>. Appwrite, which runs accounts, sends the reset link.</p></div>
  </details>
  <details class="qa">
    <summary>Can other apps read the task list?</summary>
    <div><p>Yes. <code>GET /api/tasks</code> returns the open tasks as JSON, no key needed. See <Link href="/docs/api" class="link">the API page</Link>.</p></div>
  </details>
</div>

<style>
  .h-m {
    margin: 2rem 0 0.5rem;
  }
  .qas {
    margin-bottom: 1rem;
  }
</style>
