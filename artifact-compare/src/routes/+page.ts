// src/routes/+page.ts
import { PageLoad } from '$lib/types';

export const load: PageLoad = async () => {
    return {
        title: 'CPI Artifact Comparison'
    };
};
