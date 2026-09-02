<script lang="ts">
  import Icon from '@iconify/svelte';
  import { account } from '$lib/appwrite.client';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import AuthBrandPanel from '$lib/components/AuthBrandPanel.svelte';
  import { resolve } from '$app/paths';

  let password = '';
  let passwordConfirm = '';
  let error: string | null = null;
  let submitting = false;
  let success = false;
  let userId = '';
  let secret = '';
  let linkInvalid = false;

  onMount(() => {
    const params = $page.url.searchParams;
    userId = params.get('userId') ?? '';
    secret = params.get('secret') ?? '';
    if (!userId || !secret) {
      linkInvalid = true;
      error = 'This reset link is missing parameters. Request a new one from the forgot-password page.';
    }
  });

  async function handleResetPassword(e: Event) {
    e.preventDefault();
    if (password !== passwordConfirm) {
      error = 'Passwords do not match.';
      return;
    }
    if (password.length < 8) {
      error = 'Password must be at least 8 characters.';
      return;
    }
    error = null;
    submitting = true;
    success = false;
    try {
      await account.updateRecovery(userId, secret, password);
      success = true;
    } catch {
      error = 'Failed to reset password. The link may have expired — request a new one.';
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head><title>Reset password · MicroMatch</title></svelte:head>

<div class="auth-shell">
  <div class="left-panel">
    <AuthBrandPanel animation="/animations/confetti.json" />
  </div>

  <main class="right-panel">
    <div class="mobile-stage">
      <AuthBrandPanel compact animation="/animations/confetti.json" />
    </div>

    <div class="auth-card">
      <div class="auth-head">
        <h1>Set a new password</h1>
        <p>Choose something at least 8 characters. Use a mix of letters and numbers for safety.</p>
      </div>

      {#if success}
        <div class="success">
          <Icon icon="lucide:check-circle-2" width="20" height="20" />
          <div>
            <strong>Password updated.</strong>
            <span>You can sign in with your new password now.</span>
          </div>
        </div>
        <a href={resolve('/login', {})} class="btn-coral btn-lg auth-submit">
          Sign in
          <Icon icon="lucide:arrow-right" width="16" height="16" />
        </a>
      {:else if linkInvalid}
        <div class="error" role="alert"><Icon icon="lucide:alert-circle" width="14" height="14" /> {error}</div>
        <a href={resolve('/forgot-password', {})} class="btn-coral btn-lg auth-submit">
          Request a new link
          <Icon icon="lucide:arrow-right" width="16" height="16" />
        </a>
      {:else}
        <form class="auth-form" on:submit={handleResetPassword}>
          {#if error}
            <p class="error" role="alert"><Icon icon="lucide:alert-circle" width="14" height="14" /> {error}</p>
          {/if}
          <label>
            <span>New password</span>
            <div class="field-wrap">
              <Icon icon="lucide:lock" width="16" height="16" />
              <input
                class="with-icon"
                bind:value={password}
                type="password"
                placeholder="At least 8 characters"
                minlength="8"
                required
                autocomplete="new-password"
              />
            </div>
          </label>
          <label>
            <span>Confirm new password</span>
            <div class="field-wrap">
              <Icon icon="lucide:lock-keyhole" width="16" height="16" />
              <input
                class="with-icon"
                bind:value={passwordConfirm}
                type="password"
                placeholder="Type it again"
                minlength="8"
                required
                autocomplete="new-password"
              />
            </div>
          </label>
          <button type="submit" class="btn-coral btn-lg auth-submit" disabled={submitting}>
            {#if submitting}
              <Icon icon="lucide:loader-2" width="18" height="18" class="spin" />
              Saving…
            {:else}
              Set new password
              <Icon icon="lucide:arrow-right" width="16" height="16" />
            {/if}
          </button>
        </form>
      {/if}
    </div>
  </main>
</div>

<style>
  .auth-shell {
    height: 100vh;
    width: 100%;
    display: flex;
    background: var(--color-background);
    color: var(--color-text);
    overflow: hidden;
  }
  .left-panel {
    width: 55%;
    height: 100vh;
    display: none;
  }
  .right-panel {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    overflow-y: auto;
  }
  .mobile-stage { display: block; width: 100%; height: 300px; flex: 0 0 300px; margin-bottom: 8px; }
  .auth-card { width: min(440px, calc(100% - 2rem)); padding: 28px 18px 30px; position: relative; z-index: 1; isolation: isolate; background: var(--color-background); }
  .auth-head { margin-bottom: 22px; }
  h1 {
    font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
    font-size: clamp(2rem, 3vw, 2.6rem);
    font-weight: 800;
    color: var(--color-text);
    margin: 0 0 8px;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  p { margin: 0; color: var(--color-text-secondary); font-size: 16px; font-weight: 500; line-height: 1.5; }

  .success {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    background: color-mix(in srgb, #059669 10%, transparent);
    color: #047857;
    border-radius: 14px;
    margin-bottom: 16px;
  }
  .success > div { display: flex; flex-direction: column; gap: 4px; }
  .success strong { font-size: 14px; font-weight: 700; }
  .success span { font-size: 13px; font-weight: 500; line-height: 1.5; color: rgba(4, 120, 87, 0.85); }

  .auth-form { display: grid; gap: 12px; }
  label { display: grid; gap: 6px; }
  label span { font-size: 13px; font-weight: 700; color: var(--color-text); }
  .field-wrap { position: relative; }
  .field-wrap :global(svg) { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--color-text-tertiary); pointer-events: none; }
  .with-icon { padding-left: 40px; }
  input {
    width: 100%;
    box-sizing: border-box;
    height: 48px;
    border: 1px solid var(--card-border-strong);
    border-radius: 12px;
    padding: 0 14px;
    background: var(--color-surface);
    color: var(--color-text);
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    transition: all 150ms ease;
  }
  input:focus { border-color: var(--color-primary-readable); background: var(--color-surface); box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.12); outline: none; }
  .auth-submit { margin-top: 8px; width: 100%; }
  .error { margin: 0 0 16px; padding: 10px 12px; background: var(--color-error-container); color: var(--color-error); font-size: 13px; font-weight: 600; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px; }

  @media (min-width: 1024px) {
    .left-panel { display: block; }
    .right-panel { width: 45%; padding: 36px 16px; justify-content: center; }
    .mobile-stage { display: none; }
    .auth-card { width: min(440px, 100%); padding: 8px 4px; }
  }
</style>
