<script lang="ts">
  import Icon from '@iconify/svelte';
  import { onMount } from 'svelte';
  import { account, uploadAvatar, getAvatarUrl } from '$lib/appwrite.client';
  import { refreshSessionCookie } from '$lib/appwrite.client';
  import VerificationCard from '$lib/components/VerificationCard.svelte';
  import { resolve } from '$app/paths';

  export let data: { userRole: 'anonymous' | 'user' | 'ngo' | 'volunteer'; user: { id: string; email?: string } | null };

  let displayName = '';
  let bio = '';
  let orgName = '';
  let role: 'volunteer' | 'ngo' = (data.userRole === 'ngo' || data.userRole === 'volunteer') ? data.userRole : 'volunteer';
  let initialRole: 'volunteer' | 'ngo' | null = (data.userRole === 'ngo' || data.userRole === 'volunteer') ? data.userRole : null;
  let saving = false;
  let saved = false;
  let error: string | null = null;
  let loading = true;
  let showDowngradeModal = false;
  let confirmBtn: HTMLButtonElement | undefined;
  const bioMax = 280;
  $: bioCount = (bio ?? '').length;
  $: firstName = (displayName.trim().split(/\s+/)[0]) || (data.user?.email?.split('@')[0] ?? 'there');
  $: avatarLetter = ((displayName || data.user?.email || '?').trim().charAt(0) || '?').toUpperCase();
  let avatarFileId: string | null = null;
  let avatarUrl: string = '';
  let avatarUploading = false;
  let avatarError: string | null = null;
  let appwriteSessionMissing = false;

  const AVATAR_TARGET_DIMENSION = 512;
  const AVATAR_TARGET_MAX_BYTES = 2 * 1024 * 1024;
  const AVATAR_MAX_ORIGINAL_BYTES = 8 * 1024 * 1024;

  async function cropToSquareAndResizeJPEG(file: File, targetDim = AVATAR_TARGET_DIMENSION): Promise<Blob> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Invalid image data'));
      image.src = dataUrl;
    });
    const minSide = Math.min(img.width, img.height);
    const sx = Math.floor((img.width - minSide) / 2);
    const sy = Math.floor((img.height - minSide) / 2);
    const canvas = document.createElement('canvas');
    canvas.width = targetDim;
    canvas.height = targetDim;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetDim, targetDim);

    const toBlob = (quality: number) => new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Blob conversion failed'))), 'image/jpeg', quality);
    });
    let quality = 0.85;
    let blob = await toBlob(quality);
    if (blob.size > AVATAR_TARGET_MAX_BYTES) {
      quality = 0.75;
      blob = await toBlob(quality);
    }
    if (blob.size > AVATAR_TARGET_MAX_BYTES) {
      quality = 0.65;
      blob = await toBlob(quality);
    }
    return blob;
  }

  async function handleAvatarChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    avatarError = null;
    if (!file.type.startsWith('image/')) { avatarError = 'Please select an image file.'; return; }
    if (file.size > AVATAR_MAX_ORIGINAL_BYTES) { avatarError = 'Image is too large. Please choose a file under 8MB.'; return; }
    avatarUploading = true;
    try {
      const processed = await cropToSquareAndResizeJPEG(file, AVATAR_TARGET_DIMENSION);
      if (processed.size > AVATAR_TARGET_MAX_BYTES) {
        avatarError = 'Processed image still too large. Try a smaller image.';
      } else {
        const processedFile = new File([processed], 'avatar.jpg', { type: 'image/jpeg' });
        const jwt = await account.createJWT().then((j) => j?.jwt).catch(() => null);
        const uploaded = await (async () => {
          if (!jwt) return uploadAvatar(processedFile);
          const form = new FormData();
          form.append('file', processedFile);
          const res = await fetch('/api/profile/avatar', { method: 'POST', body: form, credentials: 'include', headers: { Authorization: `Bearer ${jwt}` } });
          if (!res.ok) {
            const { error } = await res.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(error || 'Upload failed');
          }
          const data = await res.json();
          return { fileId: data.fileId, url: data.url };
        })();
        avatarFileId = uploaded.fileId;
        avatarUrl = uploaded.url;
      }
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      avatarError = String(msg);
    } finally {
      avatarUploading = false;
    }
  }

  function isUnauthError(err: unknown): boolean {
    const e = err && typeof err === 'object' ? (err as { code?: number; type?: string }) : null;
    return (
      e?.code === 401 ||
      e?.type === 'general_unauthorized_scope' ||
      e?.type === 'user_unauthorized'
    );
  }

  onMount(async () => {
    // No first-party server session means we can't authorize any save
    // call against /api/profile/* — surface the cookie issue up-front.
    if (!data.user) {
      appwriteSessionMissing = true;
      loading = false;
      return;
    }

    await refreshSessionCookie();
    try {
      const me = await account.get<import('$lib/types').UserPreferences>();
      displayName = me.name ?? '';
      const prefs = me?.prefs ?? {};

      if (typeof prefs.bio === 'string') bio = prefs.bio;
      if (typeof prefs.orgName === 'string') orgName = prefs.orgName;
      if (typeof prefs.avatarFileId === 'string') {
        avatarFileId = prefs.avatarFileId;
        avatarUrl = avatarFileId ? getAvatarUrl(avatarFileId, 256) : '';
      }
      const prefRole = typeof prefs.role === 'string' ? prefs.role : '';

      if (prefRole === 'ngo' || prefRole === 'volunteer') {
        role = prefRole;
        initialRole = prefRole;
      } else if (data.userRole === 'ngo' || data.userRole === 'volunteer') {
        role = data.userRole;
        initialRole = data.userRole;
      }
    } catch (err: unknown) {
      // The client SDK can't reach Appwrite (Safari ITP, etc) but we
      // already have a server session — the form will still save through
      // /api/profile/update. Just fall back to server-side userRole and
      // a blank profile, no banner needed.
      if (!isUnauthError(err) && import.meta.env.DEV) {
        console.error('Error loading user profile:', err);
      }
      if (data.userRole === 'ngo' || data.userRole === 'volunteer') {
        role = data.userRole;
        initialRole = data.userRole;
      }
    }
    loading = false;
  });

  async function submitProfile(e: Event) {
    e.preventDefault();
    const isDowngrade = initialRole === 'ngo' && role === 'volunteer';
    if (isDowngrade) {
      // Defer the actual save until the modal is confirmed.
      saving = true;
      showDowngradeModal = true;
      // Focus the destructive button on next tick (better than autofocus for screen readers).
      setTimeout(() => confirmBtn?.focus(), 0);
      return;
    }
    await doSave();
  }

  function cancelDowngrade() {
    showDowngradeModal = false;
    saving = false;
  }

  async function confirmDowngrade() {
    showDowngradeModal = false;
    await doSave();
  }

  function handleModalKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && showDowngradeModal) cancelDowngrade();
  }

  async function doSave() {
    error = null;
    saving = true;
    saved = false;
    try {
      const isInitialPick = !initialRole;
      const isRoleChange = !!initialRole && role !== initialRole;

      // Profile name + non-role prefs go through our server (admin SDK)
      // so the save works even when the browser blocks Appwrite's
      // cross-origin client cookie (Safari ITP).
      const updateRes = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ displayName, bio, orgName, avatarFileId })
      });
      if (!updateRes.ok) {
        const errBody = await updateRes.json().catch(() => ({}));
        if (updateRes.status === 401) {
          appwriteSessionMissing = true;
          throw new Error('Your sign-in session expired. Please sign in again.');
        }
        throw new Error(errBody?.error || 'Could not save profile.');
      }

      if (isInitialPick || isRoleChange) {
        const res = await fetch('/api/profile/role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ newRole: role })
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (res.status === 401) {
            appwriteSessionMissing = true;
            throw new Error('Your sign-in session expired. Please sign in again.');
          }
          throw new Error(data?.error || 'Role update failed');
        }
      }

      await refreshSessionCookie();
      initialRole = role;
      saved = true;

      if (isInitialPick || isRoleChange) {
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      error = (err as Error)?.message || 'Could not save profile. Please try again.';
      if (import.meta.env.DEV) console.error('Profile save error:', err);
    } finally {
      saving = false;
    }
  }

  const nextSteps = [
    { num: '1', title: 'Find a task', body: 'Browse the feed and pick something that matches your skills.', href: '/tasks', bg: '#D1FAE5', color: '#059669', icon: 'lucide:search' },
    { num: '2', title: 'Earn badges', body: 'Complete tasks and watch your badge vault fill up.', href: '/dashboard', bg: '#FFEDD5', color: '#EA580C', icon: 'lucide:award' },
    { num: '3', title: 'Level up', body: 'Every 3 approved tasks bumps you to the next level.', href: '/dashboard', bg: '#DBEAFE', color: '#2563EB', icon: 'lucide:trending-up' },
  ];
  const ngoSteps = [
    { num: '1', title: 'Post a task', body: 'Create your first micro-task and let volunteers help.', href: '/org', bg: '#FFEDD5', color: '#EA580C', icon: 'lucide:plus-circle' },
    { num: '2', title: 'Review work', body: 'Approve submissions to award badges and reward effort.', href: '/dashboard', bg: '#D1FAE5', color: '#059669', icon: 'lucide:check-circle-2' },
    { num: '3', title: 'Track impact', body: 'See how your tasks add up across all volunteers.', href: '/badges/analytics', bg: '#DBEAFE', color: '#2563EB', icon: 'lucide:bar-chart-3' },
  ];
  $: currentSteps = role === 'ngo' ? ngoSteps : nextSteps;
</script>

<div class="profile-page">
  <!-- ───── Hero ───── -->
  <section class="profile-hero brand-card">
    <div class="profile-hero-blob"></div>

    <div class="avatar-stack">
      <div class="avatar-ring">
        <div class="avatar-face">
          {#if avatarUrl}
            <img src={avatarUrl} alt="Avatar" />
          {:else}
            <span>{avatarLetter}</span>
          {/if}
        </div>
        <label for="avatar-input" class="avatar-edit" aria-label="Change avatar">
          {#if avatarUploading}
            <Icon icon="lucide:loader-2" width="16" height="16" class="spin" />
          {:else}
            <Icon icon="lucide:camera" width="16" height="16" />
          {/if}
        </label>
        <input id="avatar-input" type="file" accept="image/*" on:change={handleAvatarChange} />
      </div>
      <small class="avatar-hint">PNG or JPG up to 2MB <span class="pipe-sep">|</span> cropped to square</small>
      {#if avatarError}
        <small class="avatar-error">{avatarError}</small>
      {/if}
      {#if avatarUrl}
        <button type="button" class="avatar-remove" on:click={() => { avatarUrl = ''; avatarFileId = null; }}>Remove avatar</button>
      {/if}
    </div>

    <div class="profile-hero-text">
      <h1>Hey, <span class="coral-gradient">{firstName}</span>.</h1>
      <p>Tell us a bit about you so NGOs can match you with the right tasks.</p>
      <div class="profile-meta">
        {#if initialRole}
          <span class="meta-chip">
            <Icon icon={initialRole === 'ngo' ? 'lucide:building-2' : 'lucide:hand-heart'} width="14" height="14" />
            {initialRole === 'ngo' ? 'NGO' : 'Volunteer'}
          </span>
        {/if}
        {#if data.user?.email}
          <span class="meta-chip">
            <Icon icon="lucide:mail" width="14" height="14" />
            {data.user.email}
          </span>
        {/if}
      </div>
    </div>
  </section>

  {#if appwriteSessionMissing}
    <div class="session-warning" role="alert">
      <Icon icon="mdi:account-alert-outline" width="22" height="22" />
      <div>
        <strong>Please sign in to manage your profile.</strong>
        <p>
          We couldn't find an active session for this browser. Sign in with
          Google or your email to continue. If you just signed up with email
          in Safari and keep landing here, try Chrome or Firefox — Safari's
          strict tracking prevention can block our email sign-in cookie.
        </p>
        <a href={resolve('/login?next=%2Fprofile', {})} class="session-warning-cta">Sign in</a>
      </div>
    </div>
  {/if}

  <!-- ───── Form ───── -->
  <form class="profile-form brand-card" method="post" on:submit|preventDefault={submitProfile}>
    <header class="form-head">
      <h2>About you</h2>
      <p>Basic details visible to NGOs and volunteers.</p>
    </header>

    <div class="form-fields">
      <label class="field">
        <span class="field-label">Display name</span>
        <input bind:value={displayName} placeholder="Your name" autocomplete="name" />
        <small class="field-hint">Shown on tasks and badges.</small>
      </label>

      {#if role === 'ngo'}
        <label class="field">
          <span class="field-label">Organization name</span>
          <input bind:value={orgName} placeholder="Your NGO" autocomplete="organization" />
          <small class="field-hint">Displayed on tasks you post.</small>
        </label>
      {/if}

      <label class="field">
        <span class="field-label">Bio</span>
        <textarea bind:value={bio} rows="4" maxlength={bioMax} placeholder={role === 'ngo' ? 'Your mission, focus areas, or who you serve' : 'Your skills, interests, or causes you care about'}></textarea>
        <div class="field-foot">
          <small class="field-hint">Share a short intro to help others get to know you.</small>
          <small class="field-counter">{bioCount}/{bioMax}</small>
        </div>
      </label>

      {#if !loading}
        <fieldset class="role-picker">
          <legend>I am a&hellip;</legend>
          <button type="button" class="role-card" class:selected={role === 'volunteer'} on:click={() => role = 'volunteer'} aria-pressed={role === 'volunteer'}>
            <div class="role-icon" style="background: #FFEDD5; color: #EA580C;">
              <Icon icon="lucide:hand-heart" width="28" height="28" />
            </div>
            <h3>Volunteer</h3>
            <p>Find quick tasks. Earn badges. Level up.</p>
            {#if role === 'volunteer'}
              <span class="role-check"><Icon icon="lucide:check" width="14" height="14" /></span>
            {/if}
          </button>
          <button type="button" class="role-card" class:selected={role === 'ngo'} on:click={() => role = 'ngo'} aria-pressed={role === 'ngo'}>
            <div class="role-icon" style="background: #DBEAFE; color: #2563EB;">
              <Icon icon="lucide:building-2" width="28" height="28" />
            </div>
            <h3>NGO</h3>
            <p>Post tasks. Review submissions. Track impact.</p>
            {#if role === 'ngo'}
              <span class="role-check"><Icon icon="lucide:check" width="14" height="14" /></span>
            {/if}
          </button>
        </fieldset>
        {#if initialRole === 'ngo' && role === 'volunteer'}
          <p class="role-hint role-hint-warn">
            <Icon icon="lucide:alert-circle" width="14" height="14" />
            Switching to Volunteer will withdraw your NGO verification and remove the Verified chip from your tasks. You can switch back later — verification will need to be resubmitted.
          </p>
        {:else if initialRole}
          <p class="role-hint">
            <Icon icon="lucide:info" width="14" height="14" />
            You can change this anytime. Switching from NGO to Volunteer drops your verification.
          </p>
        {:else}
          <p class="role-hint">
            <Icon icon="lucide:info" width="14" height="14" />
            You can change this later if needed.
          </p>
        {/if}
      {/if}
    </div>

    {#if error}
      <div class="form-error">
        <Icon icon="lucide:alert-circle" width="16" height="16" />
        {error}
      </div>
    {/if}

    <div class="form-actions">
      <button type="submit" class="btn-coral btn-lg" disabled={saving || loading}>
        {#if saving || loading}
          <Icon icon="lucide:loader-2" width="18" height="18" class="spin" />
        {/if}
        Save changes
      </button>
      {#if saved}
        <span class="form-saved" aria-live="polite">
          <Icon icon="lucide:check-circle-2" width="16" height="16" />
          Saved!
        </span>
      {/if}
    </div>
  </form>

  <!-- ───── Verification (NGO only) ───── -->
  {#if initialRole === 'ngo'}
    <VerificationCard />
  {/if}

  <!-- ───── What's next ───── -->
  <section class="next">
    <div class="section-head">
      <h2>What's next</h2>
    </div>
    <div class="next-grid">
      {#each currentSteps as step (step.num)}
        <a href={resolve(step.href, {})} class="next-card">
          <div class="next-icon" style="background: {step.bg}; color: {step.color};">
            <Icon icon={step.icon} width="28" height="28" />
          </div>
          <h3><span class="next-num">{step.num}.</span> {step.title}</h3>
          <p>{step.body}</p>
        </a>
      {/each}
    </div>
  </section>
</div>

<!-- ───── Downgrade confirmation modal ───── -->
{#if showDowngradeModal}
  <div
    class="dg-modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="dg-title"
    on:keydown={handleModalKeydown}
    tabindex="-1"
  >
    <div class="dg-card">
      <div class="dg-icon">
        <Icon icon="lucide:alert-triangle" width="24" height="24" />
      </div>
      <div class="dg-body">
        <h2 id="dg-title">Switch to Volunteer?</h2>
        <p>This will:</p>
        <ul>
          <li>Withdraw your current NGO verification</li>
          <li>Remove the Verified chip from any tasks you've posted</li>
          <li>Move you out of the NGO team</li>
        </ul>
        <p class="dg-recover">You can switch back to NGO later — verification will need to be resubmitted.</p>
      </div>
      <div class="dg-actions">
        <button type="button" class="dg-cancel" on:click={cancelDowngrade}>Keep NGO</button>
        <button type="button" class="dg-confirm" on:click={confirmDowngrade} bind:this={confirmBtn}>
          <Icon icon="lucide:hand-heart" width="14" height="14" />
          Switch to Volunteer
        </button>
      </div>
    </div>
  </div>
{/if}

<svelte:window on:keydown={handleModalKeydown} />

<style>
  .profile-page { display: flex; flex-direction: column; gap: 32px; max-width: 900px; margin: 0 auto; }

  /* Hero */
  .profile-hero { position: relative; overflow: hidden; padding: 36px; display: grid; grid-template-columns: auto 1fr; gap: 32px; align-items: center; }
  @media (max-width: 640px) { .profile-hero { grid-template-columns: 1fr; padding: 28px; gap: 20px; text-align: center; } }
  .profile-hero-blob { position: absolute; top: -50%; right: -10%; width: 360px; height: 360px; border-radius: 50%; background: rgba(255, 107, 107, 0.18); filter: blur(80px); pointer-events: none; }
  .avatar-stack { display: flex; flex-direction: column; align-items: center; gap: 10px; position: relative; z-index: 1; }
  .avatar-ring { position: relative; width: 120px; height: 120px; border-radius: 50%; padding: 4px; background: var(--color-primary); }
  .avatar-face { width: 100%; height: 100%; border-radius: 50%; overflow: hidden; background: var(--color-surface); display: flex; align-items: center; justify-content: center; font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; font-size: 44px; font-weight: 800; color: var(--color-primary); }
  .avatar-face img { width: 100%; height: 100%; object-fit: cover; }
  .avatar-edit { position: absolute; bottom: 0; right: 0; width: 36px; height: 36px; border-radius: 50%; background: var(--color-text); color: var(--color-surface); display: flex; align-items: center; justify-content: center; cursor: pointer; border: 3px solid var(--color-surface); transition: all .2s; }
  .avatar-edit:hover { transform: scale(1.08); background: color-mix(in srgb, var(--color-text) 88%, black); }
  #avatar-input { display: none; }
  .avatar-hint { font-size: 11px; color: color-mix(in srgb, var(--color-text) 50%, transparent); font-weight: 500; }
  .avatar-error { font-size: 11px; color: var(--color-error); font-weight: 600; }
  .avatar-remove { background: none; border: none; padding: 0; color: var(--color-error); font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
  .avatar-remove:hover { text-decoration: underline; }

  .profile-hero-text { position: relative; z-index: 1; min-width: 0; }
  .profile-hero-text h1 { font-size: clamp(1.5rem, 2.5vw + 0.5rem, 2.25rem); font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; margin: 0 0 10px; }
  .profile-hero-text p { color: color-mix(in srgb, var(--color-text) 65%, transparent); font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
  .profile-meta { display: flex; flex-wrap: wrap; gap: 8px; }
  @media (max-width: 640px) { .profile-meta { justify-content: center; } }
  .meta-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: var(--card-border); color: color-mix(in srgb, var(--color-text) 75%, transparent); border-radius: 9999px; font-size: 12px; font-weight: 600; }

  /* Form */
  .profile-form { padding: 32px; display: flex; flex-direction: column; gap: 24px; }
  .form-head h2 { font-size: 22px; font-weight: 700; margin: 0 0 6px; }
  .form-head p { color: color-mix(in srgb, var(--color-text) 60%, transparent); font-size: 14px; margin: 0; }
  .form-fields { display: flex; flex-direction: column; gap: 20px; }
  .field { display: flex; flex-direction: column; gap: 8px; }
  .field-label { font-size: 13px; font-weight: 700; color: var(--color-text); letter-spacing: -0.01em; }
  .field input, .field textarea {
    padding: 14px 16px;
    border: 1px solid var(--card-border-strong);
    border-radius: 14px;
    background: var(--color-surface-variant);
    color: var(--color-text);
    font-family: inherit;
    font-size: 15px;
    font-weight: 500;
    transition: all .2s;
  }
  .field input:focus, .field textarea:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.12); }
  .field textarea { resize: vertical; min-height: 100px; line-height: 1.5; }
  .field-hint { font-size: 12px; font-weight: 500; color: color-mix(in srgb, var(--color-text) 55%, transparent); }
  .field-foot { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
  .field-counter { font-size: 12px; font-weight: 600; color: color-mix(in srgb, var(--color-text) 50%, transparent); }

  /* Role picker */
  .role-picker { padding: 0; margin: 4px 0 0; border: none; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 540px) { .role-picker { grid-template-columns: 1fr; } }
  .role-picker legend { font-size: 13px; font-weight: 700; color: var(--color-text); margin-bottom: 12px; padding: 0; }
  .role-card { position: relative; background: var(--color-surface); border: 2px solid var(--card-border-strong); border-radius: 18px; padding: 20px; display: flex; flex-direction: column; align-items: flex-start; gap: 10px; cursor: pointer; transition: all .2s; text-align: left; font-family: inherit; }
  .role-card:hover { border-color: color-mix(in srgb, var(--color-primary) 30%, transparent); transform: translateY(-2px); }
  .role-card.selected { border-color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 4%, var(--color-surface)); box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.08); }
  .role-icon { width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
  .role-card h3 { font-size: 16px; font-weight: 700; margin: 0; }
  .role-card p { font-size: 13px; color: color-mix(in srgb, var(--color-text) 60%, transparent); margin: 0; line-height: 1.4; }
  .role-check { position: absolute; top: 12px; right: 12px; width: 24px; height: 24px; border-radius: 50%; background: var(--color-primary); color: #fff; display: flex; align-items: center; justify-content: center; }
  .role-hint { display: inline-flex; align-items: flex-start; gap: 6px; font-size: 12px; line-height: 1.5; color: color-mix(in srgb, var(--color-text) 55%, transparent); margin: -8px 0 0; }
  .role-hint-warn { color: var(--color-warning); padding: 8px 12px; background: color-mix(in srgb, var(--color-warning) 10%, transparent); border-radius: 10px; font-weight: 600; margin: 0; }

  /* Form actions */
  .form-error { display: inline-flex; align-items: center; gap: 8px; padding: 12px 14px; background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); border-radius: 12px; font-size: 14px; font-weight: 600; }
  .form-actions { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  .form-saved { display: inline-flex; align-items: center; gap: 6px; color: var(--color-success); font-size: 14px; font-weight: 700; }

  /* What's next */
  .next-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  @media (max-width: 768px) { .next-grid { grid-template-columns: 1fr; } }
  .next-card { background: var(--color-surface); border: 1px solid var(--card-border); border-radius: 24px; padding: 24px; display: flex; flex-direction: column; gap: 12px; text-decoration: none; color: inherit; transition: all .25s cubic-bezier(0.4, 0, 0.2, 1); }
  .next-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06); }
  .next-icon { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
  .next-card h3 { font-size: 17px; font-weight: 700; margin: 0; }
  .next-num { color: var(--color-primary); margin-right: 4px; }
  .next-card p { font-size: 13px; color: color-mix(in srgb, var(--color-text) 60%, transparent); margin: 0; line-height: 1.5; }

  /* ───── Downgrade modal ───── */
  .dg-modal {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    z-index: 80;
    backdrop-filter: blur(4px);
    animation: dgFadeIn 0.18s ease-out;
  }
  @keyframes dgFadeIn { from { opacity: 0; } to { opacity: 1; } }
  .dg-card {
    background: var(--color-surface);
    border-radius: 24px;
    padding: 28px;
    max-width: 460px;
    width: 100%;
    box-shadow: 0 32px 80px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    gap: 16px;
    animation: dgScaleIn 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  }
  @keyframes dgScaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  .dg-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--color-warning) 15%, transparent);
    color: var(--color-warning);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .dg-body { display: flex; flex-direction: column; gap: 10px; }
  .dg-card h2 { font-size: 20px; font-weight: 700; margin: 0; }
  .dg-card p { font-size: 14px; line-height: 1.5; color: color-mix(in srgb, var(--color-text) 70%, transparent); margin: 0; }
  .dg-card ul { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; font-size: 14px; color: var(--color-text); }
  .dg-card ul li { line-height: 1.5; }
  .dg-recover { font-size: 13px !important; color: color-mix(in srgb, var(--color-text) 55%, transparent) !important; font-style: italic; }
  .dg-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; flex-wrap: wrap; }
  .dg-cancel {
    padding: 10px 20px;
    border-radius: 9999px;
    border: 1px solid var(--card-border-strong);
    background: var(--color-surface);
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text);
    transition: background .15s;
  }
  .dg-cancel:hover { background: color-mix(in srgb, var(--color-text) 5%, transparent); }
  .dg-confirm {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    border-radius: 9999px;
    border: none;
    background: var(--color-error);
    color: #fff;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    transition: all .15s;
  }
  .dg-confirm:hover { background: color-mix(in srgb, var(--color-error) 88%, black); transform: translateY(-1px); }

  .session-warning {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 16px 18px;
    margin-bottom: 16px;
    border-radius: 14px;
    background: color-mix(in srgb, #f59e0b 14%, var(--color-surface));
    border: 1px solid color-mix(in srgb, #f59e0b 40%, transparent);
    color: var(--color-text);
  }
  .session-warning :global(svg) { color: #b45309; flex: 0 0 auto; margin-top: 2px; }
  .session-warning strong { display: block; margin-bottom: 4px; font-weight: 700; }
  .session-warning p { margin: 0 0 10px 0; font-size: 0.92rem; line-height: 1.55; color: var(--color-text-secondary); }
  .session-warning-cta {
    display: inline-flex;
    align-items: center;
    padding: 8px 16px;
    border-radius: 9999px;
    background: var(--color-primary, #ff6b6b);
    color: #fff;
    text-decoration: none;
    font-weight: 700;
    font-size: 0.9rem;
  }
  .session-warning-cta:hover { background: color-mix(in srgb, var(--color-primary, #ff6b6b) 88%, black); }
</style>
