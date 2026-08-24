<script lang="ts">
  import StaticArticle from '$lib/components/StaticArticle.svelte';
  import Icon from '@iconify/svelte';

  const sections = [
    { id: 'notice', label: 'Project Notice', num: '01' },
    { id: 'infrastructure', label: 'Sub-processors', num: '02' },
    { id: 'data-handling', label: 'Data & AI', num: '03' },
    { id: 'cookies', label: 'Cookies', num: '04' },
    { id: 'user-rights', label: 'Your Rights', num: '05' },
    { id: 'contact-info', label: 'Contact', num: '06' },
  ];
</script>

<StaticArticle
  title="Privacy Policy"
  titleHighlight="Policy"
  badge="Legal & Compliance"
  lede="This policy describes how MicroMatch collects, uses, and protects information when you access our non-commercial portfolio platform."
  updated="August 7, 2026"
  readTime="4 min read"
  {sections}
  showRelated={false}
  ctaTitle="Questions about our Privacy Policy?"
  ctaText="Our team is dedicated to transparency. Contact us directly for any data deletion, export, or privacy inquiries."
  ctaPrimaryHref="mailto:privacy@micromatch.app"
  ctaPrimaryLabel="Contact Privacy Team"
  ctaSecondaryHref="/terms"
  ctaSecondaryLabel="View Terms of Service"
>
  <!-- Section 1: Notice -->
  <section id="notice" class="legal-card notice-card">
    <div class="legal-card-header">
      <div class="section-badge-pill">
        <span class="section-badge-num">01</span>
        <Icon icon="lucide:shield-check" width="16" height="16" />
      </div>
      <h2>1. Educational & Non-Commercial Project Notice</h2>
    </div>
    <p>
      MicroMatch is developed and maintained solely as an individual educational and portfolio demonstration project. 
      It is not a registered corporate entity, generates no subscription or commercial revenue, and operates in full alignment 
      with non-commercial F-1 status requirements.
    </p>
  </section>

  <!-- Section 2: Infrastructure & Sub-processors -->
  <section id="infrastructure" class="legal-card">
    <div class="legal-card-header">
      <div class="section-badge-pill">
        <span class="section-badge-num">02</span>
        <Icon icon="lucide:server" width="16" height="16" />
      </div>
      <h2>2. Infrastructure and Sub-processors</h2>
    </div>
    <p class="section-intro">
      This application is hosted on Vercel Inc. and utilizes Appwrite as a backend-as-a-service (BaaS) provider:
    </p>

    <div class="vendor-grid">
      <!-- Vercel Vendor Card -->
      <div class="vendor-card">
        <div class="vendor-head">
          <div class="vendor-icon vercel-icon">
            <Icon icon="simple-icons:vercel" width="20" height="20" />
          </div>
          <div>
            <h3>Vercel</h3>
            <span class="vendor-role">Hosting & Edge Network</span>
          </div>
        </div>
        <p>
          Automatically collects visitor IP addresses, browser user-agent headers, request timestamps, and performance telemetry to route web traffic, manage edge caching, and maintain DDoS platform security.
        </p>
        <a
          href="https://vercel.com/legal/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          class="vendor-link"
        >
          Vercel Privacy Policy <Icon icon="lucide:arrow-up-right" width="14" height="14" />
        </a>
      </div>

      <!-- Appwrite Vendor Card -->
      <div class="vendor-card">
        <div class="vendor-head">
          <div class="vendor-icon appwrite-icon">
            <Icon icon="simple-icons:appwrite" width="20" height="20" />
          </div>
          <div>
            <h3>Appwrite</h3>
            <span class="vendor-role">Backend, Database & Storage</span>
          </div>
        </div>
        <p>
          Powers user account authentication (email addresses, names, hashed password credentials, and OAuth identity tokens), application database records (tasks, claims, badges, and NGO verification records), and user-uploaded media files.
        </p>
        <a
          href="https://appwrite.io/privacy"
          target="_blank"
          rel="noopener noreferrer"
          class="vendor-link"
        >
          Appwrite Privacy Policy <Icon icon="lucide:arrow-up-right" width="14" height="14" />
        </a>
      </div>
    </div>
  </section>

  <!-- Section 3: Data Handling & AI Policy -->
  <section id="data-handling" class="legal-card">
    <div class="legal-card-header">
      <div class="section-badge-pill">
        <span class="section-badge-num">03</span>
        <Icon icon="lucide:database" width="16" height="16" />
      </div>
      <h2>3. Data Handling and Retention</h2>
    </div>
    <p>
      We process user inputs—including profile metadata, micro-task claim submissions, proof-of-work documents, and NGO verification forms—strictly 
      to operate core platform features (task matching, submission review, and badge minting).
    </p>

    <!-- Zero AI Training Guarantee Box -->
    <div class="guarantee-box">
      <div class="guarantee-head">
        <Icon icon="lucide:lock" width="18" height="18" class="guarantee-icon" />
        <h3>Zero AI Model Training Guarantee</h3>
      </div>
      <p>
        User uploads and documents are stored securely in Appwrite database tables and storage buckets. 
        We do <strong>not</strong> sell personal data, nor do we utilize uploaded user documents or submission text to train artificial intelligence or machine learning models. 
        Data is retained for as long as your account remains active or as required for platform security audit trails.
      </p>
    </div>
  </section>

  <!-- Section 4: Cookies & Local Storage -->
  <section id="cookies" class="legal-card">
    <div class="legal-card-header">
      <div class="section-badge-pill">
        <span class="section-badge-num">04</span>
        <Icon icon="lucide:cookie" width="16" height="16" />
      </div>
      <h2>4. Cookies and Local Storage</h2>
    </div>
    <p>
      We do not use tracking cookies or third-party advertising trackers. Essential session tokens are managed to maintain secure authenticated state across web requests:
    </p>

    <div class="tokens-list">
      <div class="token-item">
        <code>mm_session</code>
        <span>Manages secure authenticated user session credentials via Appwrite cookies.</span>
      </div>
      <div class="token-item">
        <code>mm_role</code>
        <span>Stores role preferences (Volunteer vs. NGO) in local storage for instantaneous UI routing.</span>
      </div>
    </div>
  </section>

  <!-- Section 5: Your Rights -->
  <section id="user-rights" class="legal-card">
    <div class="legal-card-header">
      <div class="section-badge-pill">
        <span class="section-badge-num">05</span>
        <Icon icon="lucide:user-check" width="16" height="16" />
      </div>
      <h2>5. Your Rights</h2>
    </div>
    <p>
      You have full control over your data on MicroMatch:
    </p>
    <ul class="rights-list">
      <li>
        <Icon icon="lucide:check-circle-2" width="18" height="18" class="check-icon" />
        <span><strong>Access & Correction:</strong> View and update your profile details and submitted task proofs anytime.</span>
      </li>
      <li>
        <Icon icon="lucide:check-circle-2" width="18" height="18" class="check-icon" />
        <span><strong>Account Deletion:</strong> Request complete account deletion and data export by emailing <a href="mailto:privacy@micromatch.app">privacy@micromatch.app</a>.</span>
      </li>
      <li>
        <Icon icon="lucide:check-circle-2" width="18" height="18" class="check-icon" />
        <span><strong>Policy Updates:</strong> Any policy updates will be posted directly to this page with an updated timestamp.</span>
      </li>
    </ul>
  </section>

  <!-- Section 6: Contact Information -->
  <section id="contact-info" class="legal-card">
    <div class="legal-card-header">
      <div class="section-badge-pill">
        <span class="section-badge-num">06</span>
        <Icon icon="lucide:mail" width="16" height="16" />
      </div>
      <h2>6. Contact Information</h2>
    </div>
    <p>
      If you have questions, data requests, or privacy inquiries regarding this Privacy Policy, please email <a href="mailto:privacy@micromatch.app">privacy@micromatch.app</a>.
    </p>
  </section>
</StaticArticle>
