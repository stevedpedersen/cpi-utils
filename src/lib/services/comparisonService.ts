import type {
    PackageComparison,
    Artifact,
    PackageArtifacts,
    PackageWithArtifacts
} from '$lib/types/cpi';


export class ComparisonService {
    comparePackages(
        env1Packages: PackageWithArtifacts[],
        env2Packages: PackageWithArtifacts[]
    ): PackageComparison[] {
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

    private compareArtifacts(
        env1Pkg: PackageWithArtifacts,
        env2Pkg: PackageWithArtifacts
    ): PackageArtifacts {
        const artifactTypes: Array<keyof PackageArtifacts> = [
            'iflows', 'valueMappings',
            'scriptCollections', 'messageMappings'
        ];

        return artifactTypes.reduce((acc, type) => {
            acc[type] = this.compareArtifactList(
                env1Pkg.artifacts[type] || [],
                env2Pkg.artifacts[type] || []
            );
            return acc;
        }, {
            iflows: [],
            valueMappings: [],
            scriptCollections: [],
            messageMappings: []
        } as PackageArtifacts);
    }

    private compareArtifactList(
        env1Artifacts: Artifact[],
        env2Artifacts: Artifact[]
    ): Artifact[] {
        const env2ArtifactIds = env2Artifacts.map(a => a.Id);

        return env1Artifacts.map(artifact => ({
            ...artifact,
            status: env2ArtifactIds.includes(artifact.Id) ? 'Match' : 'Missing in Env2'
        }));
    }

    private determinePackageStatus(
        artifacts: PackageArtifacts
    ): PackageComparison['status'] {
        const allMatch = (Object.keys(artifacts) as Array<keyof PackageArtifacts>).every(
            type => artifacts[type].every(item => item.status === 'Match')
        );

        return allMatch ? 'Exact Match' : 'Subset Match';
    }
}
