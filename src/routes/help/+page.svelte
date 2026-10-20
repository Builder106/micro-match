<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import Rich from '$lib/components/Rich.svelte';
  import * as m from '$lib/paraglide/messages.js';
</script>

<Seo title={m.help_meta_title()} description={m.help_meta_description()} />

<header class="page-head">
  <h1 class="display h-xl" tabindex="-1">{m.help_title()}</h1>
  <p class="lede"><Rich text={m.help_lede()} links={{ contact: '/contact' }} /></p>
</header>

<h2 class="h-m">{m.help_group_vol()}</h2>
<div class="qas">
  <details class="qa">
    <summary>{m.help_q_account()}</summary>
    <div><p>{m.help_a_account()}</p></div>
  </details>
  <details class="qa">
    <summary>{m.help_q_proof()}</summary>
    <div><p>{m.help_a_proof()}</p></div>
  </details>
  <details class="qa">
    <summary>{m.help_q_review()}</summary>
    <div><p>{m.help_a_review()}</p></div>
  </details>
  <details class="qa">
    <summary>{m.help_q_badges()}</summary>
    <div><p>{m.help_a_badges()}</p></div>
  </details>
</div>

<h2 class="h-m">{m.help_group_ngo()}</h2>
<div class="qas">
  <details class="qa">
    <summary>{m.help_q_propublica()}</summary>
    <div><p>{m.help_a_propublica()}</p></div>
  </details>
  <details class="qa">
    <summary>{m.help_q_mark()}</summary>
    <div><p>{m.help_a_mark()}</p></div>
  </details>
  <details class="qa">
    <summary>{m.help_q_rejected()}</summary>
    <div><p>{m.help_a_rejected()}</p></div>
  </details>
  <details class="qa">
    <summary>{m.help_q_switch()}</summary>
    <div><p>{m.help_a_switch()}</p></div>
  </details>
</div>

<h2 class="h-m">{m.help_group_else()}</h2>
<div class="qas">
  <details class="qa">
    <summary>{m.help_q_blocked()}</summary>
    <div><p>{m.help_a_blocked()}</p></div>
  </details>
  <details class="qa">
    <summary>{m.help_q_password()}</summary>
    <div><p><Rich text={m.help_a_password()} links={{ forgot: '/forgot-password', api: '/docs/api' }} /></p></div>
  </details>
  <details class="qa">
    <summary>{m.help_q_api()}</summary>
    <div><p><Rich text={m.help_a_api()} links={{ forgot: '/forgot-password', api: '/docs/api' }} /></p></div>
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
