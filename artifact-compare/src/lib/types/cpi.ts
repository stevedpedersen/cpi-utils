// src/lib/types/cpi.ts:
export interface TenantConfig {
    envName: string;
    host: string;
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
}

export interface Artifact {
    Id: string;
    Name: string;
    Version: string;
    status?: 'Match' | 'Missing in Env1' | 'Missing in Env2';
}

export interface PackageArtifacts {
    iflows: Artifact[];
    valueMappings: Artifact[];
    scriptCollections: Artifact[];
    messageMappings: Artifact[];
}

export interface PackageComparison {
    packageName: string;
    status: 'Exact Match' | 'Subset Match' | 'Missing in Env1' | 'Missing in Env2';
    artifacts: PackageArtifacts;
}

export interface PackageWithArtifacts {
    Name: string;
    Id: string;
    Version?: string;
    artifacts: PackageArtifacts;
}

export interface PerformanceMetrics {
    fetchTime: number;
    processingTime: number;
    totalTime: number;
}