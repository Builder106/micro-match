<script lang="ts">
  // Home is the quilt itself, which the root layout draws. Its heading lives in the title
  // block at the quilt's center, so this page only describes itself to search engines.
  import Seo from '$lib/components/Seo.svelte';
  import * as m from '$lib/paraglide/messages.js';
</script>

<Seo
  title={m.home_meta_title_q()}
  description={m.home_meta_description_q()}
  jsonLd={{
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MicroMatch',
    url: 'https://trymicromatch.com',
    logo: 'https://trymicromatch.com/logo.png',
    description: m.home_meta_description_q()
  }}
/>
