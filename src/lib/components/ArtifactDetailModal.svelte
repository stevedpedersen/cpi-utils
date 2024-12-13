<script lang="ts">
  // src/lib/components/ArtifactDetailModal.svelte
  import { onMount } from "svelte";
  import Chart from "chart.js/auto";
  import type { PackageComparison, PackageArtifacts } from "$lib/types/cpi";

  export let packageDetails: PackageComparison;
  export let closeModal: () => void;

  let artifactTypeChart: Chart;
  let statusChart: Chart;

  onMount(() => {
    // Artifact Type Distribution Chart
    const artifactTypesCtx = document.getElementById(
      "artifactTypeChart"
    ) as HTMLCanvasElement;
    artifactTypeChart = new Chart(artifactTypesCtx, {
      type: "pie",
      data: {
        labels: [
          "iFlows",
          "Value Mappings",
          "Script Collections",
          "Message Mappings",
        ],
        datasets: [
          {
            data: [
              packageDetails.artifacts.iflows.length,
              packageDetails.artifacts.valueMappings.length,
              packageDetails.artifacts.scriptCollections.length,
              packageDetails.artifacts.messageMappings.length,
            ],
            backgroundColor: [
              "rgba(255, 99, 132, 0.6)",
              "rgba(54, 162, 235, 0.6)",
              "rgba(255, 206, 86, 0.6)",
              "rgba(75, 192, 192, 0.6)",
            ],
          },
        ],
      },
    });

    // Artifact Status Chart
    const statusCtx = document.getElementById(
      "statusChart"
    ) as HTMLCanvasElement;
    const statusCounts = {
      Match: 0,
      "Missing in Env1": 0,
      "Missing in Env2": 0,
    };

    ["iflows", "valueMappings", "scriptCollections", "messageMappings"].forEach(
      (type) => {
        packageDetails.artifacts[type as keyof PackageArtifacts].forEach(
          (artifact) => {
            statusCounts[artifact.status || "Match"]++;
          }
        );
      }
    );

    statusChart = new Chart(statusCtx, {
      type: "bar",
      data: {
        labels: Object.keys(statusCounts),
        datasets: [
          {
            label: "Artifact Status",
            data: Object.values(statusCounts),
            backgroundColor: [
              "rgba(75, 192, 192, 0.6)",
              "rgba(255, 99, 132, 0.6)",
              "rgba(54, 162, 235, 0.6)",
            ],
          },
        ],
      },
    });
  });
</script>

<div class="modal">
  <div class="modal-content">
    <h2>{packageDetails.packageName}</h2>
    <p>Overall Status: {packageDetails.status}</p>

    <div class="charts-container">
      <div class="chart-wrapper">
        <h3>Artifact Type Distribution</h3>
        <canvas id="artifactTypeChart"></canvas>
      </div>
      <div class="chart-wrapper">
        <h3>Artifact Status</h3>
        <canvas id="statusChart"></canvas>
      </div>
    </div>

    <div class="artifact-details">
      {#each Object.entries(packageDetails.artifacts) as [type, artifacts]}
        <div class="artifact-section">
          <h3>{type.replace(/([A-Z])/g, " $1").toUpperCase()}</h3>
          <table>
            <thead>
              <tr>
                <th>Artifact ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {#each artifacts as artifact}
                <tr>
                  <td>{artifact.Id}</td>
                  <td>{artifact.status || "Match"}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/each}
    </div>

    <button on:click={closeModal}>Close</button>
  </div>
</div>

<style>
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    padding: 20px;
    border-radius: 5px;
    width: 90%;
    max-width: 1000px;
    max-height: 90%;
    overflow-y: auto;
  }

  .charts-container {
    display: flex;
    justify-content: space-between;
  }

  .chart-wrapper {
    width: 48%;
  }

  .artifact-details {
    margin-top: 20px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
</style>
