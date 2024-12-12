const fs = require('fs');
const path = require('path');
const args = require('yargs').argv;

if (!args.env1 || !args.env2) {
    console.error('[ERROR] Please provide two tenant environment names with --env1 and --env2');
    process.exit(1);
}

// File paths
const outputDir = path.resolve(__dirname, './output');
// const dataDir = path.join(outputDir, 'data');
const htmlFile = path.join(outputDir, `comparison-report-${args.env1}-vs-${args.env2}.html`);

// Generate dynamic HTML
const generateHtmlContent = (env1, env2) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comparison Report: ${env1} vs ${env2}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .dropdown { margin-bottom: 20px; }
        canvas { max-width: 800px; margin: 20px auto; }
        .chart-container { display: flex; flex-wrap: wrap; justify-content: center; }
    </style>
</head>
<body>
    <h1>Comparison Report: ${env1} vs ${env2}</h1>
    <div class="dropdown">
        <label for="file-selector">Select Report:</label>
        <select id="file-selector">
            <option value="comparison-${env1}-vs-${env2}.json">Current Comparison</option>
        </select>
    </div>
    <div id="report">
        <div id="summary"></div>
        <div class="chart-container">
            <canvas id="matched-chart"></canvas>
            <canvas id="mismatched-chart"></canvas>
        </div>
        <div id="details"></div>
    </div>
    <script>
        const env1 = "${env1}";
        const env2 = "${env2}";
        const dataDir = './data';
        const fileSelector = document.getElementById('file-selector');
        
        const loadFile = (fileName) => {
            return fetch(\`\${dataDir}/\${fileName}\`)
                .then(response => {
                    if (!response.ok) throw new Error('File not found: ' + fileName);
                    return response.json();
                });
        };

        const renderReport = async () => {
            const fileName = fileSelector.value;
            const [env1Data, env2Data, comparisonData] = await Promise.all([
                loadFile(\`results-\${env1}.json\`),
                loadFile(\`results-\${env2}.json\`),
                loadFile(fileName)
            ]);

            renderSummary(env1Data, env2Data, comparisonData);
            renderCharts(env1Data, env2Data, comparisonData);
            renderDetails(comparisonData);
        };

        const renderSummary = (env1Data, env2Data, comparisonData) => {
            const summary = document.getElementById('summary');
            summary.innerHTML = \`
                <h2>Summary</h2>
                <p><strong>Total Packages in ${env1}:</strong> \${env1Data.length}</p>
                <p><strong>Total Packages in ${env2}:</strong> \${env2Data.length}</p>
                <p><strong>Total Packages Compared:</strong> \${comparisonData.length}</p>
            \`;
        };

        const renderCharts = (env1Data, env2Data, comparisonData) => {
            const matched = comparisonData.filter(pkg => pkg.status === 'Exact Match').length;
            const mismatched = comparisonData.length - matched;

            const ctxMatched = document.getElementById('matched-chart').getContext('2d');
            const ctxMismatched = document.getElementById('mismatched-chart').getContext('2d');

            new Chart(ctxMatched, {
                type: 'pie',
                data: {
                    labels: ['Matched', 'Mismatched'],
                    datasets: [{
                        data: [matched, mismatched],
                        backgroundColor: ['#4caf50', '#f44336']
                    }]
                },
                options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
            });

            const mismatchedDetails = comparisonData.filter(pkg => pkg.status !== 'Exact Match');
            const mismatchedBreakdown = mismatchedDetails.reduce((acc, pkg) => {
                acc[pkg.status] = (acc[pkg.status] || 0) + 1;
                return acc;
            }, {});

            new Chart(ctxMismatched, {
                type: 'bar',
                data: {
                    labels: Object.keys(mismatchedBreakdown),
                    datasets: [{
                        label: 'Count',
                        data: Object.values(mismatchedBreakdown),
                        backgroundColor: ['#ff9800', '#2196f3', '#f44336']
                    }]
                },
                options: { responsive: true, plugins: { legend: { display: false } } }
            });
        };

        const renderDetails = (comparisonData) => {
            const details = document.getElementById('details');
            const detailsTable = comparisonData.map(pkg => \`
                <tr>
                    <td>\${pkg.packageName}</td>
                    <td>\${pkg.status}</td>
                </tr>
            \`).join('');

            details.innerHTML = \`
                <h2>Details</h2>
                <table border="1" cellpadding="5" cellspacing="0">
                    <thead>
                        <tr>
                            <th>Package Name</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${detailsTable}
                    </tbody>
                </table>
            \`;
        };

        fileSelector.addEventListener('change', renderReport);
        renderReport();
    </script>
</body>
</html>
`;

// Write the HTML file
fs.writeFileSync(htmlFile, generateHtmlContent(args.env1, args.env2));
console.log(`[INFO] HTML report generated at ${htmlFile}`);
