const fs = require('fs');
const args = require('yargs').argv;

if (!args.dev || !args.pqa) {
    console.error('[ERROR] Please provide tenant results files with --dev and --pqa');
    process.exit(1);
}

try {
    const devData = JSON.parse(fs.readFileSync(args.dev, 'utf-8'));
    console.log(`[DEBUG] Loaded Dev data: ${devData.length} packages`);
} catch (error) {
    console.error(`[ERROR] Could not load Dev data file: ${args.dev}`);
    process.exit(1);
}

try {
    const pqaData = JSON.parse(fs.readFileSync(args.pqa, 'utf-8'));
    console.log(`[DEBUG] Loaded PQA data: ${pqaData.length} packages`);
} catch (error) {
    console.error(`[ERROR] Could not load PQA data file: ${args.pqa}`);
    process.exit(1);
}

function compareTenants(dev, pqa) {
    const devMap = new Map(dev.map((pkg) => [pkg.packageName, pkg]));
    const pqaMap = new Map(pqa.map((pkg) => [pkg.packageName, pkg]));

    const comparison = [];
    let matchedArtifacts = 0;
    let mismatchedArtifacts = 0;
    let missingArtifacts = 0;

    console.log(`[DEBUG] Starting comparison`);
    for (const [packageName, devPkg] of devMap) {
        const pqaPkg = pqaMap.get(packageName);
        if (!pqaPkg) {
            console.log(`[DEBUG] Package missing in PQA: ${packageName}`);
            comparison.push({ packageName, status: 'Missing in PQA' });
            continue;
        }

        const artifactComparison = devPkg.iflows.map((flow) => {
            const pqaFlow = pqaPkg.iflows.find((f) => f.name === flow.name);
            if (!pqaFlow) {
                console.log(`[DEBUG] Artifact missing in PQA: ${flow.name}`);
                missingArtifacts++;
                return { name: flow.name, status: 'Missing in PQA' };
            }
            if (flow.version === pqaFlow.version) {
                matchedArtifacts++;
                return { name: flow.name, status: 'Match', version: flow.version };
            }
            mismatchedArtifacts++;
            console.log(`[DEBUG] Artifact version mismatch: ${flow.name}`);
            return {
                name: flow.name,
                status: 'Version Mismatch',
                devVersion: flow.version,
                pqaVersion: pqaFlow.version,
            };
        });

        const subsetMatch = artifactComparison.every((artifact) => artifact.status === 'Match');

        comparison.push({
            packageName,
            status: subsetMatch ? 'Subset Match' : 'Present in Both',
            artifacts: artifactComparison,
        });
    }

    const statistics = {
        totalPackages: dev.length,
        matchedArtifacts,
        mismatchedArtifacts,
        missingArtifacts,
        matchingPercentage: ((matchedArtifacts / (matchedArtifacts + mismatchedArtifacts + missingArtifacts)) * 100).toFixed(2),
    };
    console.log(`[DEBUG] Comparison statistics:`, statistics);

    return { comparison, statistics };
}

const result = compareTenants(devData, pqaData);
fs.writeFileSync('comparison-report.json', JSON.stringify(result, null, 2));
console.log('[DEBUG] Comparison report generated: comparison-report.json');
