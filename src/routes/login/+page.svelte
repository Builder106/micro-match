<script lang="ts">
  import Icon from '@iconify/svelte';
  import { signInWithGoogle, signInEmail, refreshSessionCookie } from '$lib/appwrite.client';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import AuthBrandPanel from '$lib/components/AuthBrandPanel.svelte';

  let email = '';
  let password = '';
  let error: string | null = null;
  let submitting = false;

  function safeNext(): string {
    const raw = $page.url.searchParams.get('next') ?? '';
    // Only same-origin paths starting with a single slash to prevent open
    // redirects to other hosts.
    if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
    return '/dashboard';
  }

  function oauthGoogle(e: Event) {
    e.preventDefault();
    signInWithGoogle();
  }

  async function handleEmailSignIn(e: Event) {
    e.preventDefault();
    error = null;
    submitting = true;
    try {
      await signInEmail(email, password);
      await refreshSessionCookie();
      goto(safeNext());
    } catch {
      error = 'Invalid email or password.';
    } finally {
      submitting = false;
    }
  }
</script>

<div class="auth-shell">
  <div class="left-panel">
    <AuthBrandPanel animation="/animations/collaboration.lottie" />
  </div>

  <section class="right-panel">
    <div class="mobile-stage">
      <AuthBrandPanel compact animation="/animations/collaboration.lottie" />
    </div>

    <div class="auth-card">
      <div class="auth-head">
        <h1>Welcome back</h1>
        <p>Ready to jump into your next mission?</p>
      </div>

      <form on:submit={oauthGoogle}>
        <button type="submit" class="google-btn">
          <Icon icon="logos:google-icon" />
          Continue with Google
        </button>
      </form>

      <div class="divider">
        <span></span>
        <small>Or log in with email</small>
        <span></span>
      </div>

      <form class="auth-form" on:submit={handleEmailSignIn}>
        {#if error}
          <p class="error"><Icon icon="lucide:alert-circle" width="14" height="14" /> {error}</p>
        {/if}
        <label>
          <span>Email address</span>
          <div class="field-wrap">
            <Icon icon="lucide:mail" width="16" height="16" />
            <input class="with-icon" bind:value={email} name="email" type="email" placeholder="jane@example.com" required autocomplete="email" />
          </div>
        </label>
        <label>
          <span>Password</span>
          <div class="field-wrap">
            <Icon icon="lucide:lock" width="16" height="16" />
            <input class="with-icon" bind:value={password} name="password" type="password" placeholder="••••••••" required autocomplete="current-password" />
          </div>
        </label>
        <div class="forgot-link">
          <a href="/forgot-password">Forgot password?</a>
        </div>
        <button type="submit" class="btn-coral btn-lg auth-submit" disabled={submitting}>
          {#if submitting}
            <Icon icon="lucide:loader-2" width="18" height="18" class="spin" />
            Signing in…
          {:else}
            Sign in <Icon icon="lucide:arrow-right" width="16" height="16" />
          {/if}
        </button>
      </form>

      <p class="foot">
        Don't have an account?
        <a href="/signup">Create one</a>
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
  .mobile-stage {
    display: block;
    width: 100%;
    margin-bottom: 8px;
  }
  .auth-card {
    width: min(440px, calc(100% - 2rem));
    padding: 28px 18px 30px;
  }
  .auth-head {
    margin-bottom: 20px;
  }
  h1 {
    font-size: clamp(2.35rem, 3.5vw, 3.4rem);
    font-weight: 800;
    color: var(--color-text);
    margin: 0 0 6px;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  p {
    color: var(--color-text-secondary);
    margin: 0;
    font-size: 1.08rem;
    font-weight: 500;
  }
  .google-btn {
    width: 100%;
    height: 48px;
    border-radius: 14px;
    border: 1px solid var(--card-border-strong);
    background: var(--color-surface);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text);
    cursor: pointer;
    transition: all 150ms ease;
  }
  .google-btn:hover {
    border-color: var(--color-primary);
    background: var(--color-surface-variant);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
  }
  .divider {
    margin: 18px 0 16px;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 12px;
    align-items: center;
  }
  .divider span {
    height: 1px;
    background: var(--card-border-strong);
  }
  .divider small {
    font-weight: 700;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--color-text-tertiary);
  }
  .auth-form {
    display: grid;
    gap: 12px;
  }
  label {
    display: grid;
    gap: 6px;
  }
  label span {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text);
  }
  .field-wrap {
    position: relative;
  }
  .field-wrap :global(svg) {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-tertiary);
    pointer-events: none;
  }
  .with-icon {
    padding-left: 40px;
  }
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
    font-weight: 500;
    font-size: 14px;
    transition: all 150ms ease;
  }
  input:focus {
    border-color: var(--color-primary);
    background: var(--color-surface);
    box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.12);
    outline: none;
  }
  .forgot-link {
    display: flex;
    justify-content: flex-end;
    margin-top: -2px;
  }
  .forgot-link a {
    font-size: 13px;
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 700;
  }
  .forgot-link a:hover { color: #e85555; }
  .auth-submit { margin-top: 8px; width: 100%; }
  .error {
    margin: 0;
    padding: 10px 12px;
    background: color-mix(in srgb, #dc2626 10%, transparent);
    color: #dc2626;
    font-size: 13px;
    font-weight: 600;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .foot {
    margin-top: 20px;
    text-align: center;
    font-size: 0.95rem;
    color: var(--color-text-secondary);
  }
  .foot a {
    color: var(--color-text);
    text-decoration: underline;
    text-decoration-color: var(--card-border-strong);
    text-decoration-thickness: 2px;
    text-underline-offset: 5px;
    font-weight: 800;
    margin-left: 4px;
  }
  @media (min-width: 1024px) {
    .left-panel {
      display: block;
    }
    .right-panel {
      width: 45%;
      padding: 36px 16px;
    }
    .mobile-stage {
      display: none;
    }
    .auth-card {
      width: min(440px, 100%);
      padding: 8px 4px;
    }
    h1 {
      font-size: clamp(2.25rem, 2.4vw, 2.6rem);
    }
    p {
      font-size: 1.125rem;
    }
    label span {
      font-size: 0.9rem;
    }
    .foot {
      font-size: 0.95rem;
    }
  }
</style>

