<script lang="ts">
  import Seo from '#lib/components/Seo.svelte';
  import Rich from '#lib/components/Rich.svelte';
  import * as m from '#lib/paraglide/messages.js';
</script>

<Seo title={m.docs_meta_title()} description={m.docs_meta_description()} />

<header class="page-head">
  <h1 class="display h-xl" tabindex="-1">{m.docs_title()}</h1>
  <p class="lede"><Rich text={m.docs_lede()} links={{ api: '/docs/api' }} /></p>
</header>

<nav class="toc" aria-label={m.docs_toc_label()}>
  <a class="link" href="#volunteers">{m.docs_vol_title()}</a>
  <a class="link" href="#nonprofits">{m.docs_ngo_title()}</a>
  <a class="link" href="#badges">{m.docs_badges_title()}</a>
</nav>

<section class="part" id="volunteers" aria-labelledby="v">
  <h2 id="v">{m.docs_vol_title()}</h2>
  <ol class="ticks">
    <li><Rich text={m.docs_vol_1()} links={{ feed: '/tasks' }} /></li>
    <li>{m.docs_vol_2()}</li>
    <li>{m.docs_vol_3()}</li>
    <li>{m.docs_vol_4()}</li>
    <li>{m.docs_vol_5()}</li>
  </ol>
</section>

<section class="part" id="nonprofits" aria-labelledby="n">
  <h2 id="n">{m.docs_ngo_title()}</h2>
  <h3 class="h-s">{m.docs_ngo_verify_title()}</h3>
  <ol class="ticks">
    <li>{m.docs_ngo_verify_1()}</li>
    <li>{m.docs_ngo_verify_2()}</li>
    <li>{m.docs_ngo_verify_3()}</li>
    <li>{m.docs_ngo_verify_4()}</li>
  </ol>
  <h3 class="h-s">{m.docs_ngo_post_title()}</h3>
  <p>{m.docs_ngo_post_body()}</p>
  <h3 class="h-s">{m.docs_ngo_review_title()}</h3>
  <p>{m.docs_ngo_review_body()}</p>
</section>

<section class="part" id="badges" aria-labelledby="b">
  <h2 id="b">{m.docs_badges_title()}</h2>
  <p>{m.docs_badges_1()}</p>
  <p>{m.docs_badges_2()}</p>
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
