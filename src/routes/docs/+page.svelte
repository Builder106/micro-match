<script lang="ts">
  import StaticArticle from '$lib/components/StaticArticle.svelte';
</script>

<StaticArticle title="Documentation" lede="Guides and references for using MicroMatch and integrating with the public API.">
  <h2>Public API</h2>
  <p>
    <a href="/docs/api">GET /api/tasks</a> — read-only JSON endpoint for task listings. No authentication required.
  </p>
  <p>
    Other API routes under <code style="background: var(--color-surface-variant); padding: 2px 6px; border-radius: var(--radius-xs);">/api/</code> (claims, profile, teams, verifications) require an authenticated session and are documented for internal use only.
  </p>
  <h2>Guides</h2>
  <p>
    New to the platform? Start with <a href="/how-it-works">How It Works</a>, then <a href="/for-ngos">For NGOs</a> or <a href="/for-volunteers">For Volunteers</a> depending on your role.
  </p>
  <p>
    Additional markdown guides ship in the repository under the <code style="background: var(--color-surface-variant); padding: 2px 6px; border-radius: var(--radius-xs);">docs/</code> folder.
  </p>
</StaticArticle>
