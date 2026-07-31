<script lang="ts">
  import VolunteerDashboard from "$lib/components/VolunteerDashboard.svelte";
  import NGODashboard from "$lib/components/NGODashboard.svelte";
  export let data: {
    signedIn: boolean;
    userRole: string;
    userData: Record<string, unknown> | null;
  };
</script>

{#if data.userRole === 'ngo'}
  <NGODashboard {data} />
{:else}
  <VolunteerDashboard {data} />
{/if}

