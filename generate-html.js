const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const args = yargs
    .option('source', {
        alias: 's',
        description: 'Path to the comparison JSON file',
        type: 'string',
        demandOption: true,
    })
    .option('output', {
        alias: 'o',
        description: 'Path to the output HTML file',
        type: 'string',
        default: './comparison-report.html',
    })
    .help()
    .alias('help', 'h')
    .argv;

const { source, output } = args;

// Read the JSON file
let comparisonData;
try {
    comparisonData = JSON.parse(fs.readFileSync(source, 'utf-8'));
    console.log(`[INFO] Successfully loaded comparison data from ${source}`);
} catch (error) {
    console.error(`[ERROR] Could not load JSON file at ${source}:`, error.message);
    process.exit(1);
}

// Generate the HTML content
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comparison Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f4f4f9;
        }
        h1, h2 {
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .chart-container {
            margin: 20px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        table, th, td {
            border: 1px solid #ddd;
        }
        th, td {
            text-align: left;
            padding: 10px;
        }
        th {
            background-color: #007bff;
            color: white;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .status {
            font-weight: bold;
        }
        .status.Missing {
            color: red;
        }
        .status.Match {
            color: green;
        }
        .status["Version Mismatch"] {
            color: orange;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Comparison Report</h1>
        <h2>Statistics</h2>
        <div class="chart-container">
            <canvas id="statisticsChart"></canvas>
        </div>
        <h2>Package Comparison</h2>
        <table>
            <thead>
                <tr>
                    <th>Package Name</th>
                    <th>Status</th>
                    <th>Artifacts</th>
                </tr>
            </thead>
            <tbody id="comparisonTable"></tbody>
        </table>
    </div>
    <script>
        const comparisonData = ${JSON.stringify(comparisonData)};

        // Populate comparison table
        const comparisonTable = document.getElementById('comparisonTable');
        comparisonData.comparison.forEach(pkg => {
            const row = document.createElement('tr');
            row.innerHTML = \`
                <td>\${pkg.packageName}</td>
                <td class="status">\${pkg.status}</td>
                <td>
                    <ul>
                        \${pkg.artifacts?.map(artifact => \`
                            <li>\${artifact.name} - 
                                <span class="status \${artifact.status}">
                                    \${artifact.status}
                                </span>
                                \${artifact.env1Version ? \`(Env1: \${artifact.env1Version}\` : ''}
                                \${artifact.env2Version ? \`, Env2: \${artifact.env2Version})\` : ''}
                            </li>
                        \`).join('') || 'N/A'}
                    </ul>
                </td>
            \`;
            comparisonTable.appendChild(row);
        });

        // Chart.js Visualization
        const ctx = document.getElementById('statisticsChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Matched Artifacts', 'Mismatched Artifacts', 'Missing Artifacts'],
                datasets: [{
                    data: [
                        comparisonData.statistics.matchedArtifacts,
                        comparisonData.statistics.mismatchedArtifacts,
                        comparisonData.statistics.missingArtifacts
                    ],
                    backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return \`\${context.label}: \${context.raw}\`;
                            }
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>
`;

// Write the HTML file
try {
    fs.writeFileSync(output, htmlContent);
    console.log(`[INFO] HTML report successfully saved to ${output}`);
} catch (error) {
    console.error(`[ERROR] Could not save HTML file at ${output}:`, error.message);
    process.exit(1);
}
