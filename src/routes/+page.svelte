<script lang="ts">
  // src/routes/+page.svelte
  import TenantSelector from "$lib/components/TenantSelector.svelte";
  import ComparisonReport from "$lib/components/ComparisonReport.svelte";
  import { tenantStore } from "$lib/stores/tenantStore";
  import { comparisonStore } from "$lib/stores/comparisonStore";
  import { CPIService } from "$lib/services/cpiService";
  import { ComparisonService } from "$lib/services/comparisonService";
  import ArtifactDetailModal from "$lib/components/ArtifactDetailModal.svelte";
  import { ErrorService } from "$lib/services/errorService";
  import { PerformanceTracker } from "$lib/services/performanceService";
  import ComparisonSummaryDashboard from "$lib/components/ComparisonSummaryDashboard.svelte";
  import type { PackageComparison, TenantConfig } from "$lib/types/cpi";

  // let props = $props();
  let { tenants = [] } = $props();
  let selectedEnv1: TenantConfig | null = $state(null);
  let selectedEnv2: TenantConfig | null = $state(null);
  let selectedPackage: PackageComparison | null = null;
  let isComparing = false;
  let error: string | null = null;
  let performanceDetails: {
    packageCount: number;
    environmentNames: string[];
    metrics: ReturnType<PerformanceTracker["getMetrics"]>;
  } | null = null;

  // $: tenantStore.subscribe((store) => {
  //   tenants = store.availableTenants || [];
  // });

  const handleSelect = (env: "env1" | "env2", tenant: TenantConfig) => {
    if (env === "env1") {
      selectedEnv1 = tenant;
    } else if (env === "env2") {
      selectedEnv2 = tenant;
    }
    tenantStore.selectTenant(env, tenant);
  }

  function openPackageDetails(pkg: PackageComparison) {
    selectedPackage = pkg;
  }

  function closePackageDetails() {
    selectedPackage = null;
  }

  async function performComparison() {
    const { env1, env2 } = $tenantStore.selectedTenants;

    if (!env1 || !env2) {
      error = "Please select two environments";
      return;
    }

    const performanceTracker = new PerformanceTracker();
    isComparing = true;
    error = null;

    try {
      // Wrap entire comparison process in performance tracking
      const { result, metrics } = await PerformanceTracker.measureAsync(
        async () => {
          const env1Service = new CPIService(env1);
          const env2Service = new CPIService(env2);

          performanceTracker.startFetch();
          const env1Packages = await env1Service.fetchPackages();
          const env2Packages = await env2Service.fetchPackages();
          performanceTracker.endFetch();

          performanceTracker.startProcessing();
          // Fetch artifacts for each package
          const env1PackagesWithArtifacts = await Promise.all(
            env1Packages.map(async (pkg) => ({
              ...pkg,
              artifacts: await env1Service.fetchArtifacts(pkg.Id),
            }))
          );

          const env2PackagesWithArtifacts = await Promise.all(
            env2Packages.map(async (pkg) => ({
              ...pkg,
              artifacts: await env2Service.fetchArtifacts(pkg.Id),
            }))
          );

          const comparisonService = new ComparisonService();
          const comparison = comparisonService.comparePackages(
            env1PackagesWithArtifacts,
            env2PackagesWithArtifacts
          );
          performanceTracker.endProcessing();

          return {
            comparison,
            packageCount: env1Packages.length + env2Packages.length,
            environmentNames: [env1.envName, env2.envName],
          };
        },
        "Full Comparison Process"
      );

      // Store comparison results
      comparisonStore.setComparison(result.comparison, metrics);

      // Capture additional performance details
      performanceDetails = {
        packageCount: result.packageCount,
        environmentNames: result.environmentNames,
        metrics,
      };
    } catch (err) {
      const errorDetails = ErrorService.categorizeError(err);
      ErrorService.logError(err);
      error = errorDetails.message;
    } finally {
      isComparing = false;
    }
  }
</script>

<div class="container">
  <h1>CPI Artifact Comparison</h1>

  <section>
    <h2>Select Two Tenants</h2>
    <TenantSelector
      tenants={tenants}
      selectedTenant={selectedEnv1}
      onSelect={(tenant: TenantConfig) => handleSelect("env1", tenant)}
      label="-- Select Tenant 1 --"
    />
    <TenantSelector
      tenants={tenants}
      selectedTenant={selectedEnv2}
      onSelect={(tenant: TenantConfig) => handleSelect("env2", tenant)}
      label="-- Select Tenant 2 --"
    />
  </section>


  <!-- <TenantSelector /> -->

  <div class="comparison-actions">
    <button onclick={performComparison} disabled={isComparing}>
      {isComparing ? "Comparing..." : "Compare Environments"}
    </button>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if performanceDetails}
    <div class="performance-details">
      <h3>Performance Breakdown</h3>
      <div class="performance-grid">
        <div class="performance-item">
          <span class="label">Environments:</span>
          <span class="value"
            >{performanceDetails.environmentNames.join(" vs ")}</span
          >
        </div>
        <div class="performance-item">
          <span class="label">Total Packages:</span>
          <span class="value">{performanceDetails.packageCount}</span>
        </div>
        <div class="performance-item">
          <span class="label">Fetch Time:</span>
          <span class="value">{performanceDetails.metrics.fetchTime} ms</span>
        </div>
        <div class="performance-item">
          <span class="label">Processing Time:</span>
          <span class="value"
            >{performanceDetails.metrics.processingTime} ms</span
          >
        </div>
        <div class="performance-item">
          <span class="label">Total Time:</span>
          <span class="value">{performanceDetails.metrics.totalTime} ms</span>
        </div>
      </div>
    </div>
  {/if}

  {#if $comparisonStore.comparison}
    <ComparisonReport
      comparison={$comparisonStore.comparison}
      on:packageSelect={(event) => openPackageDetails(event.detail)}
    />
    <ComparisonSummaryDashboard comparison={$comparisonStore.comparison} />
  {/if}

  {#if selectedPackage}
    <ArtifactDetailModal
      packageDetails={selectedPackage}
      closeModal={closePackageDetails}
    />
  {/if}
</div>

<style>
  .performance-details {
    background-color: #f4f4f4;
    border-radius: 8px;
    padding: 15px;
    margin-top: 15px;
  }

  .performance-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
  }

  .performance-item {
    display: flex;
    justify-content: space-between;
    padding: 5px;
    background-color: #e9e9e9;
    border-radius: 4px;
  }

  .performance-item .label {
    font-weight: bold;
    color: #333;
  }

  .performance-item .value {
    color: #666;
  }
</style>
