<script lang="ts">
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import * as m from '$lib/paraglide/messages.js';
</script>

<Seo title={m.privacy_meta_title()} description={m.privacy_meta_description()} />

{#if page.data.locale && page.data.locale !== 'en'}<p class="notice">{m.legal_english_only()}</p>{/if}

<article class="legal" lang="en">
  <header class="page-head">
    <h1 class="display h-xl" tabindex="-1">Privacy Policy</h1>
    <p class="lede">This policy describes how MicroMatch collects, uses, and protects information when you access our non-commercial portfolio platform.</p>
    <p class="small muted">Updated August 7, 2026</p>
  </header>
  <div class="prose">
    <section id="notice">
      <h2>1. Educational & Non-Commercial Project Notice</h2>
      <p>
        MicroMatch is developed and maintained solely as an individual educational and portfolio demonstration project.
        It is not a registered corporate entity, generates no subscription or commercial revenue, and operates in full alignment
        with non-commercial F-1 status requirements.
      </p>
    </section>
    <section id="infrastructure">
      <h2>2. Infrastructure and Sub-processors</h2>
      <p>This application is hosted on Vercel Inc. and utilizes Appwrite as a backend-as-a-service (BaaS) provider:</p>
      <h3>Vercel</h3>
      <p class="small muted">Hosting & Edge Network</p>
      <p>
        Automatically collects visitor IP addresses, browser user-agent headers, request timestamps, and performance telemetry to route web traffic, manage edge caching, and maintain DDoS platform security.
      </p>
      <p><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel Privacy Policy</a></p>
      <h3>Appwrite</h3>
      <p class="small muted">Backend, Database & Storage</p>
      <p>
        Powers user account authentication (email addresses, names, hashed password credentials, and OAuth identity tokens), application database records (tasks, claims, badges, and NGO verification records), and user-uploaded media files.
      </p>
      <p><a href="https://appwrite.io/privacy" target="_blank" rel="noopener noreferrer">Appwrite Privacy Policy</a></p>
    </section>
    <section id="data-handling">
      <h2>3. Data Handling and Retention</h2>
      <p>
        We process user inputs—including profile metadata, micro-task claim submissions, proof-of-work documents, and NGO verification forms—strictly
        to operate core platform features (task matching, submission review, and badge minting).
      </p>
      <h3>Zero AI Model Training Guarantee</h3>
      <p>
        User uploads and documents are stored securely in Appwrite database tables and storage buckets.
        We do <strong>not</strong> sell personal data, nor do we utilize uploaded user documents or submission text to train artificial intelligence or machine learning models.
        Data is retained for as long as your account remains active or as required for platform security audit trails.
      </p>
    </section>
    <section id="cookies">
      <h2>4. Cookies and Local Storage</h2>
      <p>
        We do not use tracking cookies or third-party advertising trackers. Essential session tokens are managed to maintain secure authenticated state across web requests:
      </p>
      <ul>
        <li><code>mm_session</code>: Manages secure authenticated user session credentials via Appwrite cookies.</li>
        <li><code>mm_role</code>: Stores role preferences (Volunteer vs. NGO) in local storage for instantaneous UI routing.</li>
      </ul>
    </section>
    <section id="user-rights">
      <h2>5. Your Rights</h2>
      <p>You have full control over your data on MicroMatch:</p>
      <ul>
        <li><strong>Access & Correction:</strong> View and update your profile details and submitted task proofs anytime.</li>
        <li><strong>Account Deletion:</strong> Request complete account deletion and data export by emailing <a href="mailto:privacy@micromatch.app">privacy@micromatch.app</a>.</li>
        <li><strong>Policy Updates:</strong> Any policy updates will be posted directly to this page with an updated timestamp.</li>
      </ul>
    </section>
    <section id="contact-info">
      <h2>6. Contact Information</h2>
      <p>
        If you have questions, data requests, or privacy inquiries regarding this Privacy Policy, please email <a href="mailto:privacy@micromatch.app">privacy@micromatch.app</a>.
      </p>
    </section>
  </div>
</article>
