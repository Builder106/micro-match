<script lang="ts">
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import Link from '$lib/components/Link.svelte';
  import PatchPreview from '$lib/components/PatchPreview.svelte';
  import { go } from '$lib/go';
  import type { Locale } from '$lib/locale';

  const locale = $derived((page.data.locale as Locale | undefined) ?? 'en');
  const fromQuery = page.url.searchParams.get('role');

  let role = $state<'volunteer' | 'ngo' | null>(fromQuery === 'ngo' || fromQuery === 'volunteer' ? fromQuery : null);
  let firstName = $state('');
  let lastName = $state('');
  let email = $state('');
  let password = $state('');
  let error = $state('');
  let submitting = $state(false);

  async function create(e: SubmitEvent) {
    e.preventDefault();
    if (!role) return;
    if (password.length < 8) {
      error = 'Use at least 8 characters for your password.';
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
      error = 'We could not create that account. The email may already be in use.';
    } finally {
      submitting = false;
    }
  }
</script>

<Seo title="Join | MicroMatch" description="Join MicroMatch as a volunteer to do 5 to 30 minute tasks, or as a nonprofit to post them." />

<div class="auth">
  {#if !role}
    <h1 class="display h-l" tabindex="-1">Which side of the quilt?</h1>
    <p class="muted">You can switch later from your profile.</p>
    <div class="roles">
      <button type="button" class="role" onclick={() => (role = 'volunteer')}>
        <PatchPreview color="#F2B84B" icon="heart" size="3.6rem" />
        <span><strong>I want to volunteer</strong><span>Pick tasks that take 5 to 30 minutes and send your work.</span></span>
      </button>
      <button type="button" class="role" onclick={() => (role = 'ngo')}>
        <PatchPreview color="#5E7D4F" icon="house" size="3.6rem" />
        <span><strong>I run a nonprofit</strong><span>Post small tasks, review the work and design your patches.</span></span>
      </button>
    </div>
    <p class="small">Already have an account? <Link href="/login" class="link">Sign in</Link></p>
  {:else}
    <button type="button" class="link small back" onclick={() => (role = null)}>Choose a different role</button>
    <h1 class="display h-l" tabindex="-1">{role === 'ngo' ? 'Join as a nonprofit' : 'Join as a volunteer'}</h1>
    <form class="auth__form" onsubmit={create}>
      <div class="pair">
        <div class="field">
          <label for="first">First name</label>
          <input id="first" class="input" autocomplete="given-name" bind:value={firstName} />
        </div>
        <div class="field">
          <label for="last">Last name</label>
          <input id="last" class="input" autocomplete="family-name" bind:value={lastName} />
        </div>
      </div>
      <div class="field">
        <label for="email">Email</label>
        <input id="email" class="input" type="email" autocomplete="email" required bind:value={email} />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input id="password" class="input" type="password" autocomplete="new-password" minlength="8" required bind:value={password} />
        <span class="hint">At least 8 characters.</span>
      </div>
      {#if role === 'ngo'}<p class="small muted">Next you verify your organization. Your tasks appear in the feed once an admin approves it.</p>{/if}
      {#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}
      <button class="patch-btn" type="submit" disabled={submitting}>{submitting ? 'Creating your account...' : 'Create my account'}</button>
      <p class="small muted">By joining you agree to the <Link href="/terms" class="link">terms</Link> and the <Link href="/privacy" class="link">privacy policy</Link>.</p>
    </form>
  {/if}
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
