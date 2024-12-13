<script lang="ts">
  // src/lib/components/TenantSelector.svelte
  import { tenantStore } from '$lib/stores/tenantStore';
  import type { TenantConfig } from '$lib/types/cpi';

  let selectedEnv1: TenantConfig | null = $tenantStore.availableTenants[1];
  let selectedEnv2: TenantConfig | null = $tenantStore.availableTenants[0];

  $: {
    if (selectedEnv1) {
      tenantStore.selectTenant('env1', selectedEnv1);
    }
    if (selectedEnv2) {
      tenantStore.selectTenant('env2', selectedEnv2);
    }
  }
</script>

<div class="tenant-selector">
  <select bind:value={selectedEnv1}>
    <option value={null}>Select Environment 1</option>
    {#each $tenantStore.availableTenants as tenant}
      {console.log('TENANT STORE: ', $tenantStore.availableTenants)}
      <option value={tenant}>{`[${tenant.clientSecret}]`}</option>
    {/each}
  </select>

  <select bind:value={selectedEnv2}>
    <option value={null}>Select Environment 2</option>
    {#each $tenantStore.availableTenants as tenant}
      <option value={tenant}>{tenant.envName}</option>
    {/each}
  </select>
</div>

<style>
  .tenant-selector {
    display: flex;
    gap: 1rem;
  }
  select {
    padding: 0.5rem;
    width: 200px;
  }
</style>