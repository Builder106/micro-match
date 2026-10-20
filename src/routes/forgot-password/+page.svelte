<script lang="ts">
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import { hrefFor } from '$lib/site';
  import type { Locale } from '$lib/locale';
  import * as m from '$lib/paraglide/messages.js';

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
      error = m.forgot_error();
    } finally {
      submitting = false;
    }
  }
</script>

<Seo title={m.forgot_meta_title()} description={m.forgot_meta_description()} />

<div class="auth">
  <h1 class="display h-l" tabindex="-1">{m.login_forgot()}</h1>
  {#if sent}
    <p class="notice notice--ok" role="status">{m.forgot_sent({ email })}</p>
    <Link href="/login" class="patch-btn patch-btn--plain">{m.forgot_back()}</Link>
  {:else}
    <p class="muted">{m.forgot_lede()}</p>
    <form class="auth__form" onsubmit={send}>
      <div class="field">
        <label for="email">{m.field_email()}</label>
        <input id="email" class="input" type="email" autocomplete="email" required bind:value={email} />
      </div>
      {#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}
      <button class="patch-btn" type="submit" disabled={submitting}>{submitting ? m.status_sending() : m.forgot_submit()}</button>
    </form>
    <p class="small"><Link href="/login" class="link">{m.forgot_back()}</Link></p>
  {/if}
</div>
