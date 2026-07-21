export type AddonType = 'plugin' | 'mod';

export interface MineHubConfiguration {
    plugins_enabled: boolean;
    mods_enabled: boolean;
    properties_enabled: boolean;
    default_section: AddonType;
    provider: string;
}

export interface CatalogOption {
    id: string;
    name: string;
}

export interface CatalogMetadata {
    versions: Array<CatalogOption & { released_at?: string | null }>;
    loaders: Record<AddonType, CatalogOption[]>;
}

export interface CatalogProject {
    id: string;
    slug: string;
    title: string;
    description: string;
    author: string;
    downloads: number;
    icon_url: string | null;
    categories: string[];
    updated_at: string | null;
}

export interface CatalogVersion {
    id: string;
    name: string;
    version_number: string;
    version_type: string;
    published_at: string | null;
    game_versions: string[];
    loaders: string[];
    file: {
        filename: string;
        url: string;
        size: number;
        sha512: string | null;
    };
}

export interface InstalledAddon {
    name: string;
    size: number;
    modifiedAt: string | null;
    disabled: boolean;
}
