<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import * as m from '$lib/paraglide/messages.js';
</script>

<Seo title={m.contact_meta_title()} description={m.contact_meta_description()} />

<header class="page-head">
  <h1 class="display h-xl" tabindex="-1">{m.contact_title()}</h1>
  <p class="lede">{m.contact_lede()}</p>
</header>

<ul class="ways">
  <li class="part">
    <h2>{m.contact_privacy_title()}</h2>
    <p>{m.contact_privacy_body()}</p>
    <a class="patch-btn patch-btn--plain" href="mailto:privacy@micromatch.app">privacy@micromatch.app</a>
  </li>
  <li class="part">
    <h2>{m.contact_legal_title()}</h2>
    <p>{m.contact_legal_body()}</p>
    <a class="patch-btn patch-btn--plain" href="mailto:legal@micromatch.app">legal@micromatch.app</a>
  </li>
  <li class="part">
    <h2>{m.contact_bugs_title()}</h2>
    <p>{m.contact_bugs_body()}</p>
    <a class="patch-btn patch-btn--plain" href="https://github.com/Builder106/micro-match/issues" rel="noopener">{m.contact_bugs_cta()}</a>
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
