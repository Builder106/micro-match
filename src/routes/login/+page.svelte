<script lang="ts">
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import Rich from '$lib/components/Rich.svelte';
  import { go } from '$lib/go';
  import { safeNext } from '$lib/site';
  import type { Locale } from '$lib/locale';
  import * as m from '$lib/paraglide/messages.js';

  const locale = $derived((page.data.locale as Locale | undefined) ?? 'en');
  const next = $derived(safeNext(page.url.searchParams.get('next')));
  const oauthError = $derived(page.url.searchParams.get('error'));

  let email = $state('');
  let password = $state('');
  let error = $state('');
  let submitting = $state(false);

  async function signIn(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    submitting = true;
    try {
      const client = await import('$lib/appwrite.client');
      await client.signInEmail(email, password);
      await client.refreshSessionCookie();
      await go(next, locale, { invalidateAll: true });
    } catch {
      error = m.login_error();
    } finally {
      submitting = false;
    }
  }

  async function google() {
    const client = await import('$lib/appwrite.client');
    client.signInWithGoogle();
  }
</script>

<Seo title={m.login_meta_title()} description={m.login_meta_description()} />

<div class="auth">
  <h1 class="display h-l" tabindex="-1">{m.login_title()}</h1>
  <p class="muted">{m.login_lede()}</p>
  {#if oauthError}<p class="notice notice--error" role="alert">{m.login_google_error()}</p>{/if}

  <form class="auth__form" onsubmit={signIn}>
    <div class="field">
      <label for="email">{m.field_email()}</label>
      <input id="email" class="input" type="email" autocomplete="email" required bind:value={email} />
    </div>
    <div class="field">
      <label for="password">{m.field_password()}</label>
      <input id="password" class="input" type="password" autocomplete="current-password" required bind:value={password} />
      <Link href="/forgot-password" class="link small">{m.login_forgot()}</Link>
    </div>
    {#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}
    <button class="patch-btn" type="submit" disabled={submitting}>{submitting ? m.login_submitting() : m.menu_sign_in()}</button>
  </form>

  <div class="auth__or"><span>{m.login_or()}</span></div>
  <button type="button" class="patch-btn patch-btn--plain" onclick={google}>
    <img src="/google-signin-icon.png" width="28" height="28" alt="" />
    {m.login_google()}
  </button>
  <p class="small"><Rich text={m.login_new()} links={{ join: '/signup' }} /></p>
</div>
