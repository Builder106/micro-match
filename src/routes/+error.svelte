<!-- eslint-disable svelte/no-navigation-without-resolve -->
<script lang="ts">
  import Icon from '@iconify/svelte';
  import { page } from '$app/state';
  import { localizedHref, type Locale } from '$lib/locale';
  import * as m from '$lib/paraglide/messages.js';

  const locale = $derived((page.data?.locale as Locale | undefined) ?? 'en');
  const homeHref = $derived(localizedHref('/', locale));
  const tasksHref = $derived(localizedHref('/tasks', locale));
</script>

<svelte:head>
  <title>{page.status} · MicroMatch</title>
  <meta name="description" content={m.not_found_body()} />
</svelte:head>

<main class="error-page">
  <div class="error-orbit error-orbit-coral"></div>
  <div class="error-orbit error-orbit-blue"></div>
  <section class="error-card" aria-labelledby="error-title">
    <div class="error-mark" aria-hidden="true">
      <Icon icon="lucide:compass" width="32" height="32" />
    </div>
    <p class="error-code">{m.error_404()}</p>
    <h1 id="error-title">{m.not_found_title()}</h1>
    <p class="error-body">{m.not_found_body()}</p>
    <div class="error-actions">
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a class="btn-coral btn-lg" href={homeHref}>{m.back_home()}</a>
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a class="btn-outline btn-lg" href={tasksHref}>{m.browse_tasks()}</a>
    </div>
  </section>
</main>

<style>
  .error-page {
    position: relative;
    min-height: min(760px, calc(100vh - 88px));
    display: grid;
    place-items: center;
    overflow: hidden;
    padding: 48px 24px;
    background: var(--color-background);
  }

  .error-orbit {
    position: absolute;
    width: 420px;
    height: 420px;
    border-radius: 50%;
    filter: blur(100px);
    pointer-events: none;
    opacity: 0.38;
  }

  .error-orbit-coral { top: -160px; right: -80px; background: #fecdd3; }
  .error-orbit-blue { bottom: -180px; left: -100px; background: #bfdbfe; }

  .error-card {
    position: relative;
    z-index: 1;
    width: min(100%, 620px);
    padding: clamp(32px, 6vw, 64px);
    text-align: center;
    background: color-mix(in srgb, white 88%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-outline) 55%, transparent);
    border-radius: 28px;
    box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
  }

  .error-mark {
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    margin: 0 auto 24px;
    color: var(--color-primary-readable);
    background: #ffe4e6;
    border-radius: 22px;
  }

  .error-code {
    margin: 0 0 8px;
    color: var(--color-primary-readable);
    font-size: 0.85rem;
    font-weight: 800;
    letter-spacing: 0.18em;
  }

  h1 { margin: 0; font-size: clamp(2rem, 4vw, 3.2rem); }
  .error-body { max-width: 440px; margin: 16px auto 0; color: var(--color-text-secondary); font-size: 1.05rem; line-height: 1.65; }
  .error-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 32px; }

  @media (max-width: 520px) {
    .error-page { min-height: calc(100vh - 64px); padding: 24px 16px; }
    .error-actions > a { width: 100%; }
  }
</style>
