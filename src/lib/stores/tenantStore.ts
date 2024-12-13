import { writable } from 'svelte/store';
import type { TenantConfig } from '$lib/types/cpi';

const env = (key: any) => process.env?.[key] || '';

interface TenantStoreState {
    availableTenants: TenantConfig[];
    selectedTenants: {
        env1: TenantConfig | null;
        env2: TenantConfig | null;
    };
}

function createTenantStore() {
    // Log environment variables for debugging
    console.log('ENV Variables:', {
        PQA_ENV_NAME: env('PUBLIC_PQA_ENV_NAME'),
        PQA_HOST: env('PUBLIC_PQA_HOST'),
        DEV_ENV_NAME: env('PUBLIC_DEV_ENV_NAME'),
        DEV_HOST: env('PUBLIC_DEV_HOST')
    });

    const availableTenants: TenantConfig[] = [
        {
            envName: env('PUBLIC_PQA_ENV_NAME') || 'pqa',
            host: env('PUBLIC_PQA_HOST') || '',
            tokenUrl: env('PUBLIC_PQA_TOKEN_URL') || '',
            clientId: env('PUBLIC_PQA_CLIENT_ID') || '',
            clientSecret: env('PUBLIC_PQA_CLIENT_SECRET') || ''
        },
        {
            envName: env('PUBLIC_DEV_ENV_NAME') || 'dev',
            host: env('PUBLIC_DEV_HOST') || '',
            tokenUrl: env('PUBLIC_DEV_TOKEN_URL') || '',
            clientId: env('PUBLIC_DEV_CLIENT_ID') || '',
            clientSecret: env('PUBLIC_DEV_CLIENT_SECRET') || ''
        }
    ];

    // Validate tenants
    const validTenants = availableTenants.filter(tenant =>
        tenant.host && tenant.tokenUrl && tenant.clientId && tenant.clientSecret
    );

    if (validTenants.length === 0) {
        console.error('No valid tenant configurations found. Check your .env file.');
    }

    const { subscribe, set, update } = writable<TenantStoreState>({
        availableTenants: validTenants,
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
            availableTenants: validTenants,
            selectedTenants: { env1: null, env2: null }
        })
    };
}

export const tenantStore = createTenantStore();
