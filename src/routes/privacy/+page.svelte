<script lang="ts">
  import StaticArticle from '$lib/components/StaticArticle.svelte';
</script>

<StaticArticle
  title="Privacy Policy"
  lede="This policy describes how MicroMatch collects, uses, and protects information when you access our non-commercial portfolio platform."
  updated="August 7, 2026"
>
  <h2>1. Educational & Non-Commercial Project Notice</h2>
  <p>
    MicroMatch is developed and maintained solely as an individual educational and portfolio demonstration project. 
    It is not a registered corporate entity, generates no subscription or commercial revenue, and operates in full alignment 
    with non-commercial F-1 status requirements.
  </p>

  <h2>2. Infrastructure and Sub-processors</h2>
  <p>
    This application is hosted on Vercel Inc. and utilizes Appwrite as a backend-as-a-service (BaaS) provider:
  </p>
  <ul>
    <li>
      <strong>Vercel (Hosting & Edge Network):</strong> Automatically collects visitor IP addresses, browser user-agent headers, 
      request timestamps, and performance telemetry to route web traffic, manage edge caching, and maintain DDoS platform security. 
      For further details, refer to <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel’s Privacy Policy</a>.
    </li>
    <li>
      <strong>Appwrite (Backend, Database & Storage):</strong> Powers user account authentication (email addresses, names, hashed password credentials, and OAuth identity tokens), application database records (tasks, claims, badges, and NGO verification records), and user-uploaded media files. All account data and uploaded files are securely processed and stored on Appwrite infrastructure. For further details, refer to <a href="https://appwrite.io/privacy" target="_blank" rel="noopener noreferrer">Appwrite’s Privacy Policy</a>.
    </li>
  </ul>

  <h2>3. Data Handling and Retention</h2>
  <p>
    We process user inputs—including profile metadata, micro-task claim submissions, proof-of-work documents, and NGO verification forms—strictly 
    to operate core platform features (task matching, submission review, and badge minting). 
  </p>
  <p>
    User uploads and documents are stored in Appwrite database tables and storage buckets. 
    We do <strong>not</strong> sell personal data, nor do we utilize uploaded user documents or submission text to train artificial intelligence or machine learning models. 
    Data is retained for as long as your account remains active or as required for platform security audit trails.
  </p>

  <h2>4. Cookies and Local Storage</h2>
  <p>
    We do not use tracking cookies or third-party advertising trackers. Essential session tokens (such as <code>mm_session</code> and <code>mm_role</code>) 
    are managed via Appwrite cookies and browser local storage to maintain secure authenticated state across web requests.
  </p>

  <h2>5. Your Rights and Contact Information</h2>
  <p>
    You have the right to request access to, correction of, or deletion of your account data. 
    To request account deletion or data export, contact us at <a href="mailto:privacy@micromatch.app">privacy@micromatch.app</a>. 
    We may periodically update this policy; any changes will be posted directly to this page with an updated timestamp.
  </p>
</StaticArticle>
