const fs = require('fs');
const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');


// Create a Cookie Jar and enable axios to use it
const cookieJar = new CookieJar();
const axiosInstance = wrapper(
    axios.create({
        jar: cookieJar,
        withCredentials: true,
    })
);

// Configuration
const env = (key, fallback = '') => process.env?.[key] ?? fallback;
const CONFIG = {
    host: env('CPI_HOST'),
    tokenUrl: env('CPI_TOKENURL'),
    clientId: env('CPI_CLIENT_ID'),
    clientSecret: env('CPI_CLIENT_SECRET'),
};
// Cached OAuth Token
let cachedToken = null;
let tokenExpiry = null;

// Get OAuth Token (with caching)
async function getOAuthToken() {
    if (cachedToken && tokenExpiry && tokenExpiry > Date.now()) {
        return cachedToken;
    }

    try {
        const response = await axiosInstance.post(CONFIG.tokenUrl, null, {
            params: {
                grant_type: 'client_credentials',
            },
            auth: {
                username: CONFIG.clientId,
                password: CONFIG.clientSecret,
            },
        });

        cachedToken = response.data.access_token;
        // Set token expiry to current time + expiration duration - buffer time (5 minutes)
        tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

        return cachedToken;
    } catch (error) {
        console.error('Error fetching OAuth token:', error.response?.data || error.message);
        throw error;
    }
}

// Fetch Integration Packages
async function fetchPackages(accessToken) {
    try {
        const response = await axiosInstance.get(`${CONFIG.host}/IntegrationPackages`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data.d.results;
    } catch (error) {
        console.error('Error fetching packages:', error.response?.data || error.message);
        throw error;
    }
}

// Fetch iFlows using Navigation Property
async function fetchIflowsByPackage(packageId, accessToken) {
    try {
        const response = await axiosInstance.get(
            `${CONFIG.host}/IntegrationPackages('${encodeURIComponent(packageId)}')/IntegrationDesigntimeArtifacts`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        return response.data.d.results;
    } catch (error) {
        console.error(`Error fetching iFlows for package ${packageId}:`, error.response?.data || error.message);
        throw error;
    }
}

// Main Function
(async function main() {
    try {
        const token = await getOAuthToken();
        const packages = await fetchPackages(token);

        const results = await Promise.all(
            packages.map(async (pkg) => {
                const iflows = await fetchIflowsByPackage(pkg.Id, token);
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

        // console.log('Fetched Packages and iFlows:', JSON.stringify(results, null, 2));
        // Write results to a JSON file
        fs.writeFileSync('results.json', JSON.stringify(results, null, 2));
        console.log('Results saved to results.json');
    } catch (error) {
        console.error('An error occurred:', error.message);
    }
})();