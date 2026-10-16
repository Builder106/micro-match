<script lang="ts">
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import { go } from '$lib/go';
  import { safeNext } from '$lib/site';
  import type { Locale } from '$lib/locale';

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
      error = 'That email and password do not match an account.';
    } finally {
      submitting = false;
    }
  }

  async function google() {
    const client = await import('$lib/appwrite.client');
    client.signInWithGoogle();
  }
</script>

<Seo title="Sign in | MicroMatch" description="Sign in to claim tasks, send your work and see your block of patches." />

<div class="auth">
  <h1 class="display h-l" tabindex="-1">Welcome back</h1>
  <p class="muted">Sign in to claim tasks and see your block.</p>
  {#if oauthError}<p class="notice notice--error" role="alert">Signing in with Google did not finish. Try again, or use your email.</p>{/if}

  <form class="auth__form" onsubmit={signIn}>
    <div class="field">
      <label for="email">Email</label>
      <input id="email" class="input" type="email" autocomplete="email" required bind:value={email} />
    </div>
    <div class="field">
      <label for="password">Password</label>
      <input id="password" class="input" type="password" autocomplete="current-password" required bind:value={password} />
      <Link href="/forgot-password" class="link small">Forgot your password?</Link>
    </div>
    {#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}
    <button class="patch-btn" type="submit" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in'}</button>
  </form>

  <div class="auth__or"><span>or</span></div>
  <button type="button" class="patch-btn patch-btn--plain" onclick={google}>Continue with Google</button>
  <p class="small">New here? <Link href="/signup" class="link">Join MicroMatch</Link></p>
</div>
