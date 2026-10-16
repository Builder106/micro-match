<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import Scissors from '$lib/components/art/Scissors.svelte';
  import Swatch from '$lib/components/art/Swatch.svelte';
  import Pin from '$lib/components/art/Pin.svelte';
  import Needle from '$lib/components/art/Needle.svelte';
</script>

<Seo
  title="How a patch is made | MicroMatch"
  description="Four steps from a posted task to a patch sewn into the quilt: a nonprofit posts it, you pick it up, you pin your proof, and a person approves it."
/>

<header class="page-head">
  <h1 class="display h-xl" tabindex="-1">How a patch is made</h1>
  <p class="lede">Every patch on the quilt went through the same four steps, and a person checked it at the last one.</p>
</header>

<ol class="steps">
  <li class="step">
    <Scissors class="step__art" />
    <div>
      <h2 class="h-m">A nonprofit cuts the cloth</h2>
      <p>
        A verified nonprofit posts a task: a title, a short summary, the full brief and an honest estimate between 5 and 30
        minutes. It can add tags, a deadline and a cap on how many volunteers it needs. Task text goes through Azure AI
        Content Safety before it is saved.
      </p>
      <p class="muted small">Only tasks from verified nonprofits appear in the feed.</p>
    </div>
  </li>
  <li class="step">
    <Swatch class="step__art" />
    <div>
      <h2 class="h-m">You pick a piece up</h2>
      <p>
        Browse the <Link href="/tasks" class="link">task feed</Link> without an account. Search it, filter it to 15, 20 or 30
        minutes, or narrow it by tag. When one fits the time you have, open it and claim it. Claiming needs an account.
      </p>
    </div>
  </li>
  <li class="step">
    <Pin class="step__art step__art--pin" />
    <div>
      <h2 class="h-m">You pin your work to it</h2>
      <p>
        Do the task, then send your proof: a link to what you made (a document, a shared folder, a pull request) and a note
        about how you did it. Your claim is pinned, not sewn: it waits for a person at the nonprofit.
      </p>
    </div>
  </li>
  <li class="step">
    <Needle class="step__art" />
    <div>
      <h2 class="h-m">A person sews it in</h2>
      <p>
        Someone at the nonprofit reads your proof and approves the claim, or rejects it if it is not what they needed.
        Approval awards the badges that nonprofit designed, for any task it posted or for that one task, and your patch is
        sewn into the community block in their colors.
      </p>
      <p class="muted small">No points, levels or streaks. A patch means one finished task, checked by a person.</p>
    </div>
  </li>
</ol>

<div class="next">
  <Link href="/tasks" class="patch-btn">Find a task</Link>
  <Link href="/for-nonprofits" class="patch-btn patch-btn--plain">Post a task</Link>
</div>

<style>
  .page-head {
    display: grid;
    gap: 1rem;
    max-width: 38rem;
    margin-bottom: clamp(2rem, 4vw, 3.5rem);
  }
  .steps {
    list-style: none;
    padding: 0;
    display: grid;
    gap: clamp(2rem, 4vw, 3rem);
    position: relative;
  }
  .steps::before {
    content: '';
    position: absolute;
    left: 2.6rem;
    top: 3rem;
    bottom: 3rem;
    width: 2px;
    background: linear-gradient(180deg, var(--c-accent) 55%, transparent 0) 0 0 / 2px 12px repeat-y;
  }
  .step {
    position: relative;
    display: grid;
    grid-template-columns: 5.2rem 1fr;
    gap: clamp(1rem, 2.4vw, 2rem);
    align-items: start;
  }
  .step > div {
    display: grid;
    gap: 0.6rem;
    max-width: 36rem;
  }
  .step :global(.step__art) {
    width: 5.2rem;
    height: 5.2rem;
    padding: 0.75rem;
    background: var(--c-paper);
    border-radius: var(--radius);
    box-shadow: inset 0 0 0 1.5px var(--c-fg);
    position: relative;
  }
  .step :global(.step__art--pin) {
    padding: 1.2rem;
  }
  .next {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: clamp(2.5rem, 5vw, 4rem);
  }
  @media (max-width: 599px) {
    .step {
      grid-template-columns: 3.6rem 1fr;
    }
    .step :global(.step__art) {
      width: 3.6rem;
      height: 3.6rem;
      padding: 0.5rem;
    }
    .steps::before {
      left: 1.8rem;
    }
  }
</style>
