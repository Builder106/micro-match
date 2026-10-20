<script lang="ts">
  // The quilt label: quilters sew a label on the back corner with who made it and when.
  // Here it carries the small print: legal pages, the source code, the theme and the language.
  // The contents page is one tap away in the corner tag, so it is not repeated here.
  import Link from '../Link.svelte';
  import ThemeToggle from '../ThemeToggle.svelte';
  import LanguagePicker from '../LanguagePicker.svelte';
  import { block } from '$lib/quilt/world';
  import * as m from '$lib/paraglide/messages.js';

  let { open = false }: { open?: boolean } = $props();
  const def = block('label');
</script>

<div
  class="block block--label"
  class:is-open={open}
  data-block="label"
  style:--c={def.col + 1}
  style:--r={def.row + 1}
  style:--w={def.w}
  style:--h={def.h}
  style:--o={def.phone}
>
  <div class="block__face">
    <div class="label__tag">
      <h2 class="label__title">{m.label_title()}</h2>
      <p>{m.label_body({ year: new Date().getFullYear() })}</p>
      <ul>
        <li><Link href="/privacy">{m.footer_link_privacy()}</Link></li>
        <li><Link href="/terms">{m.footer_link_terms()}</Link></li>
        <li><Link href="/cookies">{m.footer_link_cookies()}</Link></li>
        <li><a href="https://github.com/Builder106/micro-match" rel="noopener">GitHub</a></li>
        <li><ThemeToggle /></li>
        <li><LanguagePicker /></li>
      </ul>
    </div>
  </div>
  <div class="block__hole" aria-hidden="true"></div>
</div>
