<script lang="ts">
  import VolunteerDashboard from "$lib/components/VolunteerDashboard.svelte";
  import NGODashboard from "$lib/components/NGODashboard.svelte";
  import type { DashboardUserData } from "$lib/types";

  export let data: {
    signedIn: boolean;
    userRole: string;
    userData: DashboardUserData | null;
  };
</script>

{#if data.userRole === 'ngo'}
  <NGODashboard {data} />
{:else}
  <VolunteerDashboard {data} />
{/if}

