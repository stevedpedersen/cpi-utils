// src/lib/services/cpiService
import axios, { type AxiosInstance } from "axios";
import { Buffer } from "buffer";
import type { TenantConfig, PackageArtifacts, Artifact } from "$lib/types/cpi";

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
      baseURL: this.config.host,
    });
  }

  async getOAuthToken(): Promise<string> {
    try {
      console.log("Authentication Attempt:", {
        tokenUrl: this.config.tokenUrl,
        clientId: this.config.clientId,
        // Mask the secret for security
        clientSecretMasked: this.config.clientSecret
          ? "*".repeat(this.config.clientSecret.length)
          : "MISSING",
      });

      const basicAuth =
        "Basic " +
        Buffer.from(
          this.config.clientId + ":" + this.config.clientSecret
        ).toString("base64");
      console.log("Request Headers:", {
        Authorization: basicAuth,
        "Content-Type": "application/x-www-form-urlencoded",
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
      });
      console.log("Request Body:", "grant_type=client_credentials");
      const response = await axios.post(
        this.config.tokenUrl,
        "grant_type=client_credentials", // Send grant_type as URL-encoded body
        {
          headers: {
            Authorization: basicAuth,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      // Log successful response structure
      console.log("Token Response:", {
        status: response.status,
        hasAccessToken: !!response.data.access_token,
      });

      if (!response.data.access_token) {
        throw new Error("No access token in response");
      }

      return response.data.access_token;
    } catch (error) {
      // Comprehensive error logging
      console.error("Full Authentication Error:", {
        errorName: error instanceof Error ? error.name : "Unknown Error",
        errorMessage: error instanceof Error ? error.message : "Unknown",
        isAxiosError: axios.isAxiosError(error),
      });

      if (axios.isAxiosError(error)) {
        console.error("Detailed Axios Error:", {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.config?.headers,
          url: error.config?.url,
          method: error.config?.method,
        });
      }

      throw new Error(
        `Authentication failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async fetchPackages(): Promise<CPIPackage[]> {
    try {
      const token = await this.getOAuthToken();

      const response = await this.client.get<CPIApiResponse<CPIPackage>>(
        "/IntegrationPackages",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data?.d?.results || [];
    } catch (error) {
      console.error("Package Fetch Error", error);
      throw new Error("Failed to fetch packages");
    }
  }

  async fetchArtifacts(packageId: string): Promise<PackageArtifacts> {
    const token = await this.getOAuthToken();

    const artifactTypes: Array<keyof PackageArtifacts> = [
      "iflows",
      "valueMappings",
      "scriptCollections",
      "messageMappings",
    ];

    const artifactEndpoints: Record<keyof PackageArtifacts, string> = {
      iflows: "IntegrationDesigntimeArtifacts",
      valueMappings: "ValueMappingDesigntimeArtifacts",
      scriptCollections: "ScriptCollectionDesigntimeArtifacts",
      messageMappings: "MessageMappingDesigntimeArtifacts",
    };

    const artifacts: PackageArtifacts = {
      iflows: [],
      valueMappings: [],
      scriptCollections: [],
      messageMappings: [],
    };

    for (const type of artifactTypes) {
      try {
        const response = await this.client.get<CPIApiResponse<Artifact>>(
          `/IntegrationPackages('${packageId}')/${artifactEndpoints[type]}`,
          {
            headers: { Authorization: `Bearer ${token}` },
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
