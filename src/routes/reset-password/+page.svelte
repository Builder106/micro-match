<script lang="ts">
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import * as m from '$lib/paraglide/messages.js';

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
    if (password.length < 8) return void (error = m.reset_short());
    if (password !== confirm) return void (error = m.reset_mismatch());
    error = '';
    submitting = true;
    try {
      const client = await import('$lib/appwrite.client');
      await client.updateRecovery(userId, secret, password);
      done = true;
    } catch {
      error = m.reset_expired();
    } finally {
      submitting = false;
    }
  }
</script>

<Seo title={m.reset_meta_title()} description={m.reset_meta_description()} noindex />

<div class="auth">
  <h1 class="display h-l" tabindex="-1">{m.reset_title()}</h1>
  {#if !linkOk}
    <p class="notice notice--error" role="alert">{m.reset_bad_link()}</p>
    <Link href="/forgot-password" class="patch-btn patch-btn--plain">{m.reset_new_link()}</Link>
  {:else if done}
    <p class="notice notice--ok" role="status">{m.reset_done()}</p>
    <Link href="/login" class="patch-btn">{m.menu_sign_in()}</Link>
  {:else}
    <form class="auth__form" onsubmit={reset}>
      <div class="field">
        <label for="pw">{m.reset_new()}</label>
        <input id="pw" class="input" type="password" autocomplete="new-password" minlength="8" required bind:value={password} />
      </div>
      <div class="field">
        <label for="pw2">{m.reset_again()}</label>
        <input id="pw2" class="input" type="password" autocomplete="new-password" required bind:value={confirm} />
      </div>
      {#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}
      <button class="patch-btn" type="submit" disabled={submitting}>{submitting ? m.status_saving() : m.reset_submit()}</button>
    </form>
  {/if}
</div>
