const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables dynamically
const args = require('yargs').argv;
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

// Create Axios Instance
function createAxiosInstance() {
    console.log(`[DEBUG] Creating new Axios instance`);
    return axios.create({});
}

let cachedToken = null;
let tokenExpiry = null;

async function getOAuthToken(axiosInstance) {
    if (cachedToken && tokenExpiry && tokenExpiry > Date.now()) {
        console.log(`[DEBUG] Using cached OAuth token`);
        return cachedToken;
    }
    console.log(`[DEBUG] Fetching new OAuth token`);
    try {
        const response = await axiosInstance.post(CONFIG.tokenUrl, null, {
            params: { grant_type: 'client_credentials' },
            auth: {
                username: CONFIG.clientId,
                password: CONFIG.clientSecret,
            },
        });
        cachedToken = response.data.access_token;
        tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;
        console.log(`[DEBUG] Fetched new OAuth token successfully`);
        return cachedToken;
    } catch (error) {
        console.error('[ERROR] Error fetching OAuth token:', error.response?.data || error.message);
        throw error;
    }
}

async function fetchPackages(axiosInstance, accessToken) {
    console.log(`[DEBUG] Fetching integration packages from: ${CONFIG.host}`);
    try {
        const response = await axiosInstance.get(`${CONFIG.host}/IntegrationPackages`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const results = response.data?.d?.results || [];
        console.log(`[DEBUG] Fetched ${results.length} packages`);
        return results;
    } catch (error) {
        console.error('[ERROR] Error fetching packages:', error.response?.data || error.message);
        throw error;
    }
}

async function fetchIflowsByPackage(axiosInstance, packageId, accessToken) {
    console.log(`[DEBUG] Fetching iFlows for package: ${packageId}`);
    try {
        const response = await axiosInstance.get(
            `${CONFIG.host}/IntegrationPackages('${encodeURIComponent(packageId)}')/IntegrationDesigntimeArtifacts`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );
        const results = response.data?.d?.results || [];
        console.log(`[DEBUG] Fetched ${results.length} iFlows for package: ${packageId}`);
        return results;
    } catch (error) {
        console.error(`[ERROR] Error fetching iFlows for package ${packageId}:`, error.response?.data || error.message);
        throw error;
    }
}

(async function main() {
    try {
        console.log(`[DEBUG] Starting data fetch for environment: ${args.env}`);
        const axiosInstance = createAxiosInstance();
        const token = await getOAuthToken(axiosInstance);
        const packages = await fetchPackages(axiosInstance, token);

        const results = await Promise.all(
            packages.map(async (pkg) => {
                const iflows = await fetchIflowsByPackage(axiosInstance, pkg.Id, token);
                return {
                    packageName: pkg.Name,
                    packageVersion: pkg.Version,
                    iflows: iflows.map((flow) => ({
                        name: flow.Name,
                        version: flow.Version,
                    })),
                };
            })
        );

        // Create ./data directory if it doesn't exist
        const outputDir = path.resolve(__dirname, './data');
        if (!fs.existsSync(outputDir)) {
            console.log(`[DEBUG] Creating directory: ${outputDir}`);
            fs.mkdirSync(outputDir);
        }

        // Construct file name and save
        const outputFileName = `results-${CONFIG.envName}.json`;
        const outputFilePath = path.join(outputDir, outputFileName);
        fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2));
        console.log(`[DEBUG] Results saved to ${outputFilePath}`);
    } catch (error) {
        console.error('[ERROR] An error occurred:', error.message);
    }
})();
