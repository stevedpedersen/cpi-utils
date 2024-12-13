import { writable } from "svelte/store";
import type { TenantConfig } from "$lib/types/cpi";

interface TenantStoreState {
  availableTenants: TenantConfig[];
  selectedTenants: {
    env1: TenantConfig | null;
    env2: TenantConfig | null;
  };
}

function createTenantStore() {
  const { subscribe, set, update } = writable<TenantStoreState>({
    availableTenants: [],
    selectedTenants: {
      env1: null,
      env2: null,
    },
  });

  return {
    subscribe,
    initialize: (tenants: TenantConfig[]) => {
      set({
        availableTenants: tenants,
        selectedTenants: {
          env1: null,
          env2: null,
        },
      });
    },
    selectTenant: (env: "env1" | "env2", tenant: TenantConfig) =>
      update((store) => ({
        ...store,
        selectedTenants: {
          ...store.selectedTenants,
          [env]: tenant,
        },
      })),
    reset: () =>
      set({
        availableTenants: [],
        selectedTenants: { env1: null, env2: null },
      }),
  };
}

export const tenantStore = createTenantStore();
