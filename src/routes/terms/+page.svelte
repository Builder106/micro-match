<script lang="ts">
  import StaticArticle from '$lib/components/StaticArticle.svelte';
  import Icon from '@iconify/svelte';

  const sections = [
    { id: 'notice', label: 'Project Notice', num: '01' },
    { id: 'disclaimer', label: 'Disclaimer', num: '02' },
    { id: 'liability', label: 'Liability', num: '03' },
    { id: 'acceptable-use', label: 'Account Use', num: '04' },
    { id: 'submissions', label: 'Submissions', num: '05' },
    { id: 'contact-info', label: 'Contact', num: '06' },
  ];
</script>

<StaticArticle
  title="Terms of Service"
  titleHighlight="Service"
  badge="Legal & Terms"
  lede="By using MicroMatch, you agree to these terms. Please read them carefully before creating an account or using the platform."
  updated="August 7, 2026"
  readTime="3 min read"
  {sections}
  showRelated={false}
  ctaTitle="Have questions about our Terms of Service?"
  ctaText="Reach out to our maintainer directly for legal inquiries or platform term clarifications."
  ctaPrimaryHref="mailto:legal@micromatch.app"
  ctaPrimaryLabel="Contact Legal Team"
  ctaSecondaryHref="/privacy"
  ctaSecondaryLabel="Read Privacy Policy"
>
  <!-- Section 1: Educational Notice -->
  <section id="notice" class="legal-card notice-card">
    <div class="legal-card-header">
      <div class="section-badge-pill">
        <span class="section-badge-num">01</span>
        <Icon icon="lucide:info" width="16" height="16" />
      </div>
      <h2>1. Educational & Non-Commercial Notice</h2>
    </div>
    <p>
      This service is developed and maintained solely as an individual educational and portfolio demonstration project. 
      The project is strictly non-commercial, generates no revenue, and does not constitute a commercial business entity or employment offering.
    </p>
  </section>

  <!-- Section 2: Disclaimer -->
  <section id="disclaimer" class="legal-card">
    <div class="legal-card-header">
      <div class="section-badge-pill">
        <span class="section-badge-num">02</span>
        <Icon icon="lucide:alert-triangle" width="16" height="16" />
      </div>
      <h2>2. "AS IS" & "AS AVAILABLE" Service Disclaimer</h2>
    </div>
    <p>
      MicroMatch is provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis without warranties of any kind, whether express or implied. 
      Because this is an active demonstration project, features may be modified, updated, or temporarily unavailable. 
      The platform may undergo periodic data resets or maintenance without prior notice.
    </p>
  </section>

  <!-- Section 3: Limitation of Liability -->
  <section id="liability" class="legal-card">
    <div class="legal-card-header">
      <div class="section-badge-pill">
        <span class="section-badge-num">03</span>
        <Icon icon="lucide:shield-alert" width="16" height="16" />
      </div>
      <h2>3. Limitation of Liability</h2>
    </div>
    <p>
      To the maximum extent permitted by law, the maintainer of MicroMatch shall not be held liable for any direct, indirect, incidental, 
      consequential, or special damages resulting from service downtime, data loss, unsubmitted micro-task proofs, or platform errors.
    </p>
  </section>

  <!-- Section 4: Account Responsibilities -->
  <section id="acceptable-use" class="legal-card">
    <div class="legal-card-header">
      <div class="section-badge-pill">
        <span class="section-badge-num">04</span>
        <Icon icon="lucide:user-check" width="16" height="16" />
      </div>
      <h2>4. Account Responsibilities & Acceptable Use</h2>
    </div>
    <p>
      When registering an account, you agree to provide accurate information and safeguard your login credentials:
    </p>
    <ul class="rules-list">
      <li>
        <Icon icon="lucide:check-circle-2" width="18" height="18" class="check-icon" />
        <span>Maintain accurate account credentials and protect your login security.</span>
      </li>
      <li>
        <Icon icon="lucide:check-circle-2" width="18" height="18" class="check-icon" />
        <span>Do not attempt unauthorized system access or upload malicious code.</span>
      </li>
      <li>
        <Icon icon="lucide:check-circle-2" width="18" height="18" class="check-icon" />
        <span>Do not submit unlawful, defamatory, or harmful content.</span>
      </li>
    </ul>
  </section>

  <!-- Section 5: NGO Listings & Proof Submissions -->
  <section id="submissions" class="legal-card">
    <div class="legal-card-header">
      <div class="section-badge-pill">
        <span class="section-badge-num">05</span>
        <Icon icon="lucide:file-text" width="16" height="16" />
      </div>
      <h2>5. NGO Listings and Volunteer Proof Submissions</h2>
    </div>
    <p>
      Micro-tasks published by NGOs and proof-of-work submitted by volunteers must comply with all applicable local laws and respect third-party intellectual property rights. 
      MicroMatch reserves the right to remove any listing, reject verifications, or suspend user accounts to preserve platform security and integrity.
    </p>
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
      If you have questions or legal inquiries regarding these Terms of Service, please contact <a href="mailto:legal@micromatch.app">legal@micromatch.app</a>.
    </p>
  </section>
</StaticArticle>
