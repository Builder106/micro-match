<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
</script>

<Seo
  title="About | MicroMatch"
  description="MicroMatch is a free, non-commercial student project that turns small nonprofit jobs into 5 to 30 minute tasks, launching first at Wesleyan."
/>

<header class="page-head">
  <h1 class="display h-xl" tabindex="-1">About</h1>
  <p class="lede">MicroMatch is a free, non-commercial student project. It launches first at Wesleyan.</p>
</header>

<section class="part" aria-labelledby="why">
  <h2 id="why">Why small tasks</h2>
  <p>Most volunteering asks for a Saturday morning or a semester. Plenty of people have fifteen minutes instead, and plenty of nonprofits have jobs that size waiting: a flyer to translate, alt text to check, photos to tag. MicroMatch puts the two together.</p>
</section>

<section class="part" aria-labelledby="person">
  <h2 id="person">Why a person checks every one</h2>
  <p>Directories hand you an email address and disappear. Here the work happens on the site: you claim a task, send your work, and someone at the nonprofit reads it. That review is what makes a patch mean something.</p>
</section>

<section class="part" aria-labelledby="quilt">
  <h2 id="quilt">Why a quilt</h2>
  <p>A quilt is many small pieces, cut by different hands, that only become warm once someone sews them together. Each approved task is one piece. The quilt on this site is built from those approvals and nothing else.</p>
</section>

<section class="part" aria-labelledby="runs">
  <h2 id="runs">What it runs on</h2>
  <ul class="ticks">
    <li>Hosting on Vercel. Accounts, data and files in Appwrite.</li>
    <li>Nonprofit checks against the ProPublica Nonprofit Explorer for US organizations.</li>
    <li>Azure AI Content Safety on task text and claim notes.</li>
    <li>A self-hosted LibreTranslate server for task text in other languages.</li>
  </ul>
  <p>The code is open under the MIT license on <a class="link" href="https://github.com/Builder106/micro-match" rel="noopener">GitHub</a>. See <Link href="/privacy" class="link">the privacy policy</Link> for what each service handles.</p>
</section>
