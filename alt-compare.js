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
function compareArtifacts(env1Artifacts, env2Artifacts, artifactType, stats) {
    const artifactComparison = env1Artifacts.map((artifact) => {
        const matchingArtifact = env2Artifacts.find((a) => a.name === artifact.name);
        if (!matchingArtifact) {
            stats.missingArtifacts[artifactType]++;
            return { name: artifact.name, status: 'Missing in Env2' };
        }
        if (artifact.version === matchingArtifact.version) {
            stats.matchedArtifacts[artifactType]++;
            return { name: artifact.name, status: 'Match', version: artifact.version };
        }
        stats.mismatchedArtifacts[artifactType]++;
        return {
            name: artifact.name,
            status: 'Version Mismatch',
            env1Version: artifact.version,
            env2Version: matchingArtifact.version,
        };
    });

    return artifactComparison;
}

function comparePackages(env1, env2) {
    const env1Map = new Map(env1.map((pkg) => [pkg.packageName, pkg]));
    const env2Map = new Map(env2.map((pkg) => [pkg.packageName, pkg]));

    const comparison = [];
    const stats = {
        totalPackages: env1.length,
        matchedArtifacts: { iflows: 0, valueMappings: 0, scriptCollections: 0, messageMappings: 0 },
        mismatchedArtifacts: { iflows: 0, valueMappings: 0, scriptCollections: 0, messageMappings: 0 },
        missingArtifacts: { iflows: 0, valueMappings: 0, scriptCollections: 0, messageMappings: 0 },
    };

    console.log(`[DEBUG] Starting comparison`);
    for (const [packageName, env1Pkg] of env1Map) {
        const env2Pkg = env2Map.get(packageName);
        if (!env2Pkg) {
            console.log(`[DEBUG] Package missing in Env2: ${packageName}`);
            comparison.push({ packageName, status: 'Missing in Env2' });
            continue;
        }

        const artifactResults = {};
        const artifactTypes = ['iflows', 'valueMappings', 'scriptCollections', 'messageMappings'];
        let subsetMatch = true;

        for (const type of artifactTypes) {
            const env1Artifacts = env1Pkg.artifacts[type] || [];
            const env2Artifacts = env2Pkg.artifacts[type] || [];
            const artifactComparison = compareArtifacts(env1Artifacts, env2Artifacts, type, stats);

            artifactResults[type] = artifactComparison;
            artifactComparison.forEach((artifact) => {
                if (artifact.status !== 'Match') {
                    subsetMatch = false;
                }
            });
        }

        comparison.push({
            packageName,
            status: subsetMatch ? 'Subset Match' : 'Present in Both',
            artifacts: artifactResults,
        });
    }

    stats.matchingPercentage = (
        (Object.values(stats.matchedArtifacts).reduce((a, b) => a + b, 0) /
            (Object.values(stats.matchedArtifacts).reduce((a, b) => a + b, 0) +
                Object.values(stats.mismatchedArtifacts).reduce((a, b) => a + b, 0) +
                Object.values(stats.missingArtifacts).reduce((a, b) => a + b, 0))) *
        100
    ).toFixed(2);

    console.log(`[DEBUG] Comparison statistics:`, stats);

    return { comparison, statistics: stats };
}

const result = comparePackages(env1Data, env2Data);

// Save comparison report
const reportFile = path.join(dataDir, `comparison-${args.env1}-vs-${args.env2}.json`);
fs.writeFileSync(reportFile, JSON.stringify(result, null, 2));
console.log(`[DEBUG] Comparison report saved to ${reportFile}`);
