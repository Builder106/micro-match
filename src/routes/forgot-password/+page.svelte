<script lang="ts">
  import Icon from '@iconify/svelte';
  import { account } from '$lib/appwrite.client';
  import AuthBrandPanel from '$lib/components/AuthBrandPanel.svelte';
  import { resolve } from '$app/paths';

  let email = '';
  let error: string | null = null;
  let submitting = false;
  let success = false;

  async function handleForgotPassword(e: Event) {
    e.preventDefault();
    error = null;
    submitting = true;
    success = false;
    try {
      const resetUrl = `${window.location.origin}/reset-password`;
      await account.createRecovery(email, resetUrl);
      success = true;
    } catch {
      error = "We couldn't send a reset email. Double-check the address and try again.";
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head><title>Forgot password · MicroMatch</title></svelte:head>

<div class="auth-shell">
  <div class="left-panel">
    <AuthBrandPanel animation="/animations/empty_state_mascot.json" />
  </div>

  <section class="right-panel">
    <div class="mobile-stage">
      <AuthBrandPanel compact animation="/animations/empty_state_mascot.json" />
    </div>

    <div class="auth-card">
      <div class="auth-head">
        <a href={resolve('/login', {})} class="back-btn">
          <Icon icon="lucide:arrow-left" width="14" height="14" />
          Back to sign in
        </a>
        <h1>Forgot password?</h1>
        <p>Enter your email and we'll send a link to reset it.</p>
      </div>

      {#if success}
        <div class="success">
          <Icon icon="lucide:mail-check" width="20" height="20" />
          <div>
            <strong>Check your inbox.</strong>
            <span>We sent a reset link to <code>{email}</code>. The link is valid for one hour.</span>
          </div>
        </div>
        <a href={resolve('/login', {})} class="btn-coral btn-lg auth-submit">
          Back to sign in
          <Icon icon="lucide:arrow-right" width="16" height="16" />
        </a>
      {:else}
        <form class="auth-form" on:submit={handleForgotPassword}>
          {#if error}
            <p class="error"><Icon icon="lucide:alert-circle" width="14" height="14" /> {error}</p>
          {/if}
          <label>
            <span>Email address</span>
            <div class="field-wrap">
              <Icon icon="lucide:mail" width="16" height="16" />
              <input
                class="with-icon"
                bind:value={email}
                type="email"
                placeholder="you@example.com"
                required
                autocomplete="email"
              />
            </div>
          </label>
          <button type="submit" class="btn-coral btn-lg auth-submit" disabled={submitting}>
            {#if submitting}
              <Icon icon="lucide:loader-2" width="18" height="18" class="spin" />
              Sending…
            {:else}
              Send reset link
              <Icon icon="lucide:arrow-right" width="16" height="16" />
            {/if}
          </button>
        </form>
      {/if}

      <p class="foot">
        Remembered it? <a href={resolve('/login', {})}>Sign in instead</a>
      </p>
    </div>
  </section>
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
    justify-content: center;
    overflow-y: auto;
  }
  .mobile-stage { display: block; width: 100%; margin-bottom: 8px; }
  .auth-card { width: min(440px, calc(100% - 2rem)); padding: 28px 18px 30px; }
  .auth-head { margin-bottom: 22px; display: flex; flex-direction: column; gap: 10px; }
  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    align-self: flex-start;
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: 13px;
    font-weight: 700;
    padding: 4px 0;
  }
  .back-btn:hover { color: var(--color-primary); }
  h1 {
    font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
    font-size: clamp(2rem, 3vw, 2.6rem);
    font-weight: 800;
    color: var(--color-text);
    margin: 0;
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
  .success code { background: rgba(4, 120, 87, 0.12); padding: 1px 6px; border-radius: 4px; font-family: 'SF Mono', Menlo, monospace; font-size: 12px; }

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
  input:focus { border-color: var(--color-primary); background: var(--color-surface); box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.12); outline: none; }
  .auth-submit { margin-top: 8px; width: 100%; }
  .error { margin: 0; padding: 10px 12px; background: color-mix(in srgb, #dc2626 10%, transparent); color: #dc2626; font-size: 13px; font-weight: 600; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px; }

  .foot { margin-top: 22px; text-align: center; font-size: 14px; color: var(--color-text-secondary); }
  .foot a { color: var(--color-text); text-decoration: underline; text-decoration-color: var(--card-border-strong); text-decoration-thickness: 2px; text-underline-offset: 4px; font-weight: 700; margin-left: 4px; }
  .foot a:hover { color: var(--color-primary); text-decoration-color: var(--color-primary); }

  @media (min-width: 1024px) {
    .left-panel { display: block; }
    .right-panel { width: 45%; padding: 36px 16px; }
    .mobile-stage { display: none; }
    .auth-card { width: min(440px, 100%); padding: 8px 4px; }
  }
</style>
