<script lang="ts">
  import StaticArticle from '$lib/components/StaticArticle.svelte';
  import Icon from '@iconify/svelte';
  import { resolve } from '$app/paths';

  type FAQCategory = 'All' | 'Getting Started' | 'Tasks & Claims' | 'NGO Verification' | 'Account & Badges';

  interface FAQItem {
    id: string;
    category: Exclude<FAQCategory, 'All'>;
    question: string;
    answer: string;
    linkUrl?: string;
    linkLabel?: string;
  }

  let searchQuery = $state('');
  let selectedCategory = $state<FAQCategory>('All');
  let openFaqId = $state<string | null>('faq-1');

  const categories: FAQCategory[] = [
    'All',
    'Getting Started',
    'Tasks & Claims',
    'NGO Verification',
    'Account & Badges'
  ];

  const faqs: FAQItem[] = [
    {
      id: 'faq-1',
      category: 'Getting Started',
      question: 'How do I create an account on MicroMatch?',
      answer: 'Sign up and choose either a Volunteer or NGO account role, then complete your profile skills and language preferences so we can route micro-tasks accurately.',
      linkUrl: '/signup',
      linkLabel: 'Create an Account'
    },
    {
      id: 'faq-2',
      category: 'Getting Started',
      question: 'What is the difference between a Volunteer and an NGO account?',
      answer: 'Volunteers browse micro-tasks, submit completion proof, earn badges, and track XP. NGO accounts post 15–60 minute micro-tasks, manage organization verifications, and review volunteer claims.',
      linkUrl: '/how-it-works',
      linkLabel: 'Learn How MicroMatch Works'
    },
    {
      id: 'faq-3',
      category: 'Tasks & Claims',
      question: 'How do I know which micro-tasks to claim?',
      answer: 'Browse the main task feed, use time filters (e.g. ≤15m, ≤30m) and language tags, then open a task card to read the full scope. Claim a task only when you can complete it within the estimated window.',
      linkUrl: '/tasks',
      linkLabel: 'Browse Task Feed'
    },
    {
      id: 'faq-4',
      category: 'Tasks & Claims',
      question: 'How do I submit proof of my completed work?',
      answer: 'Once you complete your task, open the claim form on the task page and attach your proof URL (such as a GitHub PR, Google Doc link, Figma link, or screenshot file) along with optional notes for the NGO reviewer.',
      linkUrl: '/for-volunteers',
      linkLabel: 'Volunteer Guide'
    },
    {
      id: 'faq-5',
      category: 'Tasks & Claims',
      question: 'What happens after my submission is approved by the NGO?',
      answer: 'Upon approval, your submission awards XP points, updates your active volunteer streak, and issues a verifiable civic achievement badge stored in your public profile.',
      linkUrl: '/impact',
      linkLabel: 'View Live Impact Telemetry'
    },
    {
      id: 'faq-6',
      category: 'NGO Verification',
      question: 'How does NGO organization verification work?',
      answer: 'NGO representatives submit tax identification (EIN) or official registration proof under Organization settings. Once approved by admins, a green Verified checkmark appears on all posted micro-tasks.',
      linkUrl: '/for-ngos',
      linkLabel: 'NGO Partner Guide'
    },
    {
      id: 'faq-7',
      category: 'Account & Badges',
      question: 'Can I switch between Volunteer and NGO roles on one account?',
      answer: 'Yes! Registered organization members can toggle their active dashboard view between Volunteer and NGO modes at any time from their profile menu.',
      linkUrl: '/profile',
      linkLabel: 'Manage Profile Options'
    }
  ];

  const filteredFaqs = $derived(
    faqs.filter((faq) => {
      const matchCategory = selectedCategory === 'All' || faq.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q) ||
        faq.category.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    })
  );

  function toggleFaq(id: string) {
    openFaqId = openFaqId === id ? null : id;
  }
</script>

<StaticArticle
  title="Help Center"
  lede="Quick answers, step-by-step guides, and support resources for volunteers and NGO partners."
  wide={true}
  showRelated={false}
>
  <div class="help-hero-badge">
    <span class="brand-pill">MicroMatch</span>
    <span class="hub-tag">Support & Help Center</span>
  </div>

  <!-- Search & Category Filters -->
  <div class="help-controls">
    <div class="search-box">
      <span class="search-icon-wrap">
        <Icon icon="heroicons:magnifying-glass-20-solid" width="18" height="18" />
      </span>
      <input
        type="text"
        placeholder="Filter help topics by keyword (e.g., claims, verification, badges)..."
        bind:value={searchQuery}
      />
      {#if searchQuery}
        <button class="clear-btn" onclick={() => (searchQuery = '')}>&times;</button>
      {/if}
    </div>

    <div class="category-pills" role="group" aria-label="Help Categories">
      {#each categories as cat (cat)}
        <button
          class="pill-btn"
          class:active={selectedCategory === cat}
          onclick={() => (selectedCategory = cat)}
        >
          {cat}
          <span class="count-tag">
            {cat === 'All' ? faqs.length : faqs.filter((f) => f.category === cat).length}
          </span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Support Topics Cards -->
  <div class="topics-grid">
    <a href={resolve('/for-volunteers', {})} class="topic-card">
      <div class="topic-icon-wrap indigo-glow">
        <Icon icon="heroicons:user-group-20-solid" width="22" height="22" />
      </div>
      <div class="topic-info">
        <h2>Volunteer Guide</h2>
        <p>Finding tasks, submitting proof, & earning badges.</p>
      </div>
      <span class="arrow-icon-wrap">
        <Icon icon="heroicons:chevron-right-20-solid" width="18" height="18" />
      </span>
    </a>

    <a href={resolve('/for-ngos', {})} class="topic-card">
      <div class="topic-icon-wrap rose-glow">
        <Icon icon="heroicons:building-office-20-solid" width="22" height="22" />
      </div>
      <div class="topic-info">
        <h2>NGO Partner Guide</h2>
        <p>EIN verification, task creation, & reviewing claims.</p>
      </div>
      <span class="arrow-icon-wrap">
        <Icon icon="heroicons:chevron-right-20-solid" width="18" height="18" />
      </span>
    </a>

    <a href={resolve('/docs/api', {})} class="topic-card">
      <div class="topic-icon-wrap coral-glow">
        <Icon icon="heroicons:code-bracket-20-solid" width="22" height="22" />
      </div>
      <div class="topic-info">
        <h2>Developer API Docs</h2>
        <p>Interactive REST reference & authentication endpoints.</p>
      </div>
      <span class="arrow-icon-wrap">
        <Icon icon="heroicons:chevron-right-20-solid" width="18" height="18" />
      </span>
    </a>
  </div>

  <!-- FAQ Accordion List -->
  <div class="faq-section">
    <div class="faq-section-head">
      <h3>Frequently Asked Questions</h3>
      <span class="results-count">Showing {filteredFaqs.length} {filteredFaqs.length === 1 ? 'topic' : 'topics'}</span>
    </div>

    {#if filteredFaqs.length === 0}
      <div class="empty-faq">
        <span class="empty-icon-wrap">
          <Icon icon="heroicons:question-mark-circle-20-solid" width="32" height="32" />
        </span>
        <p>No questions match your search for <strong>"{searchQuery}"</strong>.</p>
        <button class="reset-link" onclick={() => { searchQuery = ''; selectedCategory = 'All'; }}>Clear search filters</button>
      </div>
    {:else}
      <div class="faq-list">
        {#each filteredFaqs as faq (faq.id)}
          <div class="faq-card" class:is-open={openFaqId === faq.id}>
            <button
              type="button"
              class="faq-header"
              onclick={() => toggleFaq(faq.id)}
              aria-expanded={openFaqId === faq.id}
            >
              <div class="faq-title-wrap">
                <span class="faq-cat-badge">{faq.category}</span>
                <span class="faq-question">{faq.question}</span>
              </div>
              <span class="faq-toggle-wrap">
                <Icon
                  icon={openFaqId === faq.id ? 'heroicons:minus-circle-20-solid' : 'heroicons:plus-circle-20-solid'}
                  width="20"
                  height="20"
                />
              </span>
            </button>

            {#if openFaqId === faq.id}
              <div class="faq-body">
                <p>{faq.answer}</p>
                {#if faq.linkUrl && faq.linkLabel}
                  <a href={resolve(faq.linkUrl, {})} class="faq-link">
                    {faq.linkLabel}
                    <Icon icon="heroicons:arrow-right-20-solid" width="14" height="14" />
                  </a>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Still Need Help CTA Banner -->
  <div class="help-cta-banner">
    <div class="cta-content">
      <div class="cta-badge">
        <Icon icon="heroicons:chat-bubble-left-right-20-solid" width="18" height="18" />
        <span>Still Have Questions?</span>
      </div>
      <h3>Need assistance with your account or organization?</h3>
      <p>Our support team and platform documentation are here to help you get onboarded seamlessly.</p>
    </div>
    <div class="cta-actions">
      <a href={resolve('/contact', {})} class="btn-coral">
        Contact Support
        <Icon icon="heroicons:arrow-right-20-solid" width="18" height="18" />
      </a>
      <a href={resolve('/docs', {})} class="btn-outline-action">
        Documentation Hub
        <Icon icon="heroicons:book-open-20-solid" width="18" height="18" />
      </a>
    </div>
  </div>
</StaticArticle>

<style>
  .help-hero-badge {
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
    color: #ffffff;
    letter-spacing: 0.02em;
  }

  .hub-tag {
    font-size: 0.775rem;
    font-weight: 600;
    padding: 3px 10px;
    color: var(--color-text-secondary, #475569);
  }

  .help-controls {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 32px;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
  }

  .search-icon-wrap {
    position: absolute;
    left: 16px;
    color: var(--color-text-tertiary, #64748b);
    pointer-events: none;
    display: flex;
    align-items: center;
  }

  .search-box input {
    width: 100%;
    padding: 12px 40px 12px 44px;
    font-size: 0.925rem;
    border-radius: 12px;
    border: 1px solid var(--color-outline, #cbd5e1);
    background: var(--color-surface, #ffffff);
    color: var(--color-text, #0f172a);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .search-box input:focus {
    outline: none;
    border-color: var(--color-primary, #ff6b6b);
    box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.15);
  }

  .clear-btn {
    position: absolute;
    right: 14px;
    background: transparent;
    border: none;
    font-size: 1.2rem;
    color: var(--color-text-tertiary, #64748b);
    cursor: pointer;
  }

  .category-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .pill-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 0.825rem;
    font-weight: 600;
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.1));
    background: var(--color-surface-variant, #f1f5f9);
    color: var(--color-text-secondary, #475569);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .pill-btn:hover {
    background: #e2e8f0;
  }

  .pill-btn.active {
    background: var(--color-primary, #ff6b6b);
    color: #ffffff;
    border-color: var(--color-primary, #ff6b6b);
  }

  .count-tag {
    font-size: 0.75rem;
    padding: 1px 6px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.08);
  }

  .pill-btn.active .count-tag {
    background: rgba(0, 0, 0, 0.35);
  }

  /* Support Topics Grid */
  .topics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
    margin-bottom: 40px;
  }

  .topic-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 20px;
    border-radius: 14px;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.08));
    text-decoration: none !important;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .topic-card:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 107, 107, 0.35);
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
  }

  .topic-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .indigo-glow { background: #eff6ff; color: #3b82f6; }
  .rose-glow { background: #fff1f2; color: #e11d48; }
  .coral-glow { background: #fff1f1; color: var(--color-primary); }

  .topic-info h2 {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0 0 2px 0;
    color: var(--color-text, #0f172a);
  }

  .topic-info p {
    font-size: 0.825rem !important;
    color: var(--color-text-secondary, #64748b) !important;
    margin: 0 !important;
  }

  .arrow-icon-wrap {
    margin-left: auto;
    color: var(--color-text-tertiary, #94a3b8);
    display: flex;
    align-items: center;
    transition: transform 0.15s ease, color 0.15s ease;
  }

  .topic-card:hover .arrow-icon-wrap {
    transform: translateX(3px);
    color: var(--color-primary, #ff6b6b);
  }

  /* FAQ Section */
  .faq-section {
    margin-bottom: 44px;
  }

  .faq-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.08));
  }

  .faq-section-head h3 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    color: var(--color-text, #0f172a);
  }

  .results-count {
    font-size: 0.825rem;
    font-weight: 600;
    color: var(--color-text-tertiary, #64748b);
  }

  .faq-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .faq-card {
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.08));
    border-radius: 14px;
    overflow: hidden;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .faq-card:hover,
  .faq-card.is-open {
    border-color: rgba(255, 107, 107, 0.35);
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
  }

  .faq-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 18px 20px;
    background: transparent;
    border: none;
    text-align: left;
    cursor: pointer;
    gap: 16px;
  }

  .faq-title-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .faq-cat-badge {
    font-size: 0.725rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 6px;
    background: var(--color-surface-variant, #f1f5f9);
    color: var(--color-text-secondary, #475569);
  }

  .faq-question {
    font-size: 0.975rem;
    font-weight: 700;
    color: var(--color-text, #0f172a);
  }

  .faq-toggle-wrap {
    color: var(--color-primary, #ff6b6b);
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .faq-body {
    padding: 0 20px 18px 20px;
    border-top: 1px solid rgba(0, 0, 0, 0.04);
  }

  .faq-body p {
    font-size: 0.925rem !important;
    line-height: 1.6 !important;
    color: var(--color-text-secondary, #475569) !important;
    margin: 14px 0 !important;
  }

  .faq-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-primary, #ff6b6b);
    text-decoration: none !important;
  }

  .faq-link:hover {
    text-decoration: underline !important;
  }

  .empty-faq {
    text-align: center;
    padding: 40px 20px;
    background: var(--color-surface-variant, #f8fafc);
    border-radius: 14px;
    border: 1px dashed var(--color-outline, #cbd5e1);
  }

  .empty-icon-wrap {
    color: var(--color-text-tertiary, #94a3b8);
    margin-bottom: 12px;
    display: inline-flex;
  }

  .reset-link {
    background: none;
    border: none;
    color: var(--color-primary, #ff6b6b);
    font-weight: 700;
    cursor: pointer;
    text-decoration: underline;
  }

  /* Help CTA Banner */
  .help-cta-banner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    background: #0f172a;
    color: #ffffff;
    border-radius: 20px;
    padding: 28px 32px;
  }

  .cta-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.775rem;
    font-weight: 700;
    color: #ff9e5e;
    background: rgba(255, 158, 94, 0.12);
    padding: 4px 10px;
    border-radius: 20px;
    margin-bottom: 10px;
  }

  .cta-content h3 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 4px 0;
    color: #ffffff;
  }

  .cta-content p {
    font-size: 0.9rem !important;
    color: #e2e8f0 !important;
    margin: 0 !important;
  }

  .cta-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .btn-coral {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 22px;
    border-radius: 9999px;
    background: var(--color-primary);
    color: #ffffff !important;
    font-weight: 700 !important;
    font-size: 0.9rem;
    text-decoration: none !important;
    transition: all 0.25s ease;
  }

  .btn-coral:hover {
    background: #ff5252;
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(255, 107, 107, 0.35);
  }

  .btn-outline-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 9999px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: #ffffff !important;
    font-weight: 700 !important;
    font-size: 0.9rem;
    text-decoration: none !important;
    transition: all 0.25s ease;
  }

  .btn-outline-action:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
  }

  @media (max-width: 640px) {
    .help-cta-banner {
      flex-direction: column;
      align-items: flex-start;
      padding: 24px 20px;
    }
  }
</style>
