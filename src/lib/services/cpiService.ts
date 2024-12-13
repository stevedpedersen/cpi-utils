// src/lib/services/cpiService
// CPI Service with Express Proxy Server Implementation
import axios, { type AxiosInstance } from "axios";
import { Buffer } from 'buffer';
import type {
    TenantConfig,
    PackageArtifacts,
    Artifact
} from '$lib/types/cpi';

interface CPIPackage {
    Id: string;
    Name: string;
}

interface OAuthTokenResponse {
    access_token: string;
}

interface CPIApiResponse<T> {
    d: {
        results: T[];
    };
}

export class CPIService {
    private config: TenantConfig;
    private client: AxiosInstance;

    constructor(config: TenantConfig) {
        this.config = config;
        this.client = axios.create({
            baseURL: `http://${process.env.HOST || "localhost"}:${process.env.PORT || 5000}/api` // All requests will be proxied through the Express server
        });
    }

    async getOAuthToken(): Promise<string> {
        try {
            const basicAuth = 'Basic ' + Buffer.from(this.config.clientId + ':' + this.config.clientSecret).toString('base64');

            const response = await axios.post(
                this.config.tokenUrl,
                'grant_type=client_credentials',
                {
                    headers: {
                        'Authorization': basicAuth,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            if (!response.data.access_token) {
                throw new Error('No access token in response');
            }

            return response.data.access_token;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    headers: error.config?.headers,
                });
            }
            throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async fetchPackages(): Promise<CPIPackage[]> {
        try {
            const token = await this.getOAuthToken();

            const response = await this.client.get<CPIApiResponse<CPIPackage>>(
                `${this.config.envName}/IntegrationPackages`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            return response.data?.d?.results || [];
        } catch (error) {
            console.error('Package Fetch Error', error);
            throw new Error('Failed to fetch packages');
        }
    }

    async fetchArtifacts(packageId: string): Promise<PackageArtifacts> {
        const token = await this.getOAuthToken();

        const artifactTypes: Array<keyof PackageArtifacts> = [
            'iflows',
            'valueMappings',
            'scriptCollections',
            'messageMappings'
        ];

        const artifactEndpoints: Record<keyof PackageArtifacts, string> = {
            iflows: 'IntegrationDesigntimeArtifacts',
            valueMappings: 'ValueMappingDesigntimeArtifacts',
            scriptCollections: 'ScriptCollectionDesigntimeArtifacts',
            messageMappings: 'MessageMappingDesigntimeArtifacts'
        };

        const artifacts: PackageArtifacts = {
            iflows: [],
            valueMappings: [],
            scriptCollections: [],
            messageMappings: []
        };

        for (const type of artifactTypes) {
            try {
                const response = await this.client.get<CPIApiResponse<Artifact>>(
                    `${this.config.envName}/IntegrationPackages('${packageId}')/${artifactEndpoints[type]}`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                artifacts[type] = response.data?.d?.results || [];
            } catch (error) {
                console.error(`Error fetching ${type}`, error);
                artifacts[type] = [];
            }
        }

        return artifacts;
    }
}
