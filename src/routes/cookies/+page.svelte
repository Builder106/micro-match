<script lang="ts">
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import * as m from '$lib/paraglide/messages.js';
</script>

<Seo title={m.cookies_meta_title()} description={m.cookies_meta_description()} />

{#if page.data.locale && page.data.locale !== 'en'}<p class="notice">{m.legal_english_only()}</p>{/if}

<article class="legal" lang="en">
  <header class="page-head">
    <h1 class="display h-xl" tabindex="-1">Cookie Policy</h1>
    <p class="lede">MicroMatch uses cookies and similar technologies to keep you signed in and to remember preferences.</p>
  </header>
  <div class="prose">
    <p>
      Essential cookies support login sessions and security. Preference cookies remember choices such as theme (light or dark). We may use analytics cookies in some environments to understand usage patterns; you can control non-essential cookies through your browser settings where applicable.
    </p>
    <p>
      Blocking essential cookies may prevent parts of the site from working, including staying signed in. For questions, contact <a href="mailto:privacy@micromatch.app">privacy@micromatch.app</a>.
    </p>
  </div>
</article>
