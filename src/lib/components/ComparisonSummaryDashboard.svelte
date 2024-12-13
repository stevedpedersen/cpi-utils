<script lang="ts">
  // src/lib/components/ComparisonSummaryDashboard.svelte
  import { onMount } from "svelte";
  import Chart from "chart.js/auto";
  import type { PackageComparison } from "$lib/types/cpi";

  export let comparison: PackageComparison[];

  let summaryChart: Chart;
  let performanceChart: Chart;

  function calculateSummaryStats() {
    return {
      exactMatches: comparison.filter((pkg) => pkg.status === "Exact Match")
        .length,
      subsetMatches: comparison.filter((pkg) => pkg.status === "Subset Match")
        .length,
      missingInEnv1: comparison.filter(
        (pkg) => pkg.status === "Missing in Env1"
      ).length,
      missingInEnv2: comparison.filter(
        (pkg) => pkg.status === "Missing in Env2"
      ).length,
    };
  }

  onMount(() => {
    const stats = calculateSummaryStats();

    // Summary Chart
    const summaryCtx = document.getElementById(
      "summaryChart"
    ) as HTMLCanvasElement;
    summaryChart = new Chart(summaryCtx, {
      type: "doughnut",
      data: {
        labels: [
          "Exact Match",
          "Subset Match",
          "Missing in Env1",
          "Missing in Env2",
        ],
        datasets: [
          {
            data: [
              stats.exactMatches,
              stats.subsetMatches,
              stats.missingInEnv1,
              stats.missingInEnv2,
            ],
            backgroundColor: ["green", "orange", "red", "blue"],
          },
        ],
      },
    });
  });
</script>

<div class="dashboard">
  <div class="chart-container">
    <h3>Comparison Summary</h3>
    <canvas id="summaryChart"></canvas>
  </div>
</div>

<style>
  .dashboard {
    display: flex;
    justify-content: center;
  }

  .chart-container {
    width: 400px;
    height: 400px;
  }
</style>
