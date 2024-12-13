# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.




artifact-compare/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ArtifactDetailModal.svelte
│   │   │   ├── ComparisonReport.svelte
│   │   │   ├── ComparisonSummaryDashboard.svelte
│   │   │   └── TenantSelector.svelte
│   │   ├── services/
│   │   │   ├── cpiService.ts
│   │   │   ├── comparisonService.ts
│   │   │   ├── errorService.ts
│   │   │   └── performanceService.ts
│   │   ├── stores/
│   │   │   ├── comparisonStore.ts
│   │   │   └── tenantStore.ts
│   │   └── types/
│   │       └── cpi.ts
│   ├── routes/
│   │   ├── +page.svelte
│   │   └── +page.ts
│   └── app.html
├── package.json
├── svelte.config.js
└── tsconfig.json
Snippets:



// src/lib/types/cpi.ts:
export interface TenantConfig {
  envName: string;
  host: string;
  tokenUrl: string;
}

export interface Artifact {
  Id: string;
  Name: string;
  status?: 'Match' | 'Missing';
}

export interface PackageComparison {
  packageName: string;
  status: string;
  artifacts: Record<string, Artifact[]>;
}


// src/lib/services/cpiService.ts:
export class CPIService {
  private config: TenantConfig;

  constructor(config: TenantConfig) {
    this.config = config;
  }

  async getOAuthToken(): Promise<string> {
    // OAuth token fetching logic
  }

  async fetchPackages(): Promise<any[]> {
    // Fetch integration packages
  }
}



// src/lib/stores/comparisonStore.ts:
function createComparisonStore() {
  const { subscribe, update } = writable({
    comparison: null,
    lastComparisonTime: null,
    isLoading: false
  });

  return {
    subscribe,
    setComparison: (comparison: PackageComparison[]) => 
      update(store => ({ ...store, comparison }))
  };
}



// src/routes/+page.svelte:
<script lang="ts">
  import TenantSelector from '$lib/components/TenantSelector.svelte';
  import ComparisonReport from '$lib/components/ComparisonReport.svelte';

  async function performComparison() {
    // Comparison logic
  }
</script>

<TenantSelector />
<button on:click={performComparison}>Compare</button>



// package.json:
{
  "name": "artifact-compare",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build"
  },
  "dependencies": {
    "axios": "^1.6.5",
    "chart.js": "^4.4.1"
  }
}