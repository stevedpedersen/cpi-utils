// src/lib/components/ComparisonReport.svelte:

<script lang="ts">
  import { comparisonStore } from '$lib/stores/comparisonStore';
  import type { PackageComparison } from '$lib/types/cpi';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let comparison: PackageComparison[] | null = null;

  function selectPackage(pkg: PackageComparison) {
    dispatch('packageSelect', pkg);
  }

  function getStatusColor(status: string) {
    switch(status) {
      case 'Exact Match': return 'green';
      case 'Subset Match': return 'orange';
      case 'Missing in Env1':
      case 'Missing in Env2': return 'red';
      default: return 'gray';
    }
  }
</script>

{#if comparison}
  <div class="comparison-report">
    {#each comparison as pkg}
      <!-- svelte-ignore a11y_unknown_role -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div 
        class="package-row" 
        style="color: {getStatusColor(pkg.status)}"
        on:click={() => selectPackage(pkg)}
      >
      <!-- role="icon"
      aria-labelledby="foo"
      tabindex="2"   -->
        <span>{pkg.packageName}</span>
        <span>{pkg.status}</span>
      </div>
    {/each}
  </div>
{:else}
  <p>No comparison available</p>
{/if}
<style>
  .comparison-report {
    max-height: 400px;
    overflow-y: auto;
  }
  .package-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  .package-row:hover {
    background-color: #f0f0f0;
  }
</style>
