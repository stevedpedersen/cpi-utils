const fs = require('fs');
const path = require('path');
const args = require('yargs').argv;

if (!args.env1 || !args.env2) {
    console.error('[ERROR] Please provide two tenant environment names with --env1 and --env2');
    process.exit(1);
}

// Construct file paths based on tenant names
const dataDir = path.resolve(__dirname, './data');
const env1File = path.join(dataDir, `results-${args.env1}.json`);
const env2File = path.join(dataDir, `results-${args.env2}.json`);

let env1Data, env2Data;

try {
    env1Data = JSON.parse(fs.readFileSync(env1File, 'utf-8'));
    console.log(`[DEBUG] Loaded Env1 data: ${env1Data.length} packages`);
} catch (error) {
    console.error(`[ERROR] Could not load Env1 data file: ${env1File}`, error.message);
    process.exit(1);
}

try {
    env2Data = JSON.parse(fs.readFileSync(env2File, 'utf-8'));
    console.log(`[DEBUG] Loaded Env2 data: ${env2Data.length} packages`);
} catch (error) {
    console.error(`[ERROR] Could not load Env2 data file: ${env2File}`, error.message);
    process.exit(1);
}

// Comparison logic
function compareTenants(env1, env2) {
    const env1Map = new Map(env1.map((pkg) => [pkg.packageName, pkg]));
    const env2Map = new Map(env2.map((pkg) => [pkg.packageName, pkg]));

    const comparison = [];
    let matchedArtifacts = 0;
    let mismatchedArtifacts = 0;
    let missingArtifacts = 0;

    console.log(`[DEBUG] Starting comparison`);
    for (const [packageName, env1Pkg] of env1Map) {
        const env2Pkg = env2Map.get(packageName);
        if (!env2Pkg) {
            console.log(`[DEBUG] Package missing in Env2: ${packageName}`);
            comparison.push({ packageName, status: 'Missing in Env2' });
            continue;
        }

        const artifactComparison = env1Pkg.iflows.map((flow) => {
            const env2Flow = env2Pkg.iflows.find((f) => f.name === flow.name);
            if (!env2Flow) {
                missingArtifacts++;
                return { name: flow.name, status: 'Missing in Env2' };
            }
            if (flow.version === env2Flow.version) {
                matchedArtifacts++;
                return { name: flow.name, status: 'Match', version: flow.version };
            }
            mismatchedArtifacts++;
            return {
                name: flow.name,
                status: 'Version Mismatch',
                env1Version: flow.version,
                env2Version: env2Flow.version,
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
        totalPackages: env1.length,
        matchedArtifacts,
        mismatchedArtifacts,
        missingArtifacts,
        matchingPercentage: ((matchedArtifacts / (matchedArtifacts + mismatchedArtifacts + missingArtifacts)) * 100).toFixed(2),
    };
    console.log(`[DEBUG] Comparison statistics:`, statistics);

    return { comparison, statistics };
}

const result = compareTenants(env1Data, env2Data);

// Save comparison report
const reportFile = path.join(dataDir, `comparison-${args.env1}-vs-${args.env2}.json`);
fs.writeFileSync(reportFile, JSON.stringify(result, null, 2));
console.log(`[DEBUG] Comparison report saved to ${reportFile}`);
