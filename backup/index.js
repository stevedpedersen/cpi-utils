const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');
const args = require('yargs').argv;

// Load environment variables dynamically
if (!args.env) {
    console.error('Please provide an environment file with --env');
    process.exit(1);
}
dotenv.config({ path: args.env });
console.log(`[DEBUG] Loaded environment: ${args.env}`);

// Configuration
const CONFIG = {
    host: process.env.CPI_HOST,
    tokenUrl: process.env.CPI_TOKENURL,
    clientId: process.env.CPI_CLIENT_ID,
    clientSecret: process.env.CPI_CLIENT_SECRET,
    envName: process.env.ENV_NAME || 'unknown-env', // Dynamically used for naming files
};
console.log(`[DEBUG] Configuration: Host - ${CONFIG.host}, Env Name - ${CONFIG.envName}`);

// Helper to fetch token and create Axios instance
async function getOAuthToken() {
    console.log(`[DEBUG] Fetching new OAuth token`);
    try {
        const response = await axios.post(CONFIG.tokenUrl, null, {
            params: { grant_type: 'client_credentials' },
            auth: {
                username: CONFIG.clientId,
                password: CONFIG.clientSecret,
            },
        });
        console.log(`[DEBUG] Fetched new OAuth token successfully`);
        return response.data.access_token;
    } catch (error) {
        console.error('[ERROR] Error fetching OAuth token:', error.response?.data || error.message);
        throw error;
    }
}

function createAxiosInstance(accessToken) {
    return axios.create({
        baseURL: CONFIG.host,
        headers: { Authorization: `Bearer ${accessToken}` },
    });
}

// Fetch iFlows, value mappings, script collections, and message mappings
async function fetchArtifacts(axiosInstance, packageId) {
    const artifactEndpoints = [
        { key: 'iflows', url: `/IntegrationPackages('${packageId}')/IntegrationDesigntimeArtifacts` },
        { key: 'valueMappings', url: `/IntegrationPackages('${packageId}')/ValueMappingDesigntimeArtifacts` },
        { key: 'scriptCollections', url: `/IntegrationPackages('${packageId}')/ScriptCollectionDesigntimeArtifacts` },
        { key: 'messageMappings', url: `/IntegrationPackages('${packageId}')/MessageMappingDesigntimeArtifacts` },
    ];

    const artifacts = {};
    for (const { key, url } of artifactEndpoints) {
        try {
            console.log(`[DEBUG] Fetching ${key} for package: ${packageId}`);
            const response = await axiosInstance.get(url);
            artifacts[key] = response.data?.d?.results || [];
            console.log(`[DEBUG] Fetched ${artifacts[key].length} ${key} for package: ${packageId}`);
        } catch (error) {
            console.error(`[ERROR] Error fetching ${key} for package ${packageId}:`, error.response?.data || error.message);
            artifacts[key] = [];
        }
    }

    return artifacts;
}

// Fetch packages and their artifacts
async function fetchPackagesAndArtifacts(axiosInstance) {
    console.log(`[DEBUG] Fetching integration packages`);
    try {
        const response = await axiosInstance.get('/IntegrationPackages');
        const packages = response.data?.d?.results || [];
        console.log(`[DEBUG] Fetched ${packages.length} packages`);
        return await Promise.all(
            packages.map(async (pkg) => {
                const artifacts = await fetchArtifacts(axiosInstance, pkg.Id);
                return {
                    packageName: pkg.Name,
                    packageVersion: pkg.Version,
                    artifacts,
                };
            })
        );
    } catch (error) {
        console.error('[ERROR] Error fetching packages:', error.response?.data || error.message);
        throw error;
    }
}

// Main function
(async function main() {
    try {
        console.log(`[DEBUG] Starting data fetch for environment: ${args.env}`);
        const accessToken = await getOAuthToken();
        const axiosInstance = createAxiosInstance(accessToken);
        const results = await fetchPackagesAndArtifacts(axiosInstance);

        // Create ./data directory if it doesn't exist
        const outputDir = path.resolve(__dirname, './output');
        const dataDir = path.join(outputDir, 'data');
        
        if (!fs.existsSync(outputDir)) {
            console.log(`[DEBUG] Creating directory: ${outputDir}`);
            fs.mkdirSync(outputDir);
        }
        
        if (!fs.existsSync(dataDir)) {
            console.log(`[DEBUG] Creating directory: ${dataDir}`);
            fs.mkdirSync(dataDir);
        }

        // Save results
        const outputFileName = `results-${CONFIG.envName}.json`;
        const outputFilePath = path.join(dataDir, outputFileName);
        fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2));
        console.log(`[DEBUG] Results saved to ${outputFilePath}`);
    } catch (error) {
        console.error('[ERROR] An error occurred:', error.message);
    }
})();
