<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
</script>

<Seo title="Docs | MicroMatch" description="Guides for volunteers and nonprofits on MicroMatch: claiming tasks, sending proof, verification, posting tasks, reviewing claims and designing badges." />

<header class="page-head">
  <h1 class="display h-xl" tabindex="-1">Docs</h1>
  <p class="lede">How each part of MicroMatch works, step by step. For developers, the <Link href="/docs/api" class="link">API page</Link> has the endpoints.</p>
</header>

<nav class="toc" aria-label="On this page">
  <a class="link" href="#volunteers">Volunteer guide</a>
  <a class="link" href="#nonprofits">Nonprofit guide</a>
  <a class="link" href="#badges">Badges and patches</a>
</nav>

<section class="part" id="volunteers" aria-labelledby="v">
  <h2 id="v">Volunteer guide</h2>
  <ol class="ticks">
    <li>Open the <Link href="/tasks" class="link">task feed</Link>. Search it, filter it to 15, 20 or 30 minutes, or pick a tag.</li>
    <li>Open a task to read the full brief, the estimate, the tags and who posted it.</li>
    <li>Choose "Claim this task". You will be asked to sign in if you have not.</li>
    <li>Do the work, then send a link to it and a note. Notes go through content safety.</li>
    <li>Your claim waits in your block until a person at the nonprofit approves or rejects it.</li>
  </ol>
</section>

<section class="part" id="nonprofits" aria-labelledby="n">
  <h2 id="n">Nonprofit guide</h2>
  <h3 class="h-s">Verification</h3>
  <ol class="ticks">
    <li>Sign up as a nonprofit, or switch your role on your profile.</li>
    <li>Fill in the verification card: organization name, country and tax or charity registration number. Outside the US, upload a registration document.</li>
    <li>An admin reviews it. US EINs are checked against the ProPublica Nonprofit Explorer.</li>
    <li>You get an email with the decision. Once approved, your tasks appear in the feed with the verified mark.</li>
  </ol>
  <h3 class="h-s">Posting tasks</h3>
  <p>Give each task one clear outcome: what to make, what done looks like, and anything the volunteer needs. Estimate honestly between 5 and 30 minutes. Add tags, and a deadline or volunteer cap if you need them.</p>
  <h3 class="h-s">Reviewing claims</h3>
  <p>Claims on your tasks wait in your reviews with the volunteer's link and note. Approve to award your badges, or reject if the work is not what you needed.</p>
</section>

<section class="part" id="badges" aria-labelledby="b">
  <h2 id="b">Badges and patches</h2>
  <p>Each nonprofit designs its badges: a name, a color and an icon. A badge has one of two rules: it is awarded for any completed task you posted, or for one task you choose. When you approve a claim, every badge whose rule matches is awarded, and a volunteer never gets the same badge twice.</p>
  <p>The patch sewn into the quilt for an approved claim wears that badge's color and icon: the badge for that exact task first, otherwise your any-task badge. With no badge designed, the patch is plain, undyed cloth.</p>
</section>

<style>
  .toc {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.25rem;
    margin-bottom: 1rem;
    font-weight: 560;
  }
  .h-s {
    font-family: var(--f-display);
    font-weight: 680;
    font-size: 1.05rem;
    margin-top: 0.5rem;
  }
</style>
