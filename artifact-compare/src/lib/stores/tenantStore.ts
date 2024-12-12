

import { writable } from 'svelte/store';
import type { TenantConfig } from '$lib/types/cpi';

function createTenantStore() {
    const availableTenants: TenantConfig[] = [
        {
            envName: 'pqa',
            host: import.meta.env.PUBLIC_PQA_HOST,
            tokenUrl: import.meta.env.PUBLIC_PQA_TOKEN_URL,
            clientId: import.meta.env.PUBLIC_PQA_CLIENT_ID,
            clientSecret: import.meta.env.PUBLIC_PQA_CLIENT_SECRET
        },
        {
            envName: 'dev',
            host: import.meta.env.PUBLIC_DEV_HOST,
            tokenUrl: import.meta.env.PUBLIC_DEV_TOKEN_URL,
            clientId: import.meta.env.PUBLIC_DEV_CLIENT_ID,
            clientSecret: import.meta.env.PUBLIC_DEV_CLIENT_SECRET
        }
    ];

    const { subscribe, set, update } = writable({
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