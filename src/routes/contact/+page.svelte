<script lang="ts">
  import StaticArticle from '$lib/components/StaticArticle.svelte';
  import Icon from '@iconify/svelte';
  import { resolve } from '$app/paths';

  type TopicCategory = 'General Inquiry' | 'NGO Partnership' | 'Volunteer Support' | 'Security Disclosure';

  let fullName = $state('');
  let email = $state('');
  let topic = $state<TopicCategory>('General Inquiry');
  let message = $state('');
  let isSubmitting = $state(false);
  let isSubmitted = $state(false);

  const topicOptions: TopicCategory[] = [
    'General Inquiry',
    'NGO Partnership',
    'Volunteer Support',
    'Security Disclosure'
  ];

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (!email || !message) return;
    isSubmitting = true;

    // Simulate clean form submission
    setTimeout(() => {
      isSubmitting = false;
      isSubmitted = true;
    }, 800);
  }

  function resetForm() {
    fullName = '';
    email = '';
    topic = 'General Inquiry';
    message = '';
    isSubmitted = false;
  }
</script>

<StaticArticle
  title="Contact & Support"
  lede="Have questions, feedback, NGO partnership inquiries, or security disclosures? We'd love to hear from you."
  wide={true}
  showRelated={false}
>
  <div class="contact-hero-badge">
    <span class="brand-pill">MicroMatch</span>
    <span class="hub-tag">Get In Touch</span>
  </div>

  <div class="contact-grid">
    <!-- Left Column: Form -->
    <div class="contact-form-card">
      <div class="card-head">
        <h2>Send Us a Message</h2>
        <p>Fill out the form below and our team will get back to you within 1–2 business days.</p>
      </div>

      {#if isSubmitted}
        <div class="success-state">
          <div class="success-icon-badge">
            <Icon icon="heroicons:check-circle-20-solid" width="28" height="28" />
          </div>
          <h4>Message Sent!</h4>
          <p>Thank you for reaching out, <strong>{fullName || 'friend'}</strong>. We've received your message regarding <strong>{topic}</strong> and will respond shortly.</p>
          <button class="btn-coral btn-sm" onclick={resetForm}>Send Another Message</button>
        </div>
      {:else}
        <form onsubmit={handleSubmit} class="contact-form">
          <div class="form-group">
            <label for="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              placeholder="Jane Doe"
              bind:value={fullName}
              required
            />
          </div>

          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="jane@example.com"
              bind:value={email}
              required
            />
          </div>

          <div class="form-group">
            <label for="topic">Topic / Category</label>
            <div class="topic-pills" role="radiogroup" aria-label="Topic Selection">
              {#each topicOptions as option (option)}
                <button
                  type="button"
                  class="topic-pill"
                  class:active={topic === option}
                  onclick={() => (topic = option)}
                >
                  {option}
                </button>
              {/each}
            </div>
          </div>

          <div class="form-group">
            <label for="message">Your Message</label>
            <textarea
              id="message"
              rows="4"
              placeholder="Tell us how we can help or details about your partnership..."
              bind:value={message}
              required
            ></textarea>
          </div>

          <div class="form-security-note">
            <span class="note-icon-wrap">
              <Icon icon="heroicons:shield-exclamation-20-solid" width="16" height="16" />
            </span>
            <span>For security reasons, please do not include passwords or sensitive credentials.</span>
          </div>

          <button type="submit" class="btn-coral submit-btn" disabled={isSubmitting}>
            {#if isSubmitting}
              <Icon icon="heroicons:arrow-path-20-solid" width="18" height="18" class="spin" />
              Sending...
            {:else}
              Send Message
              <Icon icon="heroicons:paper-airplane-20-solid" width="18" height="18" />
            {/if}
          </button>
        </form>
      {/if}
    </div>

    <!-- Right Column: Direct Channels -->
    <div class="contact-channels">
      <div class="channel-card">
        <div class="channel-icon-wrap coral-glow">
          <Icon icon="heroicons:envelope-20-solid" width="22" height="22" />
        </div>
        <div class="channel-info">
    <h3>General Support & Partnerships</h3>
          <p>For product questions, media inquiries, or NGO onboarding support:</p>
          <a href="mailto:hello@trymicromatch.com" class="channel-link">
            hello@trymicromatch.com
            <Icon icon="heroicons:arrow-up-right-20-solid" width="14" height="14" />
          </a>
        </div>
      </div>

      <div class="channel-card">
        <div class="channel-icon-wrap rose-glow">
          <Icon icon="heroicons:shield-check-20-solid" width="22" height="22" />
        </div>
        <div class="channel-info">
    <h3>Security & Responsible Disclosure</h3>
          <p>Reporting a security vulnerability? Include steps to reproduce and expected vs. actual behavior:</p>
          <a href="mailto:security@trymicromatch.com" class="channel-link">
            security@trymicromatch.com
            <Icon icon="heroicons:arrow-up-right-20-solid" width="14" height="14" />
          </a>
        </div>
      </div>

      <div class="channel-card">
        <div class="channel-icon-wrap indigo-glow">
          <Icon icon="heroicons:book-open-20-solid" width="22" height="22" />
        </div>
        <div class="channel-info">
    <h3>Self-Service Help & Documentation</h3>
          <p>Looking for instant answers or developer API specifications?</p>
          <div class="channel-links-row">
            <a href={resolve('/help', {})} class="text-link">Visit the Help Center →</a>
            <a href={resolve('/docs/api', {})} class="text-link">Developer API →</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</StaticArticle>

<style>
  .contact-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 6px 4px 6px;
    background: var(--color-surface-variant, #f8fafc);
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.08));
    border-radius: 24px;
    margin-bottom: 24px;
  }

  .brand-pill {
    font-size: 0.775rem;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 16px;
    background: var(--color-primary, #ff6b6b);
    color: var(--color-brand-on-coral);
    letter-spacing: 0.02em;
  }

  .hub-tag {
    font-size: 0.775rem;
    font-weight: 600;
    padding: 3px 10px;
    color: var(--color-text-secondary, #475569);
  }

  .contact-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 28px;
    align-items: start;
  }

  @media (min-width: 860px) {
    .contact-grid {
      grid-template-columns: 1.2fr 1fr;
    }
  }

  /* Form Card */
  .contact-form-card {
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.1));
    border-radius: 20px;
    padding: 28px;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.03);
  }

  .card-head h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 6px 0;
    color: var(--color-text, #0f172a);
    letter-spacing: -0.01em;
  }

  .card-head p {
    font-size: 0.9rem !important;
    line-height: 1.5 !important;
    color: var(--color-text-secondary, #64748b) !important;
    margin: 0 0 22px 0 !important;
  }

  .contact-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    font-size: 0.825rem;
    font-weight: 700;
    color: var(--color-text, #0f172a);
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 11px 14px;
    font-size: 0.9rem;
    border-radius: 10px;
    border: 1px solid var(--color-outline, #cbd5e1);
    background: var(--color-background, #fdfcf8);
    color: var(--color-text, #0f172a);
    box-sizing: border-box;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--color-primary, #ff6b6b);
    box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.15);
  }

  .topic-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .topic-pill {
    font-size: 0.775rem;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: 20px;
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.1));
    background: var(--color-surface-variant, #f1f5f9);
    color: var(--color-text-secondary, #475569);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .topic-pill:hover {
    background: #e2e8f0;
  }

  .topic-pill.active {
    background: var(--color-primary, #ff6b6b);
    color: var(--color-brand-on-coral);
    border-color: var(--color-primary, #ff6b6b);
  }

  .form-security-note {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 8px;
    background: #fffbeeb0;
    border: 1px solid #fef08a;
    font-size: 0.8rem;
    color: #713f12;
  }

  .note-icon-wrap {
    flex-shrink: 0;
    color: #b45309;
    display: flex;
    align-items: center;
  }

  .submit-btn {
    width: 100%;
    margin-top: 4px;
  }

  .btn-coral {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 11px 22px;
    border-radius: 9999px;
    background: var(--color-primary);
    color: var(--color-brand-on-coral) !important;
    font-weight: 700 !important;
    font-size: 0.9rem;
    border: none;
    cursor: pointer;
    text-decoration: none !important;
    transition: all 0.25s ease;
  }

  .btn-coral:hover {
    background: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(255, 107, 107, 0.35);
  }

  .btn-coral:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-sm {
    padding: 8px 16px;
    font-size: 0.85rem;
    width: auto;
  }

  /* Success State */
  .success-state {
    text-align: center;
    padding: 32px 16px;
  }

  .success-icon-badge {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: #f0fdf4;
    color: #10b981;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px auto;
  }

  .success-state h4 {
    font-size: 1.3rem;
    font-weight: 700;
    margin: 0 0 8px 0;
    color: var(--color-text, #0f172a);
  }

  .success-state p {
    font-size: 0.925rem !important;
    line-height: 1.55 !important;
    color: var(--color-text-secondary, #475569) !important;
    margin: 0 0 20px 0 !important;
  }

  /* Right Column: Channels */
  .contact-channels {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .channel-card {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.08));
    border-radius: 16px;
    padding: 22px 20px;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .channel-card:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 107, 107, 0.35);
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
  }

  .channel-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .coral-glow { background: #fff1f1; color: var(--color-primary-readable); }
  .rose-glow { background: #fff1f2; color: #e11d48; }
  .indigo-glow { background: #eff6ff; color: #3b82f6; }

  .channel-info h3 {
    font-size: 1rem;
    font-weight: 700;
    margin: 0 0 4px 0;
    color: var(--color-text, #0f172a);
    letter-spacing: -0.01em;
  }

  .channel-info p {
    font-size: 0.85rem !important;
    line-height: 1.45 !important;
    color: var(--color-text-secondary, #64748b) !important;
    margin: 0 0 10px 0 !important;
  }

  .channel-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-primary-readable);
    text-decoration: none !important;
  }

  .channel-link:hover {
    text-decoration: underline !important;
  }

  .channel-links-row {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .text-link {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-primary-readable);
    text-decoration: none !important;
  }

  .text-link:hover {
    text-decoration: underline !important;
  }
</style>
