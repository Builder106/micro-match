<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import Rich from '$lib/components/Rich.svelte';
  import * as m from '$lib/paraglide/messages.js';
</script>

<Seo title={m.about_meta_title()} description={m.about_meta_description()} />

<header class="page-head">
  <h1 class="display h-xl" tabindex="-1">{m.about_title()}</h1>
  <p class="lede">{m.about_lede()}</p>
</header>

<section class="part" aria-labelledby="why">
  <h2 id="why">{m.about_why_title()}</h2>
  <p>{m.about_why_body()}</p>
</section>

<section class="part" aria-labelledby="person">
  <h2 id="person">{m.about_person_title()}</h2>
  <p>{m.about_person_body()}</p>
</section>

<section class="part" aria-labelledby="quilt">
  <h2 id="quilt">{m.about_quilt_title()}</h2>
  <p>{m.about_quilt_body()}</p>
</section>

<section class="part" aria-labelledby="runs">
  <h2 id="runs">{m.about_runs_title()}</h2>
  <ul class="ticks">
    <li>{m.about_runs_hosting()}</li>
    <li>{m.about_runs_propublica()}</li>
    <li>{m.about_runs_safety()}</li>
    <li>{m.about_runs_translate()}</li>
  </ul>
  <p><Rich text={m.about_runs_code()} links={{ github: 'https://github.com/Builder106/micro-match', privacy: '/privacy' }} /></p>
</section>
