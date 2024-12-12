import type { PackageComparison, Artifact } from '$lib/types/cpi';

export class ComparisonService {
    comparePackages(env1Packages: any[], env2Packages: any[]): PackageComparison[] {
        const comparison: PackageComparison[] = [];

        env1Packages.forEach(env1Pkg => {
            const matchedEnv2Pkg = env2Packages.find(
                env2Pkg => env2Pkg.Name === env1Pkg.Name
            );

            if (matchedEnv2Pkg) {
                const artifactsComparison = this.compareArtifacts(env1Pkg, matchedEnv2Pkg);
                const status = this.determinePackageStatus(artifactsComparison);

                comparison.push({
                    packageName: env1Pkg.Name,
                    status,
                    artifacts: artifactsComparison
                });
            } else {
                comparison.push({
                    packageName: env1Pkg.Name,
                    status: 'Missing in Env2',
                    artifacts: {
                        iflows: [],
                        valueMappings: [],
                        scriptCollections: [],
                        messageMappings: []
                    }
                });
            }
        });

        return comparison;
    }

    private compareArtifacts(env1Pkg: any, env2Pkg: any) {
        const artifactTypes = [
            'iflows', 'valueMappings',
            'scriptCollections', 'messageMappings'
        ];

        return artifactTypes.reduce((acc, type) => {
            acc[type] = this.compareArtifactList(
                env1Pkg.artifacts[type] || [],
                env2Pkg.artifacts[type] || []
            );
            return acc;
        }, {} as any);
    }

    private compareArtifactList(env1Artifacts: Artifact[], env2Artifacts: Artifact[]): Artifact[] {
        const env2ArtifactIds = env2Artifacts.map(a => a.Id);

        return env1Artifacts.map(artifact => ({
            ...artifact,
            status: env2ArtifactIds.includes(artifact.Id) ? 'Match' : 'Missing in Env2'
        }));
    }

    private determinePackageStatus(artifacts: any): PackageComparison['status'] {
        const allMatch = Object.values(artifacts).every(
            (list: Artifact[]) => list.every(item => item.status === 'Match')
        );

        return allMatch ? 'Exact Match' : 'Subset Match';
    }
}