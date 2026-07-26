<script lang="ts">
  import StaticArticle from '$lib/components/StaticArticle.svelte';
  export let data;
</script>

<StaticArticle
  title="Our Impact"
  lede="Real numbers from the MicroMatch community — updated live, never estimated."
>
  <div class="stat-grid">
    <div class="stat">
      <span class="stat-value">{data.stats.tasksCompleted}</span>
      <span class="stat-label">Tasks completed</span>
    </div>
    <div class="stat">
      <span class="stat-value">{data.stats.activeVolunteers}</span>
      <span class="stat-label">Active volunteers</span>
    </div>
    <div class="stat">
      <span class="stat-value">{data.stats.ngosOnboarded}</span>
      <span class="stat-label">NGOs onboarded</span>
    </div>
    <div class="stat">
      <span class="stat-value">{data.stats.badgesAwarded}</span>
      <span class="stat-label">Badges awarded</span>
    </div>
  </div>
  <p>
    Every number above comes directly from the tasks, claims, and badges recorded in MicroMatch — nothing here is a mockup or a projection. As the community grows, so do these counts.
  </p>
  <p>
    Want to be part of the next update? <a href="/for-volunteers">Join as a volunteer</a> or <a href="/for-ngos">post a task as an NGO</a>.
  </p>
</StaticArticle>

<style>
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
    margin: 0 0 var(--space-5) 0;
  }
  @media (min-width: 480px) {
    .stat-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  .stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: center;
    padding: var(--space-4) var(--space-2);
    background: var(--color-surface-variant, #f8f8f8);
    border-radius: var(--radius-md, 16px);
  }
  .stat-value {
    font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 800;
    color: var(--color-text);
  }
  .stat-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text-secondary);
  }
</style>
