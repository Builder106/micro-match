<script lang="ts">
  // Pins the opposite of the scheme on screen, or goes back to following the system when the
  // choice matches it. The pin lives in <meta name="color-scheme">; CSS picks the label to show.
  import * as m from '$lib/paraglide/messages.js';

  const KEY = 'mm-color-scheme';

  function meta(): HTMLMetaElement | null {
    return document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  }

  function toggle() {
    const el = meta();
    if (!el) return;
    const system = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const shown = el.content === 'light' || el.content === 'dark' ? el.content : system;
    const target = shown === 'dark' ? 'light' : 'dark';
    const pinned = target === system ? null : target;
    el.content = pinned ?? 'light dark';
    try {
      if (pinned) localStorage.setItem(KEY, pinned);
      else localStorage.removeItem(KEY);
    } catch {}
  }

  // Another tab changed the pin.
  $effect(() => {
    const sync = (e: StorageEvent) => {
      const el = meta();
      if (e.key !== KEY || !el) return;
      el.content = e.newValue ?? 'light dark';
    };
    addEventListener('storage', sync);
    return () => removeEventListener('storage', sync);
  });
</script>

<button type="button" class="theme-toggle" onclick={toggle}>
  <span class="theme-toggle__dark">{m.label_theme_dark()}</span>
  <span class="theme-toggle__light">{m.label_theme_light()}</span>
</button>
