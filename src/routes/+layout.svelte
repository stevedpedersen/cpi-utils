<script context="module" lang="ts">
  import type { LoadEvent } from "@sveltejs/kit";
  export async function load({ fetch }: LoadEvent) {
    try {
      const res = await fetch("/api/tenants");
      if (res.ok) {
        const tenants = await res.json();
        return { tenants };
      } else {
        console.error("Failed to fetch tenants:", res.status);
        return { tenants: [] };
      }
    } catch (error) {
      console.error("Error fetching tenants:", error);
      return { tenants: [] };
    }
  }

  import { tenantStore } from "$lib/stores/tenantStore";
  import type { TenantConfig } from "$lib/types/cpi";
  let tenants: TenantConfig[] = $state([]);
  // Initialize the tenantStore with fetched tenants
  tenantStore.initialize(tenants);

  export { tenants };
</script>

<header>
  <h2>Tenant Manager</h2>
</header>

<main>
  <slot />
</main>
