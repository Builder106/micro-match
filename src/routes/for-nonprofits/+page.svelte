<script lang="ts">
  import Seo from '#lib/components/Seo.svelte';
  import Link from '#lib/components/Link.svelte';
  import PatchDesigner from '#lib/components/PatchDesigner.svelte';
  import type { PatchIcon } from '#lib/quilt/icons.js';
  import * as m from '#lib/paraglide/messages.js';

  let color = $state('#5E7D4F');
  let icon = $state<PatchIcon>('leaf');
</script>

<Seo title={m.nonprofits_meta_title()} description={m.nonprofits_meta_description()} />

<header class="page-head">
  <h1 class="display h-xl" tabindex="-1">{m.nonprofits_title()}</h1>
  <p class="lede">{m.nonprofits_lede()}</p>
</header>

<section class="part" aria-labelledby="design">
  <h2 id="design">{m.nonprofits_design_title()}</h2>
  <p>{m.nonprofits_design_body()}</p>
  <PatchDesigner bind:color bind:icon label={m.patch_your_patch()} idPrefix="demo" />
</section>

<section class="part" aria-labelledby="verify">
  <h2 id="verify">{m.nonprofits_verify_title()}</h2>
  <ul class="ticks">
    <li>{m.nonprofits_verify_1()}</li>
    <li>{m.nonprofits_verify_2()}</li>
    <li>{m.nonprofits_verify_3()}</li>
    <li>{m.nonprofits_verify_4()}</li>
  </ul>
</section>

<section class="part" aria-labelledby="post">
  <h2 id="post">{m.nonprofits_post_title()}</h2>
  <p>{m.nonprofits_post_body()}</p>
</section>

<section class="part" aria-labelledby="review">
  <h2 id="review">{m.nonprofits_review_title()}</h2>
  <p>{m.nonprofits_review_body()}</p>
  <p class="muted small">{m.nonprofits_free()}</p>
  <div class="ctas">
    <Link href="/signup?role=ngo" class="patch-btn">{m.cta_join_nonprofit()}</Link>
    <Link href="/docs#nonprofits" class="patch-btn patch-btn--plain">{m.nonprofits_read_guide()}</Link>
  </div>
</section>
