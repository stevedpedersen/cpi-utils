<script lang="ts">
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

<div class="container">
  <h1>CPI Artifact Comparison</h1>
  
  <TenantSelector />

  <div class="comparison-actions">
    <button 
      on:click={performComparison}
      disabled={isComparing}
    >
      {isComparing ? 'Comparing...' : 'Compare Environments'}
    </button>

    {#if $comparisonStore.lastComparisonTime}
      <p>
        Last Comparison: 
        {$comparisonStore.lastComparisonTime.toLocaleString()}
      </p>
    {/if}
  </div>

  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}

	<!-- In the comparison report section -->
	{#if $comparisonStore.comparison}
	<ComparisonReport 
		comparison={$comparisonStore.comparison}
		on:packageSelect={(event) => openPackageDetails(event.detail)}
	/>
	{/if}
  
	{#if $comparisonStore.comparison}
	<ComparisonSummaryDashboard comparison={$comparisonStore.comparison} />
  {/if}
  
  {#if $comparisonStore.performanceMetrics}
	<div class="performance-metrics">
	  <h3>Performance Metrics</h3>
	  <p>Fetch Time: {$comparisonStore.performanceMetrics.fetchTime}ms</p>
	  <p>Processing Time: {$comparisonStore.performanceMetrics.processingTime}ms</p>
	  <p>Total Time: {$comparisonStore.performanceMetrics.totalTime}ms</p>
	</div>
  {/if}
  
	{#if selectedPackage}
	<ArtifactDetailModal 
		packageDetails={selectedPackage}
		closeModal={closePackageDetails}
	/>
	{/if}
</div>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
  }

  .comparison-actions {
    margin: 1rem 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  button {
    padding: 0.5rem 1rem;
    background-color: #007bff;
    color: white;
    border: none;
    cursor: pointer;
  }

  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .error-message {
    color: red;
    margin: 1rem 0;
  }
</style>
