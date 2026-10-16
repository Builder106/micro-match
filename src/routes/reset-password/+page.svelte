<script lang="ts">
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';

  const userId = page.url.searchParams.get('userId') ?? '';
  const secret = page.url.searchParams.get('secret') ?? '';
  const linkOk = Boolean(userId && secret);

  let password = $state('');
  let confirm = $state('');
  let done = $state(false);
  let error = $state('');
  let submitting = $state(false);

  async function reset(e: SubmitEvent) {
    e.preventDefault();
    if (password.length < 8) return void (error = 'Use at least 8 characters.');
    if (password !== confirm) return void (error = 'The two passwords do not match.');
    error = '';
    submitting = true;
    try {
      const client = await import('$lib/appwrite.client');
      await client.updateRecovery(userId, secret, password);
      done = true;
    } catch {
      error = 'That link has expired or was already used. Ask for a new one.';
    } finally {
      submitting = false;
    }
  }
</script>

<Seo title="Choose a new password | MicroMatch" description="Choose a new password for your MicroMatch account." noindex />

<div class="auth">
  <h1 class="display h-l" tabindex="-1">Choose a new password</h1>
  {#if !linkOk}
    <p class="notice notice--error" role="alert">This reset link is missing part of its address. Ask for a new one.</p>
    <Link href="/forgot-password" class="patch-btn patch-btn--plain">Get a new link</Link>
  {:else if done}
    <p class="notice notice--ok" role="status">Your password is changed.</p>
    <Link href="/login" class="patch-btn">Sign in</Link>
  {:else}
    <form class="auth__form" onsubmit={reset}>
      <div class="field">
        <label for="pw">New password</label>
        <input id="pw" class="input" type="password" autocomplete="new-password" minlength="8" required bind:value={password} />
      </div>
      <div class="field">
        <label for="pw2">The same again</label>
        <input id="pw2" class="input" type="password" autocomplete="new-password" required bind:value={confirm} />
      </div>
      {#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}
      <button class="patch-btn" type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save password'}</button>
    </form>
  {/if}
</div>
