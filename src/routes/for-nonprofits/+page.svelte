<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import PatchDesigner from '$lib/components/PatchDesigner.svelte';
  import type { PatchIcon } from '$lib/quilt/icons';

  let color = $state('#5E7D4F');
  let icon = $state<PatchIcon>('leaf');
</script>

<Seo
  title="For nonprofits | MicroMatch"
  description="Post the small jobs on your list as 5 to 30 minute tasks. A person on your team approves each one, and volunteers earn the patch you design."
/>

<header class="page-head">
  <h1 class="display h-xl" tabindex="-1">For nonprofits</h1>
  <p class="lede">Post the small jobs that sit at the bottom of your list. A volunteer does one in 5 to 30 minutes, and someone on your team checks it.</p>
</header>

<section class="part" aria-labelledby="design">
  <h2 id="design">Design the patch your volunteers earn</h2>
  <p>Every nonprofit designs its own patches: a name, a fabric and an embroidered icon. Each one is awarded for any task you post, or for one task you pick. Try it here; nothing is saved.</p>
  <PatchDesigner bind:color bind:icon label="Your patch" idPrefix="demo" />
</section>

<section class="part" aria-labelledby="verify">
  <h2 id="verify">Get verified first</h2>
  <ul class="ticks">
    <li>Send your organization's name, country and tax or charity registration number.</li>
    <li>For a US EIN, an admin checks it against the ProPublica Nonprofit Explorer. Outside the US, upload a registration document (PDF, PNG or JPEG) for an admin to review.</li>
    <li>You get an email when an admin approves or rejects your application, with the reason if it was rejected.</li>
    <li>Until you are verified, your tasks stay out of the public feed. Once you are, every task you have posted shows the verified mark.</li>
  </ul>
</section>

<section class="part" aria-labelledby="post">
  <h2 id="post">Post a task</h2>
  <p>A title, a one-line summary, the full brief and an honest estimate from 5 to 30 minutes. Add tags so people can find it, and a deadline or a cap on how many volunteers you need if that matters. Task text goes through Azure AI Content Safety before it is saved.</p>
</section>

<section class="part" aria-labelledby="review">
  <h2 id="review">Review what comes back</h2>
  <p>Each claim arrives with a link to the work and the volunteer's note. Approve it and your patch is awarded and sewn into the quilt; reject it if it is not what you needed. Nothing is approved automatically.</p>
  <p class="muted small">MicroMatch is free and non-commercial. There is nothing to pay.</p>
  <div class="ctas">
    <Link href="/signup?role=ngo" class="patch-btn">Join as a nonprofit</Link>
    <Link href="/docs#nonprofits" class="patch-btn patch-btn--plain">Read the nonprofit guide</Link>
  </div>
</section>
