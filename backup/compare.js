const fs = require('fs');
const path = require('path');
const args = require('yargs').argv;

// Ensure environment names are provided
if (!args.env1 || !args.env2) {
    console.error('[ERROR] Please provide two tenant environment names with --env1 and --env2');
    process.exit(1);
}

// File paths for environment data
const outputDir = path.resolve(__dirname, './output');
const dataDir = path.join(outputDir, 'data');
const env1File = path.join(dataDir, `results-${args.env1}.json`);
const env2File = path.join(dataDir, `results-${args.env2}.json`);

// Load data for both environments
const loadEnvironmentData = (filePath) => {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (error) {
        console.error(`[ERROR] Could not load file: ${filePath}`, error.message);
        process.exit(1);
    }
};

const env1Data = loadEnvironmentData(env1File);
const env2Data = loadEnvironmentData(env2File);

console.log(`[DEBUG] Loaded Env1 data: ${env1Data.length} packages`);
console.log(`[DEBUG] Loaded Env2 data: ${env2Data.length} packages`);

// Compare packages and artifacts
const comparePackages = (env1Packages, env2Packages) => {
    const comparison = [];

    env1Packages.forEach(env1Pkg => {
        const matchedEnv2Pkg = env2Packages.find(env2Pkg => env2Pkg.packageName === env1Pkg.packageName);
        if (matchedEnv2Pkg) {
            const artifactsComparison = {
                iflows: compareArtifacts(env1Pkg.artifacts.iflows, matchedEnv2Pkg.artifacts.iflows),
                valueMappings: compareArtifacts(env1Pkg.artifacts.valueMappings, matchedEnv2Pkg.artifacts.valueMappings),
                scriptCollections: compareArtifacts(env1Pkg.artifacts.scriptCollections, matchedEnv2Pkg.artifacts.scriptCollections),
                messageMappings: compareArtifacts(env1Pkg.artifacts.messageMappings, matchedEnv2Pkg.artifacts.messageMappings),
            };

            const status = isExactMatch(artifactsComparison) ? 'Exact Match' : 'Subset Match';
            comparison.push({ packageName: env1Pkg.packageName, status, artifacts: artifactsComparison });
        } else {
            comparison.push({ packageName: env1Pkg.packageName, status: 'Missing in Env2', artifacts: {} });
        }
    });

    env2Packages.forEach(env2Pkg => {
        if (!env1Packages.find(env1Pkg => env1Pkg.packageName === env2Pkg.packageName)) {
            comparison.push({ packageName: env2Pkg.packageName, status: 'Missing in Env1', artifacts: {} });
        }
    });

    return comparison;
};

const compareArtifacts = (env1Artifacts = [], env2Artifacts = []) => {
    const result = [];
    const env2ArtifactIds = env2Artifacts.map(a => a.Id);

    env1Artifacts.forEach(artifact => {
        if (env2ArtifactIds.includes(artifact.Id)) {
            result.push({ Id: artifact.Id, status: 'Match' });
        } else {
            result.push({ Id: artifact.Id, status: 'Missing in Env2' });
        }
    });

    env2Artifacts.forEach(artifact => {
        if (!env1Artifacts.find(a => a.Id === artifact.Id)) {
            result.push({ Id: artifact.Id, status: 'Missing in Env1' });
        }
    });

    return result;
};

const isExactMatch = (artifacts) => {
    return Object.values(artifacts).every(list => list.every(item => item.status === 'Match'));
};

// Perform comparison
const result = comparePackages(env1Data, env2Data);

// Save comparison report
const reportFile = path.join(dataDir, `comparison-${args.env1}-vs-${args.env2}.json`);
fs.writeFileSync(reportFile, JSON.stringify(result, null, 2));
console.log(`[INFO] Comparison report saved to ${reportFile}`);

module.exports = { comparePackages };
