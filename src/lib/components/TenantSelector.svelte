<script lang="ts">
  // src/lib/components/TenantSelector.svelte
  import { tenantStore } from "$lib/stores/tenantStore";
  import type { TenantConfig } from "$lib/types/cpi";

  // let selectedEnv1: TenantConfig | null = $tenantStore.availableTenants && $tenantStore.availableTenants.length > 1 ? $tenantStore.availableTenants[1] : null;
  // let selectedEnv1: TenantConfig | null = $tenantStore.availableTenants?.[1] ?? null;
  // let selectedEnv2: TenantConfig | null = $tenantStore.availableTenants?.[0] ?? null;

  // $: {
  //   if (selectedEnv1) {
  //     tenantStore.selectTenant("env1", selectedEnv1);
  //   }
  //   if (selectedEnv2) {
  //     tenantStore.selectTenant("env2", selectedEnv2);
  //   }
  // }

  // const handleSelect = (env: "env1" | "env2", tenant: TenantConfig) => {
  //   if (env === "env1") {
  //     selectedEnv1 = tenant;
  //   } else if (env === "env2") {
  //     selectedEnv2 = tenant;
  //   }
  //   tenantStore.selectTenant(env, tenant);
  // }

  let { label, tenants, selectedTenant, onSelect } = $props();
  // let tenants: TenantConfig[] = []; // Expect a list of tenant objects
  // let selectedTenant: TenantConfig | null = null;
  // let onSelect; // Callback when a tenant is selected
  // export { tenants, selectedTenant, onSelect, label };
</script>

<div class="tenant-selector">
<label for="tenant-select">Select Tenant:</label>
<select
  id="tenant-select"
  bind:value={selectedTenant}
  onchange={() => onSelect(selectedTenant)}
>
  <!-- <option value="" disabled selected>
    -- Select Tenant --
  </option> -->
  <option value="" disabled selected>
    {label}
  </option>
  {#each tenants as tenant}
    <option value={tenant}>
      {tenant.name} ({tenant.host})
    </option>
  {/each}
</select>
</div>

<!-- <div class="tenant-selector">
  <select bind:value={selectedEnv1} on:change={() => handleSelect}>
    <option value="" disabled selected>
      -- Select Tenant 1 --
    </option>
    {#each $tenantStore.availableTenants as tenant}
      <option value={tenant}>{tenant.envName}</option>
    {/each}
  </select>

  <select bind:value={selectedEnv2} on:change={() => handleSelect}>
    <option value="" disabled selected>
      -- Select Tenant 2 --
    </option>
    {#each $tenantStore.availableTenants as tenant}
      <option value={tenant}>{tenant.envName}</option>
    {/each}
  </select>
</div> -->

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
