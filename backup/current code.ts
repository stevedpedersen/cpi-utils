// src/lib/components/ArtifactDetailModal.svelte
<script lang="ts" >
    import { onMount } from 'svelte';
import Chart from 'chart.js/auto';
import type { PackageComparison, PackageArtifacts } from '$lib/types/cpi';

export let packageDetails: PackageComparison;
export let closeModal: () => void;

let artifactTypeChart: Chart;
let statusChart: Chart;

onMount(() => {
    // Artifact Type Distribution Chart
    const artifactTypesCtx = document.getElementById('artifactTypeChart') as HTMLCanvasElement;
    artifactTypeChart = new Chart(artifactTypesCtx, {
        type: 'pie',
        data: {
            labels: ['iFlows', 'Value Mappings', 'Script Collections', 'Message Mappings'],
            datasets: [{
                data: [
                    packageDetails.artifacts.iflows.length,
                    packageDetails.artifacts.valueMappings.length,
                    packageDetails.artifacts.scriptCollections.length,
                    packageDetails.artifacts.messageMappings.length
                ],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)'
                ]
            }]
        }
    });

    // Artifact Status Chart
    const statusCtx = document.getElementById('statusChart') as HTMLCanvasElement;
    const statusCounts = {
        Match: 0,
        'Missing in Env1': 0,
        'Missing in Env2': 0
    };

    ['iflows', 'valueMappings', 'scriptCollections', 'messageMappings'].forEach(type => {
        packageDetails.artifacts[type as keyof PackageArtifacts].forEach(artifact => {
            statusCounts[artifact.status || 'Match']++;
        });
    });

    statusChart = new Chart(statusCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                label: 'Artifact Status',
                data: Object.values(statusCounts),
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)'
                ]
            }]
        }
    });
});
</script>

    < div class="modal" >
        <div class="modal-content" >
            <h2>{ packageDetails.packageName } </h2>
            < p > Overall Status: { packageDetails.status } </p>

                < div class="charts-container" >
                    <div class="chart-wrapper" >
                        <h3>Artifact Type Distribution </h3>
                            < canvas id = "artifactTypeChart" > </canvas>
                                </div>
                                < div class="chart-wrapper" >
                                    <h3>Artifact Status </h3>
                                        < canvas id = "statusChart" > </canvas>
                                            </div>
                                            </div>

                                            < div class="artifact-details" >
                                                { #each Object.entries(packageDetails.artifacts) as [type, artifacts] }
                                                < div class="artifact-section" >
                                                    <h3>{ type.replace(/([A-Z])/g, ' $1').toUpperCase() } </h3>
                                                    < table >
                                                    <thead>
                                                    <tr>
                                                    <th>Artifact ID </th>
                                                        < th > Status </th>
                                                        </tr>
                                                        </thead>
                                                        <tbody>
{ #each artifacts as artifact }
<tr>
    <td>{ artifact.Id } </td>
    < td > { artifact.status || 'Match' } </td>
    </tr>
{/each }
</tbody>
    </table>
    </div>
{/each }
</div>

    < button on: click = { closeModal } > Close </button>
        </div>
        </div>
  
  <style>
            .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100 %;
    height: 100 %;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify - content: center;
    align - items: center;
    z - index: 1000;
}
  
    .modal - content {
    background: white;
    padding: 20px;
    border - radius: 5px;
    width: 90 %;
    max - width: 1000px;
    max - height: 90 %;
    overflow - y: auto;
}
  
    .charts - container {
    display: flex;
    justify - content: space - between;
}
  
    .chart - wrapper {
    width: 48 %;
}
  
    .artifact - details {
    margin - top: 20px;
}
  
    table {
    width: 100 %;
    border - collapse: collapse;
}

th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text - align: left;
}
</style>




    // src/lib/components/ComparisonReport.svelte:
    < script lang = "ts" >
  import { comparisonStore } from '$lib/stores/comparisonStore';
import type { PackageComparison } from '$lib/types/cpi';
import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

export let comparison: PackageComparison[] | null = null;

function selectPackage(pkg: PackageComparison) {
    dispatch('packageSelect', pkg);
}

function getStatusColor(status: string) {
    switch (status) {
        case 'Exact Match': return 'green';
        case 'Subset Match': return 'orange';
        case 'Missing in Env1':
        case 'Missing in Env2': return 'red';
        default: return 'gray';
    }
}
</script>

{ #if comparison }
<div class="comparison-report" >
    { #each comparison as pkg }
    < !--svelte - ignore a11y_unknown_role-- >
        <!--svelte - ignore a11y_click_events_have_key_events-- >
            <!--svelte - ignore a11y_no_static_element_interactions-- >
                <div 
        class="package-row"
style = "color: {getStatusColor(pkg.status)}"
on: click = {() => selectPackage(pkg)}
      >
    <!--role="icon"
aria - labelledby="foo"
tabindex = "2"   -- >
    <span>{ pkg.packageName } </span>
    < span > { pkg.status } </span>
    </div>
{/each }
</div>
{:else }
<p>No comparison available </p>
{/if }
<style>
  .comparison - report {
    max - height: 400px;
    overflow - y: auto;
}
  .package - row {
    display: flex;
    justify - content: space - between;
    padding: 0.5rem;
    border - bottom: 1px solid #eee;
    cursor: pointer;
    transition: background - color 0.3s;
}
  .package - row:hover {
    background - color: #f0f0f0;
}
</style>


    // src/lib/components/ComparisonSummaryDashboard.svelte 
    < script lang = "ts" >
    import { onMount } from 'svelte';
import Chart from 'chart.js/auto';
import type { PackageComparison } from '$lib/types/cpi';

export let comparison: PackageComparison[];

let summaryChart: Chart;
let performanceChart: Chart;

function calculateSummaryStats() {
    return {
        exactMatches: comparison.filter(pkg => pkg.status === 'Exact Match').length,
        subsetMatches: comparison.filter(pkg => pkg.status === 'Subset Match').length,
        missingInEnv1: comparison.filter(pkg => pkg.status === 'Missing in Env1').length,
        missingInEnv2: comparison.filter(pkg => pkg.status === 'Missing in Env2').length
    };
}

onMount(() => {
    const stats = calculateSummaryStats();

    // Summary Chart
    const summaryCtx = document.getElementById('summaryChart') as HTMLCanvasElement;
    summaryChart = new Chart(summaryCtx, {
        type: 'doughnut',
        data: {
            labels: ['Exact Match', 'Subset Match', 'Missing in Env1', 'Missing in Env2'],
            datasets: [{
                data: [
                    stats.exactMatches,
                    stats.subsetMatches,
                    stats.missingInEnv1,
                    stats.missingInEnv2
                ],
                backgroundColor: [
                    'green', 'orange', 'red', 'blue'
                ]
            }]
        }
    });
});
</script>

    < div class="dashboard" >
        <div class="chart-container" >
            <h3>Comparison Summary </h3>
                < canvas id = "summaryChart" > </canvas>
                    </div>
                    </div>
  
  <style>
                        .dashboard {
    display: flex;
    justify - content: center;
}
    .chart - container {
    width: 400px;
    height: 400px;
}
</style>




    // src/lib/components/TenantSelector.svelte
    < script lang = "ts" >
  import { tenantStore } from '$lib/stores/tenantStore';
import type { TenantConfig } from '$lib/types/cpi';

let selectedEnv1: TenantConfig | null = null;
let selectedEnv2: TenantConfig | null = null;

$: {
    if (selectedEnv1) {
        tenantStore.selectTenant('env1', selectedEnv1);
    }
    if (selectedEnv2) {
        tenantStore.selectTenant('env2', selectedEnv2);
    }
}
</script>

    < div class="tenant-selector" >
        <select bind: value = { selectedEnv1 } >
            <option value={ null }> Select Environment 1 </option>
{ #each $tenantStore.availableTenants as tenant }
<option value={ tenant }> { tenant.envName } </option>
{/each }
</select>

    < select bind: value = { selectedEnv2 } >
        <option value={ null }> Select Environment 2 </option>
{ #each $tenantStore.availableTenants as tenant }
<option value={ tenant }> { tenant.envName } </option>
{/each }
</select>
    </div>

<style>
        .tenant - selector {
    display: flex;
    gap: 1rem;
}
  select {
    padding: 0.5rem;
    width: 200px;
}
</style>





// src/lib/services/comparisonService.ts
import type { PackageComparison, Artifact } from '$lib/types/cpi';

export class ComparisonService {
    comparePackages(env1Packages: any[], env2Packages: any[]): PackageComparison[] {
        const comparison: PackageComparison[] = [];

        env1Packages.forEach(env1Pkg => {
            const matchedEnv2Pkg = env2Packages.find(
                env2Pkg => env2Pkg.Name === env1Pkg.Name
            );

            if (matchedEnv2Pkg) {
                const artifactsComparison = this.compareArtifacts(env1Pkg, matchedEnv2Pkg);
                const status = this.determinePackageStatus(artifactsComparison);

                comparison.push({
                    packageName: env1Pkg.Name,
                    status,
                    artifacts: artifactsComparison
                });
            } else {
                comparison.push({
                    packageName: env1Pkg.Name,
                    status: 'Missing in Env2',
                    artifacts: {
                        iflows: [],
                        valueMappings: [],
                        scriptCollections: [],
                        messageMappings: []
                    }
                });
            }
        });

        return comparison;
    }

    private compareArtifacts(env1Pkg: any, env2Pkg: any) {
        const artifactTypes = [
            'iflows', 'valueMappings',
            'scriptCollections', 'messageMappings'
        ];

        return artifactTypes.reduce((acc, type) => {
            acc[type] = this.compareArtifactList(
                env1Pkg.artifacts[type] || [],
                env2Pkg.artifacts[type] || []
            );
            return acc;
        }, {} as any);
    }

    private compareArtifactList(env1Artifacts: Artifact[], env2Artifacts: Artifact[]): Artifact[] {
        const env2ArtifactIds = env2Artifacts.map(a => a.Id);

        return env1Artifacts.map(artifact => ({
            ...artifact,
            status: env2ArtifactIds.includes(artifact.Id) ? 'Match' : 'Missing in Env2'
        }));
    }

    private determinePackageStatus(artifacts: any): PackageComparison['status'] {
        const allMatch = Object.values(artifacts).every(
            (list: Artifact[]) => list.every(item => item.status === 'Match')
        );

        return allMatch ? 'Exact Match' : 'Subset Match';
    }
}



// src/lib/services/cpiService.ts
import axios from 'axios';
import type { TenantConfig, PackageArtifacts } from '$lib/types/cpi';

export class CPIService {
    private config: TenantConfig;

    constructor(config: TenantConfig) {
        this.config = config;
    }

    async getOAuthToken(): Promise<string> {
        try {
            const response = await axios.post(this.config.tokenUrl, null, {
                params: { grant_type: 'client_credentials' },
                auth: {
                    username: this.config.clientId,
                    password: this.config.clientSecret
                }
            });
            return response.data.access_token;
        } catch (error) {
            console.error('OAuth Token Fetch Error', error);
            throw error;
        }
    }

    async fetchPackages(): Promise<any[]> {
        const token = await this.getOAuthToken();
        const client = axios.create({
            baseURL: this.config.host,
            headers: { Authorization: `Bearer ${token}` }
        });

        try {
            const response = await client.get('/IntegrationPackages');
            return response.data?.d?.results || [];
        } catch (error) {
            console.error('Package Fetch Error', error);
            throw error;
        }
    }

    async fetchArtifacts(packageId: string): Promise<PackageArtifacts> {
        const token = await this.getOAuthToken();
        const client = axios.create({
            baseURL: this.config.host,
            headers: { Authorization: `Bearer ${token}` }
        });

        interface ArtifactMap {
            key: string;
            endpoint: string;
        }
        const artifactTypes: ArtifactMap[] = [
            { key: 'iflows', endpoint: 'IntegrationDesigntimeArtifacts' },
            { key: 'valueMappings', endpoint: 'ValueMappingDesigntimeArtifacts' },
            { key: 'scriptCollections', endpoint: 'ScriptCollectionDesigntimeArtifacts' },
            { key: 'messageMappings', endpoint: 'MessageMappingDesigntimeArtifacts' }
        ];

        const artifacts: PackageArtifacts = { iflows: [], valueMappings: [], scriptCollections: [], messageMappings: [] };

        for (const { key, endpoint } of artifactTypes) {
            try {
                const response = await client.get(`/IntegrationPackages('${packageId}')/${endpoint}`);
                artifacts[key as keyof PackageArtifacts] = response.data?.d?.results || [];
            } catch (error) {
                console.error(`Error fetching ${key}`, error);
                artifacts[key as keyof PackageArtifacts] = [];
            }
        }

        return artifacts as PackageArtifacts;
    }
}




// src/lib/services/errorService.ts
export class ErrorService {
    static categorizeError(error: unknown): {
        type: string;
        message: string;
        recoverable: boolean;
    } {
        if (error instanceof Error) {
            if (error.name === 'NetworkError') {
                return {
                    type: 'Network',
                    message: 'Connection failed. Check your internet.',
                    recoverable: true
                };
            }

            if (error.name === 'AuthenticationError') {
                return {
                    type: 'Authentication',
                    message: 'Failed to authenticate. Check credentials.',
                    recoverable: false
                };
            }
        }

        return {
            type: 'Unknown',
            message: 'An unexpected error occurred.',
            recoverable: false
        };
    }

    static logError(error: unknown) {
        // Could integrate with logging service
        console.error('Detailed Error:', error);
    }
}



// src/lib/services/performanceService.ts
import type { PerformanceMetrics } from "$lib/types/cpi";

export class PerformanceTracker {
    private startTime: number;
    private fetchStartTime!: number;
    private processingStartTime!: number;

    constructor() {
        this.startTime = performance.now();
    }

    startFetch() {
        this.fetchStartTime = performance.now();
    }

    endFetch() {
        return performance.now() - this.fetchStartTime;
    }

    startProcessing() {
        this.processingStartTime = performance.now();
    }

    endProcessing() {
        return performance.now() - this.processingStartTime;
    }

    getMetrics(): PerformanceMetrics {
        const totalTime = performance.now() - this.startTime;
        return {
            fetchTime: this.endFetch(),
            processingTime: this.endProcessing(),
            totalTime
        };
    }
}





// src/lib/stores/comparisonStore.ts
import { writable } from 'svelte/store';
import type { PackageComparison, PerformanceMetrics } from '$lib/types/cpi';

function createComparisonStore() {
    const CACHE_KEY = 'cpi-comparison-cache';
    const CACHE_EXPIRY_HOURS = 4; // Cache valid for 4 hours

    const isCacheValid: (timestamp: any) => any = (timestamp: number): boolean => {
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - timestamp;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        return hoursDiff < CACHE_EXPIRY_HOURS;
    }

    const getCachedComparison: () => any = () => {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            const parsedData: any = JSON.parse(cachedData);
            if (isCacheValid(parsedData?.timestamp)) {
                return parsedData;
            }
            // Remove expired cache
            localStorage.removeItem(CACHE_KEY);
        }
        return null;
    }

    const initialState = getCachedComparison() || {
        comparison: null,
        lastComparisonTime: null,
        isLoading: false,
        error: null,
        timestamp: null,
        performanceMetrics: {
            fetchTime: 0,
            processingTime: 0,
            totalTime: 0
        }
    };

    const { subscribe, set, update } = writable(initialState);

    return {
        set,
        subscribe,
        setComparison: (
            comparison: PackageComparison[],
            performanceMetrics: PerformanceMetrics
        ) =>
            update(store => {
                const newStore = {
                    ...store,
                    comparison,
                    lastComparisonTime: new Date(),
                    isLoading: false,
                    error: null,
                    timestamp: new Date().getTime(),
                    performanceMetrics
                };

                localStorage.setItem(CACHE_KEY, JSON.stringify(newStore));
                return newStore;
            }),
        isCacheValid,
        getCachedComparison,
        // initialState
        // ... other methods
    };
}


// function createComparisonStore() {
//     const CACHE_KEY = 'cpi-comparison-cache';

//     // Try to load from localStorage
//     const cachedComparison = localStorage.getItem(CACHE_KEY);
//     const initialState = cachedComparison
//         ? JSON.parse(cachedComparison)
//         : {
//             comparison: null as PackageComparison[] | null,
//             lastComparisonTime: null as Date | null,
//             isLoading: false,
//             error: null as string | null
//         };

//     const { subscribe, set, update } = writable(initialState);

//     return {
//         subscribe,
//         setComparison: (comparison: PackageComparison[]) =>
//             update(store => {
//                 const newStore = {
//                     ...store,
//                     comparison,
//                     lastComparisonTime: new Date(),
//                     isLoading: false,
//                     error: null
//                 };

//                 // Cache in localStorage
//                 localStorage.setItem(CACHE_KEY, JSON.stringify(newStore));

//                 return newStore;
//             }),
//         clearCache: () => {
//             localStorage.removeItem(CACHE_KEY);
//             set({
//                 comparison: null,
//                 lastComparisonTime: null,
//                 isLoading: false,
//                 error: null
//             });
//         },
//         // Other methods remain the same
//     };
// }

export const comparisonStore = createComparisonStore();






// src/lib/stores/tenantStore.ts
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





// src/lib/types/cpi.ts:
export interface TenantConfig {
    envName: string;
    host: string;
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
}

export interface Artifact {
    Id: string;
    Name: string;
    Version: string;
    status?: 'Match' | 'Missing in Env1' | 'Missing in Env2';
}

export interface PackageArtifacts {
    iflows: Artifact[];
    valueMappings: Artifact[];
    scriptCollections: Artifact[];
    messageMappings: Artifact[];
}

export interface PackageComparison {
    packageName: string;
    status: 'Exact Match' | 'Subset Match' | 'Missing in Env1' | 'Missing in Env2';
    artifacts: PackageArtifacts;
}

export interface PerformanceMetrics {
    fetchTime: number;
    processingTime: number;
    totalTime: number;
}





// src/routes/+page.svelte
<script lang="ts" >
	import TenantSelector from '$lib/components/TenantSelector.svelte';
import ComparisonReport from '$lib/components/ComparisonReport.svelte';
import { tenantStore } from '$lib/stores/tenantStore';
import { comparisonStore } from '$lib/stores/comparisonStore';
import { CPIService } from '$lib/services/cpiService';
import { ComparisonService } from '$lib/services/comparisonService';
import ArtifactDetailModal from '$lib/components/ArtifactDetailModal.svelte';
import { ErrorService } from '$lib/services/errorService';
import { PerformanceTracker } from '$lib/services/performanceService';
import ComparisonSummaryDashboard from '$lib/components/ComparisonSummaryDashboard.svelte';
import type { PackageComparison } from '$lib/types/cpi';

let selectedPackage: PackageComparison | null = null;

function openPackageDetails(pkg: PackageComparison) {
    selectedPackage = pkg;
}

function closePackageDetails() {
    selectedPackage = null;
}
let isComparing = false;
let error: string | null = null;

async function performComparison() {
    const { env1, env2 } = $tenantStore.selectedTenants;

    if (!env1 || !env2) {
        error = 'Please select two environments';
        return;
    }

    const performanceTracker = new PerformanceTracker();
    isComparing = true;
    error = null;
    comparisonStore.setLoading(true);

    try {
        const env1Service = new CPIService(env1);
        const env2Service = new CPIService(env2);

        const env1Packages = await env1Service.fetchPackages();
        const env2Packages = await env2Service.fetchPackages();

        // Fetch artifacts for each package
        const env1PackagesWithArtifacts = await Promise.all(
            env1Packages.map(async (pkg) => ({
                ...pkg,
                artifacts: await env1Service.fetchArtifacts(pkg.Id)
            }))
        );

        const env2PackagesWithArtifacts = await Promise.all(
            env2Packages.map(async (pkg) => ({
                ...pkg,
                artifacts: await env2Service.fetchArtifacts(pkg.Id)
            }))
        );

        const comparisonService = new ComparisonService();
        const comparison = comparisonService.comparePackages(
            env1PackagesWithArtifacts,
            env2PackagesWithArtifacts
        );

        //   comparisonStore.setComparison(comparison);
        const metrics = performanceTracker.getMetrics();
        comparisonStore.setComparison(comparison, metrics);
    } catch (err) {
        // error = err instanceof Error ? err.message : 'An unknown error occurred';
        // comparisonStore.setError(error);
        const errorDetails = ErrorService.categorizeError(err);
        ErrorService.logError(err);

        comparisonStore.setError(errorDetails.message);

        // Optional: Show user-friendly error modal
        if (errorDetails.recoverable) {
            // Show retry option
        }
    } finally {
        isComparing = false;
    }
}
</script>

    < div class="container" >
        <h1>CPI Artifact Comparison </h1>

            < TenantSelector />

            <div class="comparison-actions" >
                <button 
      on: click = { performComparison }
disabled = { isComparing }
    >
    { isComparing? 'Comparing...': 'Compare Environments' }
    </button>

{ #if $comparisonStore.lastComparisonTime }
<p>
    Last Comparison:
{ $comparisonStore.lastComparisonTime.toLocaleString() }
</p>
{/if }
</div>

{ #if error }
<div class="error-message" >
    { error }
    </div>
{/if }

<!--In the comparison report section-- >
    { #if $comparisonStore.comparison }
    < ComparisonReport
comparison = { $comparisonStore.comparison }
on: packageSelect = {(event) => openPackageDetails(event.detail)}
	/>
{/if }

{ #if $comparisonStore.comparison }
<ComparisonSummaryDashboard comparison={ $comparisonStore.comparison } />
{/if }

{ #if $comparisonStore.performanceMetrics }
<div class="performance-metrics" >
    <h3>Performance Metrics </h3>
        < p > Fetch Time: { $comparisonStore.performanceMetrics.fetchTime } ms </p>
            < p > Processing Time: { $comparisonStore.performanceMetrics.processingTime } ms </p>
                < p > Total Time: { $comparisonStore.performanceMetrics.totalTime } ms </p>
                    </div>
{/if }

{ #if selectedPackage }
<ArtifactDetailModal 
		packageDetails={ selectedPackage }
closeModal = { closePackageDetails }
    />
    {/if}
</div>

<style>
    .container {
    max - width: 800px;
    margin: 0 auto;
    padding: 1rem;
}

  .comparison - actions {
    margin: 1rem 0;
    display: flex;
    justify - content: space - between;
    align - items: center;
}

  button {
    padding: 0.5rem 1rem;
    background - color: #007bff;
    color: white;
    border: none;
    cursor: pointer;
}

button:disabled {
    background - color: #cccccc;
    cursor: not - allowed;
}

  .error - message {
    color: red;
    margin: 1rem 0;
}
</style>





// src/routes/+page.ts
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
    return {
        title: 'CPI Artifact Comparison'
    };
};




// is this file needed? src/app.d.ts
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
    namespace App {
        interface Error { }
        interface Locals { }
        interface PageData { }
        interface PageState { }
        interface Platform { }
    }
}

export { };



// src/app.html
<!doctype html >
    <html lang="en" >

        <head>
        <meta charset="utf-8" />
            <link rel="icon" href = "%sveltekit.assets%/favicon.png" />
                <meta name="viewport" content = "width=device-width, initial-scale=1" />
                    <meta name="color-scheme" content = "dark light" />

	% sveltekit.head %
                        <!--duplication with svelte.dev / static / shared.css needed, else styles aren't applied during local dev -->
                            < link rel = "stylesheet" href = "/shared.css" />
                                </head>

                                < body data - sveltekit - preload - data="hover" >
                                    <div style="display: contents" >% sveltekit.body % </div>
                                        </body>

                                        </html>






// example .env environment file
PUBLIC_DEV_ENV_KEY = "dev"
PUBLIC_DEV_ENV_NAME = "im-dev-eu" // can we use this name value as the key in the tenantStore?
PUBLIC_DEV_HOST = https://jnj-im-dev.it-cpi026.cfapps.eu10-002.hana.ondemand.com/api/v1
PUBLIC_DEV_TOKEN_URL = https://jnj-im-dev.authentication.eu10.hana.ondemand.com/oauth/token
PUBLIC_DEV_CLIENT_ID = myclientid
PUBLIC_DEV_CLIENT_SECRET = myclientsecret

PUBLIC_PQA_ENV_KEY = "pqa"
PUBLIC_PQA_ENV_NAME = "im-pq-na" // can we use this name value as the key in the tenantStore?
PUBLIC_PQA_HOST = https://jnj-im-pq-na.it-cpi019.cfapps.us10-002.hana.ondemand.com/api/v1
PUBLIC_PQA_TOKEN_URL = https://jnj-im-pq-na.authentication.us10.hana.ondemand.com/oauth/token
PUBLIC_PQA_CLIENT_ID = myclientid
PUBLIC_PQA_CLIENT_SECRET = myclientsecret




// package.json
{
    "name": "artifact-compare",
        "private": true,
            "version": "0.0.1",
                "type": "module",
                    "scripts": {
        "dev": "vite dev",
            "build": "vite build",
                "preview": "vite preview",
                    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
                        "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch"
    },
    "devDependencies": {
        "@sveltejs/adapter-auto": "^3.0.0",
            "@sveltejs/kit": "^2.9.0",
                "@sveltejs/vite-plugin-svelte": "^5.0.0",
                    "svelte": "^5.0.0",
                        "svelte-check": "^4.0.0",
                            "typescript": "^5.0.0",
                                "vite": "^6.0.0"
    }
}
