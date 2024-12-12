// src/lib/stores/tenantStore.ts
import { writable } from 'svelte/store';
import type { TenantConfig } from '$lib/types/cpi';
interface TenantStoreState {
    availableTenants: TenantConfig[];
    selectedTenants: {
        env1: TenantConfig | null;
        env2: TenantConfig | null;
    };
}

function createTenantStore() {
    const availableTenants: TenantConfig[] = [
        {
            envName: 'pqa', // can we use import.meta.env.PUBLIC_PQA_ENV_NAME as the envName? how does envName get used?
            host: import.meta.env.PUBLIC_PQA_HOST,
            tokenUrl: import.meta.env.PUBLIC_PQA_TOKEN_URL,
            clientId: import.meta.env.PUBLIC_PQA_CLIENT_ID,
            clientSecret: import.meta.env.PUBLIC_PQA_CLIENT_SECRET
        },
        {
            envName: 'dev', // can we use import.meta.env.PUBLIC_DEV_ENV_NAME as the envName? how does envName get used?
            host: import.meta.env.PUBLIC_DEV_HOST,
            tokenUrl: import.meta.env.PUBLIC_DEV_TOKEN_URL,
            clientId: import.meta.env.PUBLIC_DEV_CLIENT_ID,
            clientSecret: import.meta.env.PUBLIC_DEV_CLIENT_SECRET
        }
    ];

    const { subscribe, set, update } = writable<TenantStoreState>({
        availableTenants,
        selectedTenants: {
            env1: null,
            env2: null
        }
    });

    return {
        subscribe,
        selectTenant: (env: 'env1' | 'env2', tenant: TenantConfig) =>
            update(store => ({
                ...store,
                selectedTenants: {
                    ...store.selectedTenants,
                    [env]: tenant
                }
            })),
        reset: () => set({
            availableTenants,
            selectedTenants: { env1: null, env2: null }
        })
    };
}

export const tenantStore = createTenantStore();