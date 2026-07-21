export type AddonKind = 'plugin' | 'mod';
export type CatalogIndex = 'relevance' | 'downloads' | 'follows' | 'newest' | 'updated';

export interface CatalogProject {
    project_id: string;
    slug: string;
    title: string;
    description: string;
    author: string;
    icon_url: string | null;
    downloads: number;
    follows: number;
    date_modified: string | null;
    latest_version: string | null;
    project_type: AddonKind;
    categories: string[];
    versions: string[];
    display_categories: string[];
}

export interface CatalogResponse {
    hits: CatalogProject[];
    offset: number;
    limit: number;
    total_hits: number;
}

export interface ProjectVersion {
    id: string;
    project_id: string;
    name: string;
    version_number: string;
    version_type: 'release' | 'beta' | 'alpha';
    date_published: string | null;
    downloads: number;
    game_versions: string[];
    loaders: string[];
    files: Array<{
        filename: string;
        size: number;
        primary: boolean;
    }>;
}

export interface InstalledAddon {
    name: string;
    size: number;
    modified_at: string | null;
}

export interface InstalledResponse {
    kind: AddonKind;
    directory: string;
    addons: InstalledAddon[];
}

export interface PropertiesResponse {
    path: string;
    exists: boolean;
    properties: Record<string, string>;
}

export interface InstallResponse {
    message: string;
    addon: {
        name: string;
        path: string;
        size: number;
        version: string;
    };
}
