<script lang="ts">
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import Rich from '$lib/components/Rich.svelte';
  import PatchPreview from '$lib/components/PatchPreview.svelte';
  import { go } from '$lib/go';
  import type { Locale } from '$lib/locale';
  import * as m from '$lib/paraglide/messages.js';

  const locale = $derived((page.data.locale as Locale | undefined) ?? 'en');
  const fromQuery = page.url.searchParams.get('role');
  const oauthError = $derived(page.url.searchParams.get('error'));

  let role = $state<'volunteer' | 'ngo' | null>(fromQuery === 'ngo' || fromQuery === 'volunteer' ? fromQuery : null);
  let firstName = $state('');
  let lastName = $state('');
  let email = $state('');
  let password = $state('');
  let error = $state('');
  let submitting = $state(false);

  async function google() {
    const client = await import('$lib/appwrite.client');
    client.signInWithGoogle({ role: role ?? undefined, returnTo: 'signup' });
  }

  async function create(e: SubmitEvent) {
    e.preventDefault();
    if (!role) return;
    if (password.length < 8) {
      error = m.signup_short_password();
      return;
    }
    error = '';
    submitting = true;
    try {
      const client = await import('$lib/appwrite.client');
      await client.signUpEmail(email, password, `${firstName} ${lastName}`.trim() || undefined, role);
      await client.refreshSessionCookie();
      await client.assignTeamForCurrentRole();
      await go(role === 'ngo' ? '/org' : '/dashboard', locale, { invalidateAll: true });
    } catch {
      error = m.signup_error();
    } finally {
      submitting = false;
    }
  }
</script>

<Seo title={m.signup_meta_title()} description={m.signup_meta_description()} />

<div class="auth">
  {#if !role}
    <h1 class="display h-l" tabindex="-1">{m.signup_title()}</h1>
    <p class="muted">{m.signup_lede()}</p>
    <div class="roles">
      <button type="button" class="role" onclick={() => (role = 'volunteer')}>
        <PatchPreview color="#F2B84B" icon="heart" size="3.6rem" />
        <span><strong>{m.signup_volunteer_title()}</strong><span>{m.signup_volunteer_body()}</span></span>
      </button>
      <button type="button" class="role" onclick={() => (role = 'ngo')}>
        <PatchPreview color="#5E7D4F" icon="house" size="3.6rem" />
        <span><strong>{m.hero_nonprofit()}</strong><span>{m.signup_ngo_body()}</span></span>
      </button>
    </div>
  {:else}
    <button type="button" class="link small back" onclick={() => (role = null)}>{m.signup_back()}</button>
    <h1 class="display h-l" tabindex="-1">{role === 'ngo' ? m.cta_join_nonprofit() : m.cta_join_volunteer()}</h1>
    <form class="auth__form" onsubmit={create}>
      <div class="pair">
        <div class="field">
          <label for="first">{m.field_first_name()}</label>
          <input id="first" class="input" autocomplete="given-name" bind:value={firstName} />
        </div>
        <div class="field">
          <label for="last">{m.field_last_name()}</label>
          <input id="last" class="input" autocomplete="family-name" bind:value={lastName} />
        </div>
      </div>
      <div class="field">
        <label for="email">{m.field_email()}</label>
        <input id="email" class="input" type="email" autocomplete="email" required bind:value={email} />
      </div>
      <div class="field">
        <label for="password">{m.field_password()}</label>
        <input id="password" class="input" type="password" autocomplete="new-password" minlength="8" required bind:value={password} />
        <span class="hint">{m.signup_password_hint()}</span>
      </div>
      {#if role === 'ngo'}<p class="small muted">{m.signup_ngo_next()}</p>{/if}
      {#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}
      <button class="patch-btn" type="submit" disabled={submitting}>{submitting ? m.signup_submitting() : m.signup_submit()}</button>
    </form>
  {/if}
  {#if oauthError === 'oauth'}<p class="notice notice--error" role="alert">{m.login_google_error()}</p>{/if}
  <div class="auth__or"><span>{m.login_or()}</span></div>
  <button type="button" class="patch-btn patch-btn--plain" onclick={google}>
    <img src="/google-signin-icon.png" width="28" height="28" alt="" />
    {m.login_google()}
  </button>
  <p class="small muted"><Rich text={m.signup_agree()} links={{ terms: '/terms', privacy: '/privacy' }} /></p>
  <p class="small"><Rich text={m.signup_have_account()} links={{ login: '/login' }} /></p>
</div>

<style>
  .roles {
    display: grid;
    gap: 0.75rem;
  }
  .role {
    display: flex;
    gap: 1rem;
    align-items: center;
    padding: 1rem 1.1rem;
    text-align: left;
    border-radius: var(--radius);
    box-shadow: inset 0 0 0 1.5px var(--c-line);
    transition: box-shadow 0.3s, translate 0.35s cubic-bezier(0.16, 1, 0.3, 1), rotate 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .role > span {
    display: grid;
    gap: 0.2rem;
    font-size: 0.92rem;
    color: var(--c-muted);
  }
  .role strong {
    font-family: var(--f-display);
    font-size: 1.15rem;
    color: var(--c-fg);
  }
  @media (hover: hover) {
    .role:hover {
      box-shadow: inset 0 0 0 1.5px var(--c-fg);
      translate: 0 -2px;
      rotate: -0.4deg;
    }
  }
  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  .back {
    justify-self: start;
  }
</style>
