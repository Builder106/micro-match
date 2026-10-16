<script lang="ts">
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import { hrefFor } from '$lib/site';
  import type { Locale } from '$lib/locale';

  const locale = $derived((page.data.locale as Locale | undefined) ?? 'en');
  let email = $state('');
  let sent = $state(false);
  let error = $state('');
  let submitting = $state(false);

  async function send(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    submitting = true;
    try {
      const client = await import('$lib/appwrite.client');
      await client.createRecovery(email, `${location.origin}${hrefFor('/reset-password', locale)}`);
      sent = true;
    } catch {
      error = 'We could not send a reset email. Check the address and try again.';
    } finally {
      submitting = false;
    }
  }
</script>

<Seo title="Forgot password | MicroMatch" description="Forgot your MicroMatch password? Enter your email and get a link to choose a new one." />

<div class="auth">
  <h1 class="display h-l" tabindex="-1">Forgot your password?</h1>
  {#if sent}
    <p class="notice notice--ok" role="status">If an account uses {email}, a reset link is on its way. It comes from Appwrite, which runs MicroMatch accounts.</p>
    <Link href="/login" class="patch-btn patch-btn--plain">Back to sign in</Link>
  {:else}
    <p class="muted">Enter your email and we will send you a link to choose a new one.</p>
    <form class="auth__form" onsubmit={send}>
      <div class="field">
        <label for="email">Email</label>
        <input id="email" class="input" type="email" autocomplete="email" required bind:value={email} />
      </div>
      {#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}
      <button class="patch-btn" type="submit" disabled={submitting}>{submitting ? 'Sending...' : 'Send reset link'}</button>
    </form>
    <p class="small"><Link href="/login" class="link">Back to sign in</Link></p>
  {/if}
</div>
