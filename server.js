import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PUBLIC_PROXY_PORT || 5001;

// Load tenant configurations dynamically
let tenants = [];
try {
    const tenantsRaw = fs.readFileSync('tenants.json', 'utf-8');
    tenants = JSON.parse(tenantsRaw).tenants;
    tenants.forEach((tenant) => {
        ['name', 'host', 'tokenUrl', 'clientId', 'clientSecret'].forEach((key) => {
            if (!tenant[key]) {
                console.warn(`Warning: Missing ${key} in tenant ${tenant.name}`);
            }
        });
    });
} catch (error) {
    console.error('Failed to load tenants.json. Ensure the file exists and is valid JSON.');
    console.error('Error details:', error.message);
    process.exit(1); // Exit if critical tenant data is missing
}

app.use(express.json());
app.use(cors());


// List tenants for client reference
app.get('/api/tenants', (req, res) => {
    res.json(tenants.map(t => ({ name: t.name, host: t.host })));
});

// Log requests for debugging
app.use('/api/:env', (req, res, next) => {
    console.log(`[${new Date().toISOString()}] Proxying request for environment: ${req.params.env}`);
    console.log(`Request: ${req.method} ${req.originalUrl}`);
    next();
});

// Dynamic route to proxy based on the prefix in the path
app.use('/api/:env', async (req, res) => {
    const env = req.params.env;
    const tenant = tenants.find(t => t.name === env);

    if (!tenant) {
        console.error(`Unknown environment: ${env}`);
        return res.status(400).json({ error: `Unknown environment: ${env}` });
    }

    try {
        const targetUrl = `${tenant.host}${req.originalUrl.replace(`/api/${env}`, '')}`;
        const headers = { ...req.headers };
        delete headers.host;

        const response = await axios({
            method: req.method,
            url: targetUrl,
            headers,
            data: req.body,
        });

        res.status(response.status).send(response.data);
    } catch (error) {
        console.error(`Error proxying request: ${error.message}`);
        console.error(`Request details: ${req.method} ${req.originalUrl}`);
        res.status(error.response?.status || 500).json({
            error: error.message || 'Proxy error',
            details: error.response?.data || {},
        });
    }
});


app.listen(PORT, () => {
    console.log(`Dynamic proxy server running on port ${PORT}`);
});
