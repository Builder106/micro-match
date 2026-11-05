<script lang="ts">
  import { enhance } from '$app/forms';
  import Seo from '#lib/components/Seo.svelte';
  import AccountTabs from '#lib/components/AccountTabs.svelte';
  import Link from '#lib/components/Link.svelte';
  import PatchPreview from '#lib/components/PatchPreview.svelte';
  import { FIELD_MAX, type ClaimField } from '#lib/vault.js';
  import { getLocale } from '#lib/paraglide/runtime.js';
  import * as m from '#lib/paraglide/messages.js';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const day = (iso: string) => new Date(iso).toLocaleDateString(getLocale(), { dateStyle: 'medium' });
  // ActionData is a union of every action's reply; read it as one loose shape.
  type Reply = {
    form?: 'log' | 'claims' | 'profile';
    errors?: ClaimField[];
    values?: Record<string, string | number | undefined>;
    refused?: string;
    sent?: string;
    emailFailed?: boolean;
    handleError?: 'invalid' | 'taken';
    saved?: boolean;
  };
  const reply = $derived((form ?? {}) as Reply);
  const values = $derived(reply.values ?? {});
  const errors = $derived(new Set<ClaimField>(reply.errors ?? []));
  const refusal = $derived(reply.refused);
  const refusals: Record<string, () => string> = {
    ownAddress: m.vault_refused_own_address,
    tooManyPending: m.vault_refused_too_many_pending,
    dailyLimit: m.vault_refused_daily_limit,
    addressLimit: m.vault_refused_address_limit,
  };
  const statusLabels: Record<string, () => string> = {
    pending: m.vault_status_pending,
    verified: m.vault_status_verified,
    rejected: m.vault_status_rejected,
    expired: m.vault_status_expired,
    withdrawn: m.vault_status_withdrawn,
  };
  const sentTo = $derived(reply.sent);
  const emailFailed = $derived(Boolean(reply.emailFailed));
  const handleError = $derived(reply.handleError);
  const saved = $derived(Boolean(reply.saved));
</script>

<Seo title={m.vault_meta_title()} description={m.vault_meta_description()} noindex />

<AccountTabs />

<div class="vault">
  <header class="page-head">
    <h1 class="display h-l" tabindex="-1">{m.vault_title()}</h1>
    <p class="muted">{m.vault_intro()}</p>
  </header>

  <section aria-labelledby="v-badges">
    <h2 id="v-badges" class="h-m">{m.vault_badges_heading()}</h2>
    {#if data.badges.length}
      <ul class="badges">
        {#each data.badges as badge (badge.id)}
          <li class="badge">
            <PatchPreview color={badge.color} icon={badge.source === 'offplatform' ? 'heart' : 'star'} size="4.2rem" />
            <div>
              <strong dir="auto">{badge.label}</strong>
              <span class="muted">
                {badge.source === 'offplatform' ? m.vault_source_offplatform({ org: badge.orgName ?? badge.label }) : m.vault_source_task()}
              </span>
              <span class="muted num">{day(badge.awardedAt)}</span>
            </div>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="muted">{m.vault_badges_empty()}</p>
    {/if}
  </section>

  <section aria-labelledby="v-log">
    <h2 id="v-log" class="h-m">{m.vault_log_heading()}</h2>
    <form method="post" action="?/log" class="stack" use:enhance>
      <div class="field">
        <label for="v-name">{m.vault_field_name()}</label>
        <input id="v-name" name="volunteerName" class="input" autocomplete="name" required maxlength={FIELD_MAX.name} value={values.volunteerName ?? ''} aria-invalid={errors.has('volunteerName')} aria-describedby="v-name-hint" />
        <span id="v-name-hint" class="hint">{errors.has('volunteerName') ? m.vault_error_field() : m.vault_field_name_hint()}</span>
      </div>
      <div class="field">
        <label for="v-org">{m.vault_field_org()}</label>
        <input id="v-org" name="orgName" class="input" autocomplete="organization" required maxlength={FIELD_MAX.orgName} value={values.orgName ?? ''} aria-invalid={errors.has('orgName')} aria-describedby={errors.has('orgName') ? 'v-org-err' : undefined} />
        {#if errors.has('orgName')}<span id="v-org-err" class="hint">{m.vault_error_field()}</span>{/if}
      </div>
      <div class="field">
        <label for="v-contact">{m.vault_field_contact()}</label>
        <input id="v-contact" name="contactEmail" class="input" type="email" autocomplete="off" required maxlength={FIELD_MAX.email} value={values.contactEmail ?? ''} aria-invalid={errors.has('contactEmail')} aria-describedby="v-contact-hint" />
        <span id="v-contact-hint" class="hint">{errors.has('contactEmail') ? m.vault_error_field() : m.vault_field_contact_hint()}</span>
      </div>
      <div class="field">
        <label for="v-what">{m.vault_field_what()}</label>
        <textarea id="v-what" name="description" class="input" required minlength="10" maxlength={FIELD_MAX.description} aria-invalid={errors.has('description')} aria-describedby="v-what-hint">{values.description ?? ''}</textarea>
        <span id="v-what-hint" class="hint">{errors.has('description') ? m.vault_error_field() : m.vault_field_what_hint()}</span>
      </div>
      <div class="pair">
        <div class="field">
          <label for="v-date">{m.vault_field_date()}</label>
          <input id="v-date" name="date" class="input" type="date" value={values.date ?? ''} aria-invalid={errors.has('date')} aria-describedby={errors.has('date') ? 'v-date-err' : undefined} />
          {#if errors.has('date')}<span id="v-date-err" class="hint">{m.vault_error_field()}</span>{/if}
        </div>
        <div class="field">
          <label for="v-min">{m.vault_field_minutes()}</label>
          <input id="v-min" name="minutes" class="input num" type="number" inputmode="numeric" min="1" max="60000" value={values.minutes ?? ''} aria-invalid={errors.has('minutes')} aria-describedby={errors.has('minutes') ? 'v-min-err' : undefined} />
          {#if errors.has('minutes')}<span id="v-min-err" class="hint">{m.vault_error_field()}</span>{/if}
        </div>
      </div>

      {#if errors.size}<p class="notice notice--error" role="alert">{m.vault_error_form()}</p>{/if}
      {#if refusal && refusals[refusal]}<p class="notice notice--error" role="alert">{refusals[refusal]()}</p>{/if}
      {#if reply.form === 'log' && sentTo}
        <p class="notice notice--ok" role="status">{emailFailed ? m.vault_email_failed() : m.vault_sent({ email: sentTo })}</p>
      {/if}
      <button class="patch-btn" type="submit">{m.vault_submit()}</button>
    </form>
  </section>

  {#if data.claims.length}
    <section aria-labelledby="v-claims">
      <h2 id="v-claims" class="h-m">{m.vault_claims_heading()}</h2>
      {#if reply.form === 'claims' && sentTo}
        <p class="notice notice--ok" role="status">{emailFailed ? m.vault_email_failed() : m.vault_sent({ email: sentTo })}</p>
      {/if}
      {#if reply.form === 'claims' && refusal && refusals[refusal]}<p class="notice notice--error" role="alert">{refusals[refusal]()}</p>{/if}
      <ul class="claims">
        {#each data.claims as claim (claim.id)}
          <li class="claim">
            <PatchPreview color="#F2B84B" icon="heart" pinned={claim.status === 'pending'} size="3rem" />
            <div class="claim__body">
              <strong dir="auto">{claim.orgName}</strong>
              <span class="muted" dir="auto">{m.vault_claim_to({ email: claim.contact })}</span>
              <span class="muted" dir="auto">{claim.description}</span>
              <span class="status">
                {statusLabels[claim.status]()}
                {#if claim.status === 'pending'}<span class="muted num">{m.vault_expires({ date: day(claim.expiresAt) })}</span>{/if}
              </span>
            </div>
            {#if claim.status === 'pending' || claim.status === 'expired'}
              <div class="claim__actions">
                <form method="post" action="?/resend" use:enhance>
                  <input type="hidden" name="id" value={claim.id} />
                  <button class="patch-btn patch-btn--plain patch-btn--small" type="submit">{m.vault_resend()}</button>
                </form>
                {#if claim.status === 'pending'}
                  <form method="post" action="?/withdraw" use:enhance>
                    <input type="hidden" name="id" value={claim.id} />
                    <button class="patch-btn patch-btn--plain patch-btn--small" type="submit">{m.vault_withdraw()}</button>
                  </form>
                {/if}
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <section aria-labelledby="v-share">
    <h2 id="v-share" class="h-m">{m.vault_share_heading()}</h2>
    <p class="muted">{m.vault_share_intro()}</p>
    <form method="post" action="?/profile" class="stack" use:enhance>
      <div class="field">
        <label for="v-handle">{m.vault_handle()}</label>
        <input id="v-handle" name="handle" class="input" autocapitalize="none" autocomplete="off" spellcheck="false" required minlength="3" maxlength="30" value={data.profile?.handle ?? ''} aria-invalid={Boolean(handleError)} aria-describedby="v-handle-hint" />
        <span id="v-handle-hint" class="hint">{handleError === 'invalid' ? m.vault_handle_invalid() : handleError === 'taken' ? m.vault_handle_taken() : m.vault_handle_hint()}</span>
      </div>
      <div class="field">
        <label for="v-display">{m.vault_display_name()}</label>
        <input id="v-display" name="displayName" class="input" maxlength={FIELD_MAX.displayName} value={data.profile?.displayName ?? ''} />
      </div>
      <label class="check">
        <input type="checkbox" name="isPublic" checked={data.profile?.isPublic ?? false} />
        <span>{m.vault_public_toggle()}</span>
      </label>
      {#if reply.form === 'profile' && saved}<p class="notice notice--ok" role="status">{m.status_saved()}</p>{/if}
      <button class="patch-btn" type="submit">{m.vault_save()}</button>
    </form>
    {#if data.profile?.isPublic}
      <p><Link href={`/v/${data.profile.handle}`} class="link">{m.vault_view_public()}</Link></p>
    {/if}
  </section>
</div>

<style>
  .vault {
    display: grid;
    gap: clamp(1.8rem, 4vw, 3rem);
    max-width: 44rem;
  }
  .stack {
    display: grid;
    gap: 1.1rem;
  }
  .stack > .patch-btn {
    justify-self: start;
  }
  .pair {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
    gap: 1.1rem;
  }
  .badges,
  .claims {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 0.9rem;
    margin-top: 1rem;
  }
  .badges {
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  }
  .badge,
  .claim {
    display: flex;
    gap: 0.9rem;
    align-items: center;
  }
  .badge div,
  .claim__body {
    display: grid;
    gap: 0.1rem;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .claim {
    flex-wrap: wrap;
    padding-bottom: 0.9rem;
    border-bottom: 1.5px dashed var(--c-line);
  }
  .claim__body {
    flex: 1 1 12rem;
  }
  .claim__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .status {
    font-weight: 650;
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 0.8rem;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-height: 2.75rem;
  }
  .status .num {
    white-space: nowrap;
  }
</style>
