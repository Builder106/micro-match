<script lang="ts">
  // Two small tags stitched to the corners of the window: where you are on the quilt, and the
  // ways out (the contents page and your own block). They replace a navigation bar.
  import Link from '../Link.svelte';
  import * as m from '$lib/paraglide/messages.js';

  let { where, signedIn, role, hasPanel }: { where: string; signedIn: boolean; role: string; hasPanel: boolean } = $props();
</script>

<nav class="tags" aria-label={m.tags_label()}>
  <div class="tag tag--place">
    <Link href="/" class="tag__home" aria-label={m.menu_home_label()}>
      <img src="/logo.png" alt="" width="30" height="30" />
      <span class="tag__brand">MicroMatch</span>
    </Link>
    <span class="tag__where" aria-live="polite">{hasPanel ? where : m.tag_on_quilt()}</span>
  </div>
  <div class="tag tag--ways">
    <Link href="/contents" class="tag__link">{m.tag_contents()}</Link>
    {#if signedIn}
      <Link href="/dashboard" class="tag__link tag__link--strong">{role === 'ngo' ? m.menu_reviews() : m.menu_my_block()}</Link>
    {:else}
      <Link href="/login" class="tag__link tag__link--strong">{m.menu_sign_in()}</Link>
    {/if}
  </div>
</nav>
