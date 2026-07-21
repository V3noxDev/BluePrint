import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ServerContext } from '@/state/server';
import http from '@/api/http';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheckCircle,
    faCubes,
    faDownload,
    faExclamationCircle,
    faFileAlt,
    faFolderOpen,
    faSave,
    faSearch,
    faSlidersH,
    faSync,
    faTrash,
    faUpload,
} from '@fortawesome/free-solid-svg-icons';
import tw from 'twin.macro';
import styled from 'styled-components/macro';

type TabKey = 'installer' | 'properties';
type AddonType = 'plugin' | 'mod' | 'datapack' | 'resourcepack';
type DirectoryKey = 'plugins' | 'mods' | 'config' | 'resourcepacks' | 'world/datapacks';
type NoticeType = 'success' | 'error';

interface NoticeState {
    type: NoticeType;
    message: string;
}

interface SearchHit {
    project_id: string;
    slug: string;
    title: string;
    description: string;
    downloads: number;
    categories: string[];
    icon_url: string | null;
}

interface VersionFile {
    url: string;
    filename: string;
    primary: boolean;
    size: number;
}

interface ProjectVersion {
    id: string;
    name: string;
    version_number: string;
    game_versions: string[];
    loaders: string[];
    featured: boolean;
    date_published: string;
    files: VersionFile[];
}

interface InstalledFile {
    name: string;
    size: number;
    modified_at?: string | null;
    mime?: string | null;
}

type PropertyFieldType = 'text' | 'number' | 'boolean' | 'select';

interface PropertyField {
    key: string;
    label: string;
    help: string;
    type: PropertyFieldType;
    placeholder?: string;
    options?: string[];
}

const DIRECTORY_BY_TYPE: Record<AddonType, DirectoryKey> = {
    plugin: 'plugins',
    mod: 'mods',
    datapack: 'world/datapacks',
    resourcepack: 'resourcepacks',
};

const LOADER_OPTIONS: Record<AddonType, string[]> = {
    plugin: ['paper', 'purpur', 'spigot', 'folia', 'velocity', 'bungeecord'],
    mod: ['fabric', 'forge', 'neoforge', 'quilt'],
    datapack: ['datapack'],
    resourcepack: ['resourcepack'],
};

const GAME_VERSIONS = [
    '1.21.6',
    '1.21.5',
    '1.21.4',
    '1.21.3',
    '1.21.1',
    '1.20.6',
    '1.20.4',
    '1.20.1',
    '1.19.4',
];

const PROPERTY_GROUPS: { title: string; fields: PropertyField[] }[] = [
    {
        title: 'Entrada e mundo',
        fields: [
            { key: 'motd', label: 'MOTD', help: 'Mensagem exibida na lista de servidores.', type: 'text', placeholder: 'Meu servidor Java' },
            { key: 'level-name', label: 'Nome do mundo', help: 'Pasta principal do mundo.', type: 'text', placeholder: 'world' },
            { key: 'level-seed', label: 'Seed', help: 'Seed fixa para novos mundos.', type: 'text', placeholder: '123456789' },
            { key: 'level-type', label: 'Tipo de mundo', help: 'Preset do gerador de mundo.', type: 'select', options: ['minecraft:normal', 'minecraft:flat', 'minecraft:large_biomes', 'minecraft:amplified'] },
        ],
    },
    {
        title: 'Jogabilidade',
        fields: [
            { key: 'gamemode', label: 'Gamemode', help: 'Modo inicial dos jogadores.', type: 'select', options: ['survival', 'creative', 'adventure', 'spectator'] },
            { key: 'difficulty', label: 'Dificuldade', help: 'Dificuldade principal do servidor.', type: 'select', options: ['peaceful', 'easy', 'normal', 'hard'] },
            { key: 'hardcore', label: 'Hardcore', help: 'Expulsa o jogador quando morre.', type: 'boolean' },
            { key: 'pvp', label: 'PVP', help: 'Ativa dano entre jogadores.', type: 'boolean' },
            { key: 'online-mode', label: 'Online mode', help: 'Autenticacao com servidores oficiais da Mojang.', type: 'boolean' },
            { key: 'white-list', label: 'Whitelist', help: 'Permite apenas jogadores autorizados.', type: 'boolean' },
        ],
    },
    {
        title: 'Performance e limites',
        fields: [
            { key: 'max-players', label: 'Max players', help: 'Numero maximo de jogadores simultaneos.', type: 'number', placeholder: '20' },
            { key: 'view-distance', label: 'View distance', help: 'Distancia de chunks enviados ao cliente.', type: 'number', placeholder: '10' },
            { key: 'simulation-distance', label: 'Simulation distance', help: 'Distancia de simulacao dos chunks.', type: 'number', placeholder: '10' },
            { key: 'spawn-protection', label: 'Spawn protection', help: 'Raio protegido em torno do spawn.', type: 'number', placeholder: '16' },
            { key: 'max-world-size', label: 'Max world size', help: 'Limite de tamanho do mundo.', type: 'number', placeholder: '29999984' },
        ],
    },
    {
        title: 'Recursos adicionais',
        fields: [
            { key: 'allow-nether', label: 'Allow Nether', help: 'Permite viajar para o Nether.', type: 'boolean' },
            { key: 'enable-command-block', label: 'Command blocks', help: 'Permite command blocks no servidor.', type: 'boolean' },
            { key: 'allow-flight', label: 'Allow flight', help: 'Evita kick por voo em clientes com fly.', type: 'boolean' },
            { key: 'enforce-whitelist', label: 'Enforce whitelist', help: 'Aplica whitelist mesmo com proxies.', type: 'boolean' },
            { key: 'enable-rcon', label: 'Enable RCON', help: 'Ativa acesso remoto via RCON.', type: 'boolean' },
        ],
    },
];

const Page = styled.div`
    ${tw`space-y-6 text-neutral-100`};
`;

const Hero = styled.div`
    ${tw`rounded-3xl p-6 md:p-8 overflow-hidden`};
    background:
        radial-gradient(circle at top right, rgba(56, 189, 248, 0.28), transparent 32%),
        radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.25), transparent 34%),
        linear-gradient(145deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.92));
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 20px 45px rgba(2, 6, 23, 0.35);
`;

const Grid = styled.div`
    ${tw`grid grid-cols-1 xl:grid-cols-12 gap-6`};
`;

const Panel = styled.div`
    ${tw`rounded-3xl p-5 md:p-6`};
    background: rgba(15, 23, 42, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 18px 38px rgba(2, 6, 23, 0.24);
`;

const StatCard = styled.div`
    ${tw`rounded-2xl p-4`};
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
`;

const TabButton = styled.button<{ active: boolean }>`
    ${tw`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200`};
    background: ${({ active }) => (active ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.82), rgba(99, 102, 241, 0.82))' : 'rgba(255, 255, 255, 0.04)')};
    color: ${({ active }) => (active ? 'white' : 'rgb(203 213 225)')};
    border: 1px solid ${({ active }) => (active ? 'rgba(147, 197, 253, 0.55)' : 'rgba(255, 255, 255, 0.07)')};
`;

const Input = styled.input`
    ${tw`w-full rounded-2xl px-4 py-3 text-sm outline-none`};
    background: rgba(15, 23, 42, 0.78);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: white;
    &:focus {
        border-color: rgba(56, 189, 248, 0.8);
        box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.16);
    }
`;

const Select = styled.select`
    ${tw`w-full rounded-2xl px-4 py-3 text-sm outline-none`};
    background: rgba(15, 23, 42, 0.78);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: white;
    &:focus {
        border-color: rgba(56, 189, 248, 0.8);
        box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.16);
    }
`;

const TextArea = styled.textarea`
    ${tw`w-full rounded-3xl px-4 py-4 text-sm outline-none font-mono`};
    background: rgba(2, 6, 23, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgb(226 232 240);
    min-height: 260px;
    &:focus {
        border-color: rgba(56, 189, 248, 0.8);
        box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.16);
    }
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
    ${tw`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed`};
    background: ${({ variant }) => {
        if (variant === 'secondary') return 'rgba(255, 255, 255, 0.05)';
        if (variant === 'danger') return 'rgba(239, 68, 68, 0.14)';
        return 'linear-gradient(135deg, rgba(14, 165, 233, 0.95), rgba(99, 102, 241, 0.95))';
    }};
    color: ${({ variant }) => (variant === 'secondary' ? 'rgb(226 232 240)' : 'white')};
    border: 1px solid ${({ variant }) => (variant === 'danger' ? 'rgba(248, 113, 113, 0.35)' : 'rgba(255, 255, 255, 0.08)')};
    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 10px 20px rgba(2, 6, 23, 0.25);
    }
`;

const ProjectCard = styled.button<{ active: boolean }>`
    ${tw`w-full text-left rounded-3xl p-4 transition-all duration-200`};
    background: ${({ active }) => (active ? 'rgba(14, 165, 233, 0.12)' : 'rgba(255, 255, 255, 0.03)')};
    border: 1px solid ${({ active }) => (active ? 'rgba(56, 189, 248, 0.45)' : 'rgba(255, 255, 255, 0.07)')};
    &:hover {
        border-color: rgba(56, 189, 248, 0.3);
        transform: translateY(-1px);
    }
`;

const Badge = styled.span`
    ${tw`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold`};
    background: rgba(99, 102, 241, 0.16);
    border: 1px solid rgba(165, 180, 252, 0.14);
    color: rgb(196 181 253);
`;

const Notice = styled.div<{ type: NoticeType }>`
    ${tw`rounded-2xl px-4 py-3 flex items-start gap-3 text-sm`};
    background: ${({ type }) => (type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)')};
    border: 1px solid ${({ type }) => (type === 'success' ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)')};
    color: ${({ type }) => (type === 'success' ? 'rgb(187 247 208)' : 'rgb(254 202 202)')};
`;

const extractError = (error: any, fallback: string) =>
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback;

const serializePropertiesPreview = (properties: Record<string, string>) =>
    `${Object.entries(properties)
        .filter(([key]) => key.trim().length > 0)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => `${key}=${value ?? ''}`)
        .join('\n')}\n`;

const inferFileName = (url: string, fallback: string) => {
    try {
        const parsed = new URL(url);
        const last = parsed.pathname.split('/').filter(Boolean).pop();
        return last || fallback;
    } catch {
        return fallback;
    }
};

const formatBytes = (size: number) => {
    if (!size) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const step = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
    const value = size / Math.pow(1024, step);
    return `${value.toFixed(value >= 10 || step === 0 ? 0 : 1)} ${units[step]}`;
};

const buildSearchUrl = (addonType: AddonType, loader: string, gameVersion: string, query: string) => {
    const facets: string[][] = [[`project_type:${addonType}`], [`versions:${gameVersion}`]];

    if (loader && !['datapack', 'resourcepack'].includes(loader)) {
        facets.push([`categories:${loader}`]);
    }

    const params = new URLSearchParams({
        facets: JSON.stringify(facets),
        limit: '12',
        index: 'downloads',
    });

    if (query.trim()) {
        params.set('query', query.trim());
    }

    return `https://api.modrinth.com/v2/search?${params.toString()}`;
};

export default () => {
    const server = ServerContext.useStoreState((state) => state.server.data);

    const [activeTab, setActiveTab] = useState<TabKey>('installer');
    const [notice, setNotice] = useState<NoticeState | null>(null);

    const [addonType, setAddonType] = useState<AddonType>('plugin');
    const [loader, setLoader] = useState('paper');
    const [gameVersion, setGameVersion] = useState('1.21.1');
    const [directory, setDirectory] = useState<DirectoryKey>('plugins');
    const [query, setQuery] = useState('');
    const [projects, setProjects] = useState<SearchHit[]>([]);
    const [selectedProject, setSelectedProject] = useState<SearchHit | null>(null);
    const [versions, setVersions] = useState<ProjectVersion[]>([]);
    const [searching, setSearching] = useState(false);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [installingKey, setInstallingKey] = useState('');

    const [manualUrl, setManualUrl] = useState('');
    const [manualFileName, setManualFileName] = useState('');
    const [installedFiles, setInstalledFiles] = useState<InstalledFile[]>([]);
    const [filesLoading, setFilesLoading] = useState(false);

    const [properties, setProperties] = useState<Record<string, string>>({});
    const [rawProperties, setRawProperties] = useState('');
    const [loadingProperties, setLoadingProperties] = useState(false);
    const [savingProperties, setSavingProperties] = useState(false);
    const [dirtyRaw, setDirtyRaw] = useState(false);

    const selectedLoaderOptions = useMemo(() => LOADER_OPTIONS[addonType], [addonType]);

    const pushNotice = useCallback((type: NoticeType, message: string) => {
        setNotice({ type, message });
    }, []);

    useEffect(() => {
        const nextDirectory = DIRECTORY_BY_TYPE[addonType];
        setDirectory(nextDirectory);

        const preferredLoader = LOADER_OPTIONS[addonType][0];
        setLoader(preferredLoader);
        setSelectedProject(null);
        setVersions([]);
    }, [addonType]);

    const searchProjects = useCallback(async () => {
        setSearching(true);
        setSelectedProject(null);
        setVersions([]);

        try {
            const response = await fetch(buildSearchUrl(addonType, loader, gameVersion, query));
            if (!response.ok) {
                throw new Error('A pesquisa no Modrinth falhou.');
            }

            const data = await response.json();
            setProjects(data.hits ?? []);
        } catch (error) {
            pushNotice('error', extractError(error, 'Nao foi possivel buscar addons no Modrinth.'));
        } finally {
            setSearching(false);
        }
    }, [addonType, gameVersion, loader, pushNotice, query]);

    useEffect(() => {
        searchProjects();
    }, [searchProjects]);

    const loadVersions = useCallback(async (project: SearchHit) => {
        setSelectedProject(project);
        setLoadingVersions(true);

        try {
            const response = await fetch(`https://api.modrinth.com/v2/project/${project.project_id}/version`);
            if (!response.ok) {
                throw new Error('Nao foi possivel carregar as versoes do addon.');
            }

            const data: ProjectVersion[] = await response.json();
            const filtered = data.filter((version) => {
                const matchesGameVersion = version.game_versions.includes(gameVersion);
                const matchesLoader =
                    loader === 'datapack' ||
                    loader === 'resourcepack' ||
                    version.loaders.length === 0 ||
                    version.loaders.includes(loader);

                return matchesGameVersion && matchesLoader;
            });

            setVersions(filtered);
        } catch (error) {
            pushNotice('error', extractError(error, 'Nao foi possivel buscar as versoes do addon.'));
        } finally {
            setLoadingVersions(false);
        }
    }, [gameVersion, loader, pushNotice]);

    const loadInstalledFiles = useCallback(async () => {
        if (!server?.uuid) return;

        setFilesLoading(true);

        try {
            const { data } = await http.get('/extensions/minecraftsuite/addons', {
                params: { serverUuid: server.uuid, directory },
            });

            setInstalledFiles(data.files ?? []);
        } catch (error) {
            pushNotice('error', extractError(error, 'Nao foi possivel listar os addons instalados.'));
        } finally {
            setFilesLoading(false);
        }
    }, [directory, pushNotice, server?.uuid]);

    useEffect(() => {
        if (activeTab === 'installer') {
            loadInstalledFiles();
        }
    }, [activeTab, loadInstalledFiles]);

    const installAddon = useCallback(async (downloadUrl: string, fileName: string) => {
        if (!server?.uuid) return;

        setInstallingKey(fileName);

        try {
            await http.post('/extensions/minecraftsuite/addons/install', {
                serverUuid: server.uuid,
                directory,
                downloadUrl,
                fileName,
            });

            pushNotice('success', `${fileName} enviado para instalacao em ${directory}.`);
            await loadInstalledFiles();
        } catch (error) {
            pushNotice('error', extractError(error, 'Nao foi possivel instalar o addon.'));
        } finally {
            setInstallingKey('');
        }
    }, [directory, loadInstalledFiles, pushNotice, server?.uuid]);

    const installManualAddon = useCallback(async () => {
        const fallbackExtension = addonType === 'resourcepack' || addonType === 'datapack' ? '.zip' : '.jar';
        const fileName = manualFileName.trim() || inferFileName(manualUrl, `addon-${Date.now()}${fallbackExtension}`);

        await installAddon(manualUrl.trim(), fileName);
        setManualUrl('');
        setManualFileName('');
    }, [addonType, installAddon, manualFileName, manualUrl]);

    const removeAddon = useCallback(async (fileName: string) => {
        if (!server?.uuid || !window.confirm(`Remover ${fileName} de ${directory}?`)) return;

        try {
            await http.delete('/extensions/minecraftsuite/addons/remove', {
                data: {
                    serverUuid: server.uuid,
                    directory,
                    fileName,
                },
            });

            pushNotice('success', `${fileName} removido com sucesso.`);
            await loadInstalledFiles();
        } catch (error) {
            pushNotice('error', extractError(error, 'Nao foi possivel remover o addon.'));
        }
    }, [directory, loadInstalledFiles, pushNotice, server?.uuid]);

    const loadProperties = useCallback(async () => {
        if (!server?.uuid) return;

        setLoadingProperties(true);

        try {
            const { data } = await http.get('/extensions/minecraftsuite/properties', {
                params: { serverUuid: server.uuid },
            });

            setProperties(data.properties ?? {});
            setRawProperties(data.raw ?? '');
            setDirtyRaw(false);
        } catch (error) {
            pushNotice('error', extractError(error, 'Nao foi possivel carregar server.properties.'));
        } finally {
            setLoadingProperties(false);
        }
    }, [pushNotice, server?.uuid]);

    useEffect(() => {
        if (activeTab === 'properties') {
            loadProperties();
        }
    }, [activeTab, loadProperties]);

    const updateProperty = (key: string, value: string) => {
        const next = { ...properties, [key]: value };
        setProperties(next);
        setRawProperties(serializePropertiesPreview(next));
        setDirtyRaw(false);
    };

    const saveServerProperties = useCallback(async () => {
        if (!server?.uuid) return;

        setSavingProperties(true);

        try {
            const payload = dirtyRaw
                ? { serverUuid: server.uuid, raw: rawProperties, createBackup: true }
                : { serverUuid: server.uuid, properties, createBackup: true };

            const { data } = await http.patch('/extensions/minecraftsuite/properties', payload);

            setProperties(data.properties ?? {});
            setRawProperties(data.raw ?? '');
            setDirtyRaw(false);
            pushNotice('success', 'server.properties salvo com backup automatico.');
        } catch (error) {
            pushNotice('error', extractError(error, 'Nao foi possivel salvar server.properties.'));
        } finally {
            setSavingProperties(false);
        }
    }, [dirtyRaw, properties, pushNotice, rawProperties, server?.uuid]);

    const stats = useMemo(() => ([
        { label: 'Servidor', value: server?.name || 'Minecraft Java' },
        { label: 'Diretorio ativo', value: directory },
        { label: 'Arquivos detectados', value: String(installedFiles.length) },
    ]), [directory, installedFiles.length, server?.name]);

    return (
        <Page>
            <Hero>
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-3 max-w-3xl">
                        <div className="flex items-center gap-3 text-sm text-sky-300">
                            <FontAwesomeIcon icon={faCubes} />
                            <span>Blueprint beta-2026-01 • Minecraft Java toolkit</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white">Astra MC Suite</h1>
                        <p className="text-sm md:text-base text-slate-300 leading-7">
                            Instale, remova e organize addons sem abrir o file manager, e ajuste o
                            <span className="text-white font-semibold"> server.properties </span>
                            por uma interface premium dentro do painel.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <TabButton active={activeTab === 'installer'} onClick={() => setActiveTab('installer')}>
                                <FontAwesomeIcon icon={faDownload} /> Instalador de addons
                            </TabButton>
                            <TabButton active={activeTab === 'properties'} onClick={() => setActiveTab('properties')}>
                                <FontAwesomeIcon icon={faSlidersH} /> Server properties
                            </TabButton>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 min-w-[280px]">
                        {stats.map((stat) => (
                            <StatCard key={stat.label}>
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
                                <p className="mt-2 text-lg font-semibold text-white break-words">{stat.value}</p>
                            </StatCard>
                        ))}
                    </div>
                </div>
            </Hero>

            {notice && (
                <Notice type={notice.type}>
                    <FontAwesomeIcon icon={notice.type === 'success' ? faCheckCircle : faExclamationCircle} className="mt-0.5" />
                    <span>{notice.message}</span>
                </Notice>
            )}

            {activeTab === 'installer' ? (
                <Grid>
                    <div className="xl:col-span-5">
                        <Panel>
                            <div className="flex items-center justify-between gap-3 mb-5">
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Busca premium de addons</h2>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Selecione tipo, loader e versao para achar o addon certo.
                                    </p>
                                </div>
                                <ActionButton variant="secondary" type="button" onClick={searchProjects} disabled={searching}>
                                    <FontAwesomeIcon icon={faSync} spin={searching} />
                                    Atualizar
                                </ActionButton>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs uppercase tracking-[0.16em] text-slate-400">Tipo do addon</label>
                                    <Select value={addonType} onChange={(event) => setAddonType(event.target.value as AddonType)}>
                                        <option value="plugin">Plugin</option>
                                        <option value="mod">Mod</option>
                                        <option value="datapack">Datapack</option>
                                        <option value="resourcepack">Resource pack</option>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-[0.16em] text-slate-400">Loader</label>
                                    <Select value={loader} onChange={(event) => setLoader(event.target.value)}>
                                        {selectedLoaderOptions.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-[0.16em] text-slate-400">Versao do Minecraft</label>
                                    <Select value={gameVersion} onChange={(event) => setGameVersion(event.target.value)}>
                                        {GAME_VERSIONS.map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-[0.16em] text-slate-400">Diretorio de destino</label>
                                    <Select value={directory} onChange={(event) => setDirectory(event.target.value as DirectoryKey)}>
                                        <option value="plugins">plugins</option>
                                        <option value="mods">mods</option>
                                        <option value="config">config</option>
                                        <option value="resourcepacks">resourcepacks</option>
                                        <option value="world/datapacks">world/datapacks</option>
                                    </Select>
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="text-xs uppercase tracking-[0.16em] text-slate-400">Busca</label>
                                <div className="flex gap-3 mt-1">
                                    <Input
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        placeholder="luckperms, geyser, worldedit..."
                                    />
                                    <ActionButton type="button" onClick={searchProjects} disabled={searching}>
                                        <FontAwesomeIcon icon={faSearch} /> Buscar
                                    </ActionButton>
                                </div>
                            </div>

                            <div className="mt-5 space-y-3 max-h-[720px] overflow-y-auto pr-1">
                                {projects.map((project) => (
                                    <ProjectCard
                                        key={project.project_id}
                                        active={selectedProject?.project_id === project.project_id}
                                        type="button"
                                        onClick={() => loadVersions(project)}
                                    >
                                        <div className="flex gap-4">
                                            {project.icon_url ? (
                                                <img src={project.icon_url} alt={project.title} className="w-14 h-14 rounded-2xl object-cover" />
                                            ) : (
                                                <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-sky-300">
                                                    <FontAwesomeIcon icon={faCubes} />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-semibold text-white">{project.title}</h3>
                                                    <Badge>{project.downloads.toLocaleString()} downloads</Badge>
                                                </div>
                                                <p className="text-sm text-slate-400 mt-2 leading-6">{project.description}</p>
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {project.categories.slice(0, 4).map((category) => (
                                                        <Badge key={category}>{category}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </ProjectCard>
                                ))}

                                {!searching && projects.length === 0 && (
                                    <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-slate-400">
                                        Nenhum addon encontrado para a combinacao atual.
                                    </div>
                                )}
                            </div>
                        </Panel>
                    </div>

                    <div className="xl:col-span-7 space-y-6">
                        <Panel>
                            <div className="flex items-center justify-between gap-3 mb-5">
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Versoes disponiveis</h2>
                                    <p className="text-sm text-slate-400 mt-1">
                                        {selectedProject ? `Escolha a release de ${selectedProject.title}.` : 'Selecione um addon na lista ao lado.'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {loadingVersions && <p className="text-sm text-slate-400">Carregando versoes...</p>}

                                {!loadingVersions && versions.map((version) => {
                                    const primaryFile = version.files.find((file) => file.primary) || version.files[0];
                                    if (!primaryFile) return null;

                                    return (
                                        <div key={version.id} className="rounded-3xl border border-white/8 bg-white/3 p-4">
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-white font-semibold">{version.name || version.version_number}</h3>
                                                        <Badge>{version.version_number}</Badge>
                                                        {version.featured && <Badge>featured</Badge>}
                                                    </div>
                                                    <p className="text-sm text-slate-400">
                                                        Loaders: {version.loaders.join(', ') || 'nao informado'} • MC {version.game_versions.join(', ')}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        Arquivo principal: {primaryFile.filename} • {formatBytes(primaryFile.size)}
                                                    </p>
                                                </div>

                                                <ActionButton
                                                    type="button"
                                                    onClick={() => installAddon(primaryFile.url, primaryFile.filename)}
                                                    disabled={installingKey === primaryFile.filename}
                                                >
                                                    <FontAwesomeIcon icon={faDownload} />
                                                    {installingKey === primaryFile.filename ? 'Instalando...' : 'Instalar agora'}
                                                </ActionButton>
                                            </div>
                                        </div>
                                    );
                                })}

                                {!loadingVersions && selectedProject && versions.length === 0 && (
                                    <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-slate-400">
                                        Nenhuma release desse addon bate com o filtro de loader/versao atual.
                                    </div>
                                )}
                            </div>
                        </Panel>

                        <Panel>
                            <div className="flex items-center gap-3 mb-4">
                                <FontAwesomeIcon icon={faUpload} className="text-sky-300" />
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Instalacao manual por URL</h2>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Ideal para addons premium, builds internas ou downloads diretos.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="md:col-span-2">
                                    <label className="text-xs uppercase tracking-[0.16em] text-slate-400">Download URL</label>
                                    <Input value={manualUrl} onChange={(event) => setManualUrl(event.target.value)} placeholder="https://cdn.exemplo.com/meu-addon.jar" />
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-[0.16em] text-slate-400">Nome do arquivo</label>
                                    <Input value={manualFileName} onChange={(event) => setManualFileName(event.target.value)} placeholder="meu-addon.jar" />
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-[0.16em] text-slate-400">Destino atual</label>
                                    <Input value={directory} readOnly />
                                </div>
                            </div>

                            <div className="mt-4">
                                <ActionButton type="button" onClick={installManualAddon} disabled={!manualUrl.trim()}>
                                    <FontAwesomeIcon icon={faUpload} /> Instalar via URL
                                </ActionButton>
                            </div>
                        </Panel>

                        <Panel>
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <div className="flex items-center gap-3">
                                    <FontAwesomeIcon icon={faFolderOpen} className="text-sky-300" />
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">Arquivos instalados</h2>
                                        <p className="text-sm text-slate-400 mt-1">Remova addons diretamente do diretorio selecionado.</p>
                                    </div>
                                </div>
                                <ActionButton variant="secondary" type="button" onClick={loadInstalledFiles} disabled={filesLoading}>
                                    <FontAwesomeIcon icon={faSync} spin={filesLoading} /> Atualizar lista
                                </ActionButton>
                            </div>

                            <div className="space-y-3">
                                {installedFiles.map((file) => (
                                    <div key={file.name} className="rounded-3xl border border-white/8 bg-white/3 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="min-w-0">
                                            <p className="font-medium text-white truncate">{file.name}</p>
                                            <p className="text-sm text-slate-400 mt-1">{formatBytes(file.size)}</p>
                                        </div>
                                        <ActionButton variant="danger" type="button" onClick={() => removeAddon(file.name)}>
                                            <FontAwesomeIcon icon={faTrash} /> Remover
                                        </ActionButton>
                                    </div>
                                ))}

                                {!filesLoading && installedFiles.length === 0 && (
                                    <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-slate-400">
                                        Nenhum arquivo detectado em <span className="text-white">{directory}</span>.
                                    </div>
                                )}
                            </div>
                        </Panel>
                    </div>
                </Grid>
            ) : (
                <Grid>
                    <div className="xl:col-span-7 space-y-6">
                        <Panel>
                            <div className="flex items-center justify-between gap-3 mb-5">
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Editor visual</h2>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Campos populares do Minecraft Java com save e backup automatico.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <ActionButton variant="secondary" type="button" onClick={loadProperties} disabled={loadingProperties}>
                                        <FontAwesomeIcon icon={faSync} spin={loadingProperties} /> Recarregar
                                    </ActionButton>
                                    <ActionButton type="button" onClick={saveServerProperties} disabled={savingProperties}>
                                        <FontAwesomeIcon icon={faSave} /> {savingProperties ? 'Salvando...' : 'Salvar'}
                                    </ActionButton>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {PROPERTY_GROUPS.map((group) => (
                                    <div key={group.title} className="rounded-3xl border border-white/8 bg-white/3 p-4 md:p-5">
                                        <h3 className="text-lg font-semibold text-white mb-4">{group.title}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {group.fields.map((field) => {
                                                const value = properties[field.key] ?? '';

                                                return (
                                                    <div key={field.key} className="space-y-2">
                                                        <div>
                                                            <p className="text-sm font-medium text-white">{field.label}</p>
                                                            <p className="text-xs text-slate-400 mt-1">{field.help}</p>
                                                        </div>

                                                        {field.type === 'select' ? (
                                                            <Select value={value} onChange={(event) => updateProperty(field.key, event.target.value)}>
                                                                <option value="">Selecione</option>
                                                                {field.options?.map((option) => (
                                                                    <option key={option} value={option}>{option}</option>
                                                                ))}
                                                            </Select>
                                                        ) : field.type === 'boolean' ? (
                                                            <Select value={value || 'false'} onChange={(event) => updateProperty(field.key, event.target.value)}>
                                                                <option value="true">true</option>
                                                                <option value="false">false</option>
                                                            </Select>
                                                        ) : (
                                                            <Input
                                                                type={field.type === 'number' ? 'number' : 'text'}
                                                                value={value}
                                                                onChange={(event) => updateProperty(field.key, event.target.value)}
                                                                placeholder={field.placeholder}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Panel>
                    </div>

                    <div className="xl:col-span-5 space-y-6">
                        <Panel>
                            <div className="flex items-center gap-3 mb-4">
                                <FontAwesomeIcon icon={faFileAlt} className="text-sky-300" />
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Editor bruto</h2>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Para propriedades extras fora da interface visual.
                                    </p>
                                </div>
                            </div>

                            <TextArea
                                value={rawProperties}
                                onChange={(event) => {
                                    setRawProperties(event.target.value);
                                    setDirtyRaw(true);
                                }}
                                spellCheck={false}
                            />

                            <div className="flex flex-wrap gap-3 mt-4">
                                <ActionButton type="button" onClick={saveServerProperties} disabled={savingProperties}>
                                    <FontAwesomeIcon icon={faSave} /> Salvar bruto
                                </ActionButton>
                                <ActionButton variant="secondary" type="button" onClick={loadProperties} disabled={loadingProperties}>
                                    <FontAwesomeIcon icon={faSync} /> Restaurar do arquivo
                                </ActionButton>
                            </div>
                        </Panel>

                        <Panel>
                            <div className="flex items-start gap-3">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-300 mt-1" />
                                <div className="space-y-2 text-sm text-slate-300">
                                    <h3 className="text-white font-semibold">Como esta extensao salva o arquivo</h3>
                                    <p>
                                        No modo visual, a API faz merge das propriedades no arquivo atual e cria um
                                        <code className="mx-1 text-sky-300">server.properties.bak</code>
                                        antes de salvar.
                                    </p>
                                    <p>
                                        No modo bruto, o conteudo que voce editar sera gravado exatamente como enviado,
                                        tambem com backup automatico.
                                    </p>
                                </div>
                            </div>
                        </Panel>
                    </div>
                </Grid>
            )}
        </Page>
    );
};
