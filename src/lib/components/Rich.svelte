<script lang="ts">
  // A translated sentence with its inline pieces: each tag in the message names a link in
  // `links`, or is <code> or <strong>. Internal links go through Link for the locale prefix.
  import Link from './Link.svelte';
  import { richParts } from '#lib/rich.js';

  let { text, links = {} }: { text: string; links?: Record<string, string> } = $props();
  const parts = $derived(richParts(text));
  const external = (href: string) => /^(https?:|mailto:)/.test(href);
</script>

{#each parts as part, i (i)}{#if part.tag === 'code'}<code>{part.text}</code>{:else if part.tag === 'strong'}<strong>{part.text}</strong>{:else if part.tag && links[part.tag] && external(links[part.tag])}<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external and mailto links -->
<a class="link" href={links[part.tag]} rel="noopener">{part.text}</a>{:else if part.tag && links[part.tag]}<Link href={links[part.tag]} class="link">{part.text}</Link>{:else}{part.text}{/if}{/each}
