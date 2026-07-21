import http from '@/api/http';
import {
    AddonKind,
    CatalogIndex,
    CatalogResponse,
    InstallResponse,
    InstalledResponse,
    ProjectVersion,
    PropertiesResponse,
} from './types';

const endpoint = (uuid: string, path: string): string =>
    `/api/client/extensions/mineflow/servers/${uuid}${path}`;

export const searchCatalog = (
    uuid: string,
    filters: {
        query: string;
        kind: AddonKind;
        gameVersion: string;
        loader: string;
        index: CatalogIndex;
        offset: number;
    }
): Promise<CatalogResponse> =>
    http
        .get<CatalogResponse>(endpoint(uuid, '/catalog'), {
            params: {
                query: filters.query || undefined,
                kind: filters.kind,
                game_version: filters.gameVersion || undefined,
                loader: filters.loader || undefined,
                index: filters.index,
                offset: filters.offset,
                limit: 20,
            },
        })
        .then(({ data }) => data);

export const getProjectVersions = (
    uuid: string,
    project: string,
    gameVersion: string,
    loader: string
): Promise<ProjectVersion[]> =>
    http
        .get<{ versions: ProjectVersion[] }>(
            endpoint(uuid, `/projects/${encodeURIComponent(project)}/versions`),
            {
                params: {
                    game_version: gameVersion || undefined,
                    loader: loader || undefined,
                },
            }
        )
        .then(({ data }) => data.versions);

export const installAddon = (
    uuid: string,
    kind: AddonKind,
    projectId: string,
    versionId: string
): Promise<InstallResponse> =>
    http
        .post<InstallResponse>(endpoint(uuid, '/install'), {
            kind,
            project_id: projectId,
            version_id: versionId,
        }, {
            timeout: 180000,
        })
        .then(({ data }) => data);

export const getInstalledAddons = (uuid: string, kind: AddonKind): Promise<InstalledResponse> =>
    http.get<InstalledResponse>(endpoint(uuid, '/installed'), { params: { kind } }).then(({ data }) => data);

export const removeAddon = (uuid: string, kind: AddonKind, filename: string): Promise<void> =>
    http
        .delete(endpoint(uuid, '/installed'), {
            data: { kind, filename },
        })
        .then(() => undefined);

export const getServerProperties = (uuid: string): Promise<PropertiesResponse> =>
    http.get<PropertiesResponse>(endpoint(uuid, '/properties')).then(({ data }) => data);

export const updateServerProperties = (
    uuid: string,
    properties: Record<string, string>,
    remove: string[]
): Promise<Record<string, string>> =>
    http
        .patch<{ properties: Record<string, string> }>(endpoint(uuid, '/properties'), { properties, remove })
        .then(({ data }) => data.properties);
