<script lang="ts">
  import StaticArticle from '$lib/components/StaticArticle.svelte';
</script>

<StaticArticle
  title="MicroMatch Documentation Hub"
  lede="Explore developer API specifications, integration guides, and platform handbooks for volunteers and NGOs."
  wide={true}
  showRelated={false}
>
  <div class="docs-hero-badge">
    <span class="brand-pill">MicroMatch</span>
    <span class="hub-tag">Developer & Platform Docs</span>
  </div>

  <div class="docs-grid">
    <div class="doc-card featured-card">
      <div class="card-top">
        <div class="icon-wrap coral-glow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="card-icon">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </div>
        <span class="role-badge role-api">REST API v1</span>
      </div>
      <h3>Developer API Reference</h3>
      <p>Interactive REST API specification with 20+ endpoints for task discovery, claims, NGO verifications, badge issuance, and auth.</p>

      <div class="chip-list">
        <code>GET /api/tasks</code>
        <code>POST /api/claims</code>
        <code>POST /api/verifications</code>
        <code>GET /api/badges</code>
      </div>

      <div class="card-action">
        <a href="/docs/api" class="btn-primary-coral">Explore API Reference →</a>
      </div>
    </div>

    <div class="doc-card">
      <div class="card-top">
        <div class="icon-wrap indigo-glow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="card-icon">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <span class="role-badge role-user">Volunteer Guide</span>
      </div>
      <h3>Volunteer Playbook</h3>
      <p>Learn how to browse bite-sized 15–60 minute tasks, submit proof of completion, earn verifiable civic badges, and build streaks.</p>

      <ul class="feature-bullets">
        <li>Finding tasks by time & language</li>
        <li>Submitting GitHub / URL proof</li>
        <li>Unlocking badges & XP progression</li>
      </ul>

      <div class="card-action">
        <a href="/for-volunteers" class="btn-secondary-link">Read Volunteer Guide →</a>
      </div>
    </div>

    <div class="doc-card">
      <div class="card-top">
        <div class="icon-wrap rose-glow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="card-icon">
            <path d="M3 21h18"></path>
            <path d="M6 21V7l6-4 6 4v14"></path>
            <path d="M9 10h.01"></path>
            <path d="M15 10h.01"></path>
          </svg>
        </div>
        <span class="role-badge role-ngo">NGO Handbook</span>
      </div>
      <h3>NGO Partner Guide</h3>
      <p>Scope modular needs into actionable micro-tasks, complete organization verification, manage team permissions, and review claims.</p>

      <ul class="feature-bullets">
        <li>EIN & Document Verification</li>
        <li>Task creation & moderation rules</li>
        <li>Reviewing & approving claims</li>
      </ul>

      <div class="card-action">
        <a href="/for-ngos" class="btn-secondary-link">Read NGO Guide →</a>
      </div>
    </div>

    <div class="doc-card">
      <div class="card-top">
        <div class="icon-wrap teal-glow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="card-icon">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </div>
        <span class="role-badge role-system">Platform Spec</span>
      </div>
      <h3>Platform Architecture</h3>
      <p>Discover how MicroMatch connects SvelteKit SSR, Appwrite BaaS, Content Safety AI, and translation engines into a seamless civic platform.</p>

      <ul class="feature-bullets">
        <li>Real-time translation caching</li>
        <li>Content safety moderation</li>
        <li>Appwrite Database & Storage</li>
      </ul>

      <div class="card-action">
        <a href="/how-it-works" class="btn-secondary-link">How MicroMatch Works →</a>
      </div>
    </div>
  </div>

  <div class="quick-resources">
    <h3>Quick Reference</h3>
    <div class="resources-grid">
      <a href="/impact" class="resource-tile">
        <div class="resource-title">
          <span class="tile-icon">📊</span>
          <strong>Platform Impact</strong>
        </div>
        <p>Live stats on completed micro-tasks, participating NGOs, and volunteer hours.</p>
      </a>

      <a href="/about" class="resource-tile">
        <div class="resource-title">
          <span class="tile-icon">🌱</span>
          <strong>About MicroMatch</strong>
        </div>
        <p>Our mission to lower civic barriers and empower grassroots global initiatives.</p>
      </a>

      <a href="/help" class="resource-tile">
        <div class="resource-title">
          <span class="tile-icon">💬</span>
          <strong>Help & Support</strong>
        </div>
        <p>Frequently asked questions and support for volunteers and organization admins.</p>
      </a>
    </div>
  </div>
</StaticArticle>

<style>
  .docs-hero-badge {
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

  .docs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    margin-bottom: 40px;
  }

  .doc-card {
    display: flex;
    flex-direction: column;
    background: var(--color-surface, #ffffff);
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.1));
    border-radius: 16px;
    padding: 26px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .doc-card:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 107, 107, 0.4);
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.07);
  }

  .doc-card.featured-card {
    background: linear-gradient(135deg, #ffffff 0%, #fffbfb 100%);
    border-color: rgba(255, 107, 107, 0.25);
  }

  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface-variant, #f8fafc);
  }

  .card-icon {
    width: 22px;
    height: 22px;
  }

  .coral-glow {
    background: #fff1f1;
    color: #ff6b6b;
  }

  .indigo-glow {
    background: #eff6ff;
    color: #3b82f6;
  }

  .rose-glow {
    background: #fff1f2;
    color: #e11d48;
  }

  .teal-glow {
    background: #f0fdf4;
    color: #10b981;
  }

  .role-badge {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
  }

  .role-api {
    background: #ff6b6b;
    color: #ffffff;
  }

  .role-user {
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }

  .role-ngo {
    background: #fff1f2;
    color: #be123c;
    border: 1px solid #fecdd3;
  }

  .role-system {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
  }

  .doc-card h3 {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0 0 8px 0;
    color: var(--color-text, #0f172a);
    letter-spacing: -0.01em;
  }

  .doc-card p {
    font-size: 0.925rem !important;
    line-height: 1.55 !important;
    color: var(--color-text-secondary, #475569) !important;
    margin: 0 0 16px 0 !important;
    flex-grow: 1;
  }

  .chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 20px;
  }

  .chip-list code {
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.775rem;
    padding: 3px 8px;
    border-radius: 6px;
    background: rgba(15, 23, 42, 0.05);
    color: #334155;
  }

  .feature-bullets {
    list-style: none;
    padding: 0;
    margin: 0 0 20px 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .feature-bullets li {
    font-size: 0.85rem;
    color: var(--color-text-secondary, #475569);
    position: relative;
    padding-left: 16px;
  }

  .feature-bullets li::before {
    content: "•";
    position: absolute;
    left: 4px;
    color: var(--color-primary, #ff6b6b);
    font-weight: bold;
  }

  .card-action {
    margin-top: auto;
  }

  .btn-primary-coral {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 10px 18px;
    border-radius: 10px;
    background: var(--color-primary, #ff6b6b);
    color: #ffffff !important;
    font-weight: 700 !important;
    font-size: 0.9rem;
    text-decoration: none !important;
    transition: background 0.15s ease, transform 0.15s ease;
  }

  .btn-primary-coral:hover {
    background: #ff5252;
    transform: translateY(-1px);
  }

  .btn-secondary-link {
    display: inline-flex;
    align-items: center;
    font-weight: 700 !important;
    font-size: 0.9rem;
    color: var(--color-primary, #ff6b6b) !important;
    text-decoration: none !important;
    transition: gap 0.15s ease;
  }

  .btn-secondary-link:hover {
    text-decoration: underline !important;
  }

  .quick-resources {
    border-top: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.08));
    padding-top: 28px;
  }

  .quick-resources h3 {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0 0 16px 0;
    color: var(--color-text, #0f172a);
  }

  .resources-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
  }

  .resource-tile {
    display: flex;
    flex-direction: column;
    padding: 18px;
    border-radius: 12px;
    background: var(--color-surface-variant, #f8fafc);
    border: 1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.08));
    text-decoration: none !important;
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  .resource-tile:hover {
    background: #f1f5f9;
    border-color: rgba(255, 107, 107, 0.3);
  }

  .resource-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .resource-title strong {
    font-size: 0.95rem;
    color: var(--color-text, #0f172a);
  }

  .tile-icon {
    font-size: 1.1rem;
  }

  .resource-tile p {
    font-size: 0.85rem !important;
    line-height: 1.45 !important;
    color: var(--color-text-secondary, #64748b) !important;
    margin: 0 !important;
  }
</style>
