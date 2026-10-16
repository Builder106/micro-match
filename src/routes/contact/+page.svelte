<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
</script>

<Seo title="Contact | MicroMatch" description="Two real inboxes for privacy and legal questions, and a public GitHub tracker for bugs and ideas." />

<header class="page-head">
  <h1 class="display h-xl" tabindex="-1">Contact</h1>
  <p class="lede">There is no contact form here, because there would be nobody behind it. These go to real places.</p>
</header>

<ul class="ways">
  <li class="part">
    <h2>Privacy and your data</h2>
    <p>Questions about your data, or a request to export or delete your account.</p>
    <a class="patch-btn patch-btn--plain" href="mailto:privacy@micromatch.app">privacy@micromatch.app</a>
  </li>
  <li class="part">
    <h2>Legal questions</h2>
    <p>Anything about the terms of service.</p>
    <a class="patch-btn patch-btn--plain" href="mailto:legal@micromatch.app">legal@micromatch.app</a>
  </li>
  <li class="part">
    <h2>Bugs and ideas</h2>
    <p>Open an issue with what you expected, what happened and the steps to get there.</p>
    <a class="patch-btn patch-btn--plain" href="https://github.com/Builder106/micro-match/issues" rel="noopener">Open a GitHub issue</a>
  </li>
</ul>

<style>
  .ways {
    list-style: none;
    padding: 0;
  }
  .ways h2 {
    font-family: var(--f-display);
    font-size: var(--t-m);
    font-weight: 700;
  }
  .ways .patch-btn {
    justify-self: start;
  }
</style>
