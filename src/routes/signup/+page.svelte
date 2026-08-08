<script lang="ts">
  import Icon from '@iconify/svelte';
  import { signInWithGoogle, signUpEmail } from '$lib/appwrite.client';
  import { goto } from '$app/navigation';
  import AuthBrandPanel from '$lib/components/AuthBrandPanel.svelte';
  let email = $state('');
  let password = $state('');
  let firstName = $state('');
  let lastName = $state('');
  let role = $state<'volunteer' | 'ngo'>('volunteer');
  let step = $state<1 | 2>(1);
  let error = $state<string | null>(null);
  let submitting = $state(false);
  async function handleSignup(e: Event) {
    e.preventDefault();
    error = null;
    submitting = true;
    try {
      const name = `${firstName} ${lastName}`.trim();
      await signUpEmail(email, password, name || undefined, role);
      goto('/dashboard');
    } catch {
      error = 'Sign up failed. Please check your details or try Google.';
    } finally {
      submitting = false;
    }
  }
</script>

<div class="auth-shell">
  <div class="left-panel">
    <AuthBrandPanel animation="/animations/brainstorming.lottie" />
  </div>

  <section class="right-panel">
    <div class="mobile-stage">
      <AuthBrandPanel compact animation="/animations/brainstorming.lottie" />
    </div>

    <div class="auth-card">
      <div class="auth-head">
        {#if step === 2}
          <button class="back-btn" type="button" onclick={() => (step = 1)}>
            <Icon icon="mdi:arrow-left" width="16" height="16" />
            Back
          </button>
        {/if}
        <h1>{step === 1 ? 'Choose your path' : 'Create your account'}</h1>
        <p>{step === 1 ? "Tell us how you'd like to use MicroMatch." : 'Just a few details to set up your civic hub.'}</p>
      </div>

      {#if step === 1}
        <div class="roles">
          <button class="role-card volunteer" type="button" onclick={() => { role = 'volunteer'; step = 2; }}>
            <span class="role-icon">
              <Icon icon="mdi:account-group-outline" width="28" height="28" />
            </span>
            <span class="role-copy">
              <strong>I'm a Volunteer</strong>
              <span>Complete micro-tasks, build streaks, and unlock civic badges.</span>
            </span>
          </button>
          <button class="role-card ngo" type="button" onclick={() => { role = 'ngo'; step = 2; }}>
            <span class="role-icon">
              <Icon icon="mdi:office-building-outline" width="28" height="28" />
            </span>
            <span class="role-copy">
              <strong>I represent an NGO</strong>
              <span>Post modular needs, verify submissions, and mobilize volunteers.</span>
            </span>
          </button>
        </div>
        <p class="foot">
          Already have an account?
          <a href="/login">Sign in</a>
        </p>
      {:else}
        <form onsubmit={(e) => { e.preventDefault(); signInWithGoogle(); }}>
          <button type="submit" class="google-btn">
            <Icon icon="logos:google-icon" />
            Sign up with Google
          </button>
        </form>

        <div class="divider">
          <span></span>
          <small>Or continue with email</small>
          <span></span>
        </div>

        <form class="auth-form" onsubmit={handleSignup}>
          {#if error}
            <p class="error"><Icon icon="lucide:alert-circle" width="14" height="14" /> {error}</p>
          {/if}
          <div class="name-grid">
            <label>
              <span>First name</span>
              <input bind:value={firstName} type="text" placeholder="Jane" autocomplete="given-name" required />
            </label>
            <label>
              <span>Last name</span>
              <input bind:value={lastName} type="text" placeholder="Doe" autocomplete="family-name" required />
            </label>
          </div>
          <label>
            <span>Email address</span>
            <input bind:value={email} type="email" placeholder="jane@example.com" required autocomplete="email" />
          </label>
          <label>
            <span>Create password</span>
            <input bind:value={password} type="password" placeholder="At least 8 characters" minlength="8" required autocomplete="new-password" />
          </label>
          <button type="submit" class="btn-coral btn-lg auth-submit" disabled={submitting}>
            {#if submitting}
              <Icon icon="lucide:loader-2" width="18" height="18" class="spin" />
              Creating account…
            {:else}
              Join MicroMatch
              <Icon icon="lucide:arrow-right" width="16" height="16" />
            {/if}
          </button>
          <p class="legal-notice">
            By registering, you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
          </p>
        </form>
      {/if}
    </div>
  </section>
</div>

<style>
  .auth-shell {
    height: 100vh;
    width: 100%;
    display: flex;
    background: #faf9f6;
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
    width: 100%;
    display: block;
    margin-bottom: 8px;
  }
  .auth-card {
    width: min(540px, calc(100% - 2rem));
    padding: 28px 18px 32px;
  }
  .auth-head {
    margin-bottom: 22px;
  }
  .back-btn {
    border: 0;
    background: transparent;
    color: #64748b;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-weight: 700;
    margin-bottom: 14px;
    font-size: 0.95rem;
  }
  h1 {
    font-size: clamp(2.35rem, 3.5vw, 3.4rem);
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 8px;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  p {
    margin: 0;
    color: #475569;
    font-size: 1.08rem;
    font-weight: 500;
  }
  .roles {
    display: grid;
    gap: 16px;
  }
  .role-card {
    border: 2px solid rgba(15, 23, 42, 0.08);
    border-radius: 20px;
    background: #fff;
    text-align: left;
    padding: 18px;
    display: flex;
    align-items: flex-start;
    gap: 14px;
    cursor: pointer;
    font-family: inherit;
    transition: all 150ms ease;
  }
  .role-card:hover {
    border-color: rgba(255, 107, 107, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
  }
  .role-card.volunteer .role-icon { background: #FFEDD5; color: #EA580C; }
  .role-card.ngo .role-icon { background: #DBEAFE; color: #2563EB; }
  .role-icon {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
  }
  .role-copy {
    display: grid;
    gap: 5px;
  }
  .role-copy strong {
    font-size: 1.15rem;
    line-height: 1.2;
    color: #0f172a;
    font-weight: 700;
  }
  .role-copy span {
    color: rgba(15, 23, 42, 0.65);
    line-height: 1.5;
    font-size: 14px;
    font-weight: 500;
  }
  .google-btn {
    width: 100%;
    height: 48px;
    border-radius: 14px;
    border: 1px solid rgba(15, 23, 42, 0.12);
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    cursor: pointer;
    transition: all 150ms ease;
  }
  .google-btn:hover {
    border-color: rgba(15, 23, 42, 0.25);
    background: #f8fafc;
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
    background: rgba(15, 23, 42, 0.1);
  }
  .divider small {
    font-weight: 700;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(15, 23, 42, 0.5);
  }
  .auth-form {
    display: grid;
    gap: 12px;
  }
  .name-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }
  label {
    display: grid;
    gap: 6px;
  }
  label span {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
  }
  input {
    width: 100%;
    box-sizing: border-box;
    height: 48px;
    border: 1px solid rgba(15, 23, 42, 0.12);
    border-radius: 12px;
    padding: 0 14px;
    background: #fafafa;
    color: #0f172a;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    transition: all 150ms ease;
  }
  input:focus {
    border-color: #FF6B6B;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.12);
    outline: none;
  }
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
  .legal-notice {
    margin-top: 14px;
    text-align: center;
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
  }
  .legal-notice a {
    color: #0f172a;
    text-decoration: underline;
    font-weight: 600;
  }
  .foot {
    margin-top: 22px;
    text-align: center;
    font-size: 0.95rem;
  }
  .foot a {
    color: #1e293b;
    text-decoration: underline;
    text-decoration-color: #cbd5e1;
    text-decoration-thickness: 2px;
    text-underline-offset: 5px;
    font-weight: 800;
    margin-left: 4px;
  }
  @media (min-width: 740px) {
    .name-grid {
      grid-template-columns: 1fr 1fr;
    }
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
      width: min(540px, 100%);
      padding: 8px 4px;
    }
    h1 {
      font-size: clamp(2.25rem, 2.4vw, 2.6rem);
    }
    p {
      font-size: 1.125rem;
    }
    .role-copy strong {
      font-size: 1.45rem;
    }
    .role-copy span {
      font-size: 1rem;
    }
    label span {
      font-size: 0.9rem;
    }
    .foot {
      font-size: 0.95rem;
    }
  }
</style>

