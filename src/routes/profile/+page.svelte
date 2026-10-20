<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import Seo from '$lib/components/Seo.svelte';
  import AccountTabs from '$lib/components/AccountTabs.svelte';
  import VerificationCard from '$lib/components/VerificationCard.svelte';
  import PatchPreview from '$lib/components/PatchPreview.svelte';
  import { callApi } from '$lib/api';
  import * as m from '$lib/paraglide/messages.js';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  type Role = 'volunteer' | 'ngo';
  const start: Role | null = untrack(() => (data.userRole === 'ngo' || data.userRole === 'volunteer' ? data.userRole : null));
  let role = $state<Role>(start ?? 'volunteer');
  let savedRole = $state<Role | null>(start);
  let displayName = $state('');
  let bio = $state('');
  let orgName = $state('');
  let avatarFileId = $state<string | null>(null);
  let avatarUrl = $state('');
  let avatarBusy = $state(false);
  let saving = $state(false);
  let saved = $state(false);
  let error = $state('');
  let confirmDialog = $state<HTMLDialogElement>();
  const BIO_MAX = 280;

  onMount(async () => {
    try {
      const client = await import('$lib/appwrite.client');
      await client.refreshSessionCookie();
      const me = await client.account.get<import('$lib/types').UserPreferences>();
      displayName = me.name ?? '';
      const prefs = me.prefs ?? {};
      if (typeof prefs.bio === 'string') bio = prefs.bio;
      if (typeof prefs.orgName === 'string') orgName = prefs.orgName;
      if (typeof prefs.avatarFileId === 'string') {
        avatarFileId = prefs.avatarFileId;
        avatarUrl = client.getAvatarUrl(prefs.avatarFileId, 256);
      }
      if (prefs.role === 'ngo' || prefs.role === 'volunteer') role = savedRole = prefs.role;
    } catch {
      // The browser could not reach Appwrite (blocked cookies, offline). The server session
      // still saves through /api/profile/update, so the form stays usable with empty fields.
    }
  });

  /** Square-crop and shrink an image to a 512 px JPEG before upload. */
  async function squareJpeg(file: File): Promise<File> {
    const bitmap = await createImageBitmap(file);
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    canvas.getContext('2d')!.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 512, 512);
    const blob = await new Promise<Blob>((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error(m.profile_image_unreadable()))), 'image/jpeg', 0.85));
    return new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
  }

  async function pickAvatar(e: Event) {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return void (error = m.profile_image_type());
    if (file.size > 8 * 1024 * 1024) return void (error = m.profile_image_size());
    avatarBusy = true;
    error = '';
    try {
      const client = await import('$lib/appwrite.client');
      const up = await client.uploadAvatar(await squareJpeg(file));
      avatarFileId = up.fileId;
      avatarUrl = up.url;
    } catch (err) {
      error = (err as Error).message || m.upload_failed();
    } finally {
      avatarBusy = false;
    }
  }

  function submit(e: SubmitEvent) {
    e.preventDefault();
    if (savedRole === 'ngo' && role === 'volunteer') confirmDialog?.showModal();
    else void save();
  }

  async function save() {
    confirmDialog?.close();
    saving = true;
    saved = false;
    error = '';
    const update = await callApi('/api/profile/update', { body: { displayName, bio, orgName, avatarFileId }, fallback: m.profile_save_error() });
    if (!update.ok) {
      saving = false;
      error = update.status === 401 ? m.profile_expired() : update.error;
      return;
    }
    const changingRole = role !== savedRole;
    if (changingRole) {
      const res = await callApi('/api/profile/role', { body: { newRole: role }, fallback: m.profile_role_error() });
      if (!res.ok) {
        saving = false;
        error = res.error;
        return;
      }
      const client = await import('$lib/appwrite.client');
      await client.refreshSessionCookie();
    }
    saving = false;
    saved = true;
    savedRole = role;
    if (changingRole) setTimeout(() => location.reload(), 900);
  }
</script>

<Seo title={m.profile_meta_title()} description={m.profile_meta_description()} noindex />

<AccountTabs />

<div class="profile">
  <form class="profile__form" onsubmit={submit}>
    <header class="page-head">
      <h1 class="display h-l" tabindex="-1">{m.nav_profile()}</h1>
      {#if data.user?.email}<p class="muted">{m.profile_signed_in_as({ email: data.user.email })}</p>{/if}
    </header>

    <div class="avatar">
      {#if avatarUrl}
        <img src={avatarUrl} alt={m.profile_avatar_alt()} width="88" height="88" />
      {:else}
        <span class="avatar__blank" aria-hidden="true">{(displayName || data.user?.email || '?').charAt(0).toUpperCase()}</span>
      {/if}
      <label class="patch-btn patch-btn--plain patch-btn--small">
        {avatarBusy ? m.status_uploading() : avatarUrl ? m.profile_change_picture() : m.profile_add_picture()}
        <input class="sr-only" type="file" accept="image/*" onchange={pickAvatar} />
      </label>
    </div>

    <div class="field">
      <label for="p-name">{m.field_name()}</label>
      <input id="p-name" class="input" autocomplete="name" bind:value={displayName} />
    </div>
    <div class="field">
      <label for="p-bio">{m.profile_bio()}</label>
      <textarea id="p-bio" class="input" maxlength={BIO_MAX} bind:value={bio} placeholder={m.profile_bio_placeholder()}></textarea>
      <span class="hint num">{m.count_of({ count: bio.length, max: BIO_MAX })}</span>
    </div>

    <fieldset class="roles">
      <legend class="label">{m.profile_role_legend()}</legend>
      <label class="role" class:is-on={role === 'volunteer'}>
        <input type="radio" name="role" value="volunteer" bind:group={role} />
        <PatchPreview color="#F2B84B" icon="heart" size="2.6rem" />
        <span>{m.profile_role_volunteer()}</span>
      </label>
      <label class="role" class:is-on={role === 'ngo'}>
        <input type="radio" name="role" value="ngo" bind:group={role} />
        <PatchPreview color="#5E7D4F" icon="house" size="2.6rem" />
        <span>{m.profile_role_ngo()}</span>
      </label>
    </fieldset>

    {#if role === 'ngo'}
      <div class="field">
        <label for="p-org">{m.field_org_name()}</label>
        <input id="p-org" class="input" autocomplete="organization" bind:value={orgName} />
      </div>
    {/if}

    {#if error}<p class="notice notice--error" role="alert">{error}</p>{/if}
    {#if saved}<p class="notice notice--ok" role="status">{m.status_saved()}</p>{/if}
    <button class="patch-btn" type="submit" disabled={saving}>{saving ? m.status_saving() : m.profile_save()}</button>
  </form>

  {#if savedRole === 'ngo'}
    <aside class="profile__side"><VerificationCard /></aside>
  {/if}
</div>

<dialog class="confirm" bind:this={confirmDialog} aria-labelledby="confirm-title">
  <h2 id="confirm-title" class="h-m">{m.profile_switch_title()}</h2>
  <p>{m.profile_switch_body()}</p>
  <div class="ctas">
    <button type="button" class="patch-btn" onclick={save}>{m.profile_switch_confirm()}</button>
    <button type="button" class="patch-btn patch-btn--plain" onclick={() => confirmDialog?.close()}>{m.profile_switch_keep()}</button>
  </div>
</dialog>

<style>
  .profile {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(16rem, 22rem);
    gap: clamp(1.5rem, 4vw, 3.5rem);
    align-items: start;
  }
  .profile__form {
    display: grid;
    gap: 1.1rem;
    max-width: 34rem;
  }
  .profile__form > .patch-btn {
    justify-self: start;
  }
  .avatar {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .avatar img,
  .avatar__blank {
    width: 88px;
    height: 88px;
    border-radius: 3px;
    object-fit: cover;
    box-shadow: 0 0 0 1.5px var(--c-fg);
  }
  .avatar__blank {
    display: grid;
    place-items: center;
    background: var(--c-weld);
    font-family: var(--f-display);
    font-weight: 760;
    font-size: 2rem;
  }
  .roles {
    border: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }
  .roles legend {
    width: 100%;
    margin-bottom: 0.5rem;
    font-family: var(--f-display);
    font-weight: 650;
  }
  .role {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.55rem 1rem 0.55rem 0.6rem;
    border-radius: var(--radius);
    box-shadow: inset 0 0 0 1.5px var(--c-line);
    cursor: pointer;
  }
  .role input {
    position: absolute;
    opacity: 0;
  }
  .role.is-on {
    box-shadow: inset 0 0 0 2px var(--c-fg);
  }
  .role:has(input:focus-visible) {
    outline: 2px solid var(--c-fg);
    outline-offset: 3px;
  }
  .confirm {
    max-width: 30rem;
    padding: 1.6rem;
    border: 0;
    border-radius: var(--radius);
    background: var(--c-paper);
    color: var(--c-fg);
    box-shadow: 0 0 0 1.5px var(--c-fg), 0 20px 50px color-mix(in srgb, var(--c-shade) 35%, transparent);
  }
  .confirm[open] {
    display: grid;
    gap: 1rem;
  }
  .confirm::backdrop {
    background: color-mix(in srgb, var(--c-shade) 45%, transparent);
  }
  @media (max-width: 899px) {
    .profile {
      grid-template-columns: 1fr;
    }
  }
</style>
