import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import http, { httpErrorToHuman } from '@/api/http';
import {
    Button,
    Card,
    CardCopy,
    CardFooter,
    CardGrid,
    CardTop,
    Content,
    Description,
    Divider,
    EmptyState,
    Field,
    Filters,
    Heading,
    Input,
    LoadingState,
    Meta,
    ModalBackdrop,
    ModalBody,
    ModalCard,
    ModalHeader,
    Notice,
    Panel,
    PanelHeader,
    Pill,
    ProjectIcon,
    SectionTitle,
    Select,
    Spinner,
    Toolbar,
    VersionButton,
    VersionList,
} from '../styles';
import { AddonType, CatalogMetadata, CatalogProject, CatalogVersion, InstalledAddon } from '../types';

interface AddonsPanelProps {
    serverIdentifier: string;
    addonType: AddonType;
    onAddonTypeChange: (type: AddonType) => void;
    enabledTypes: AddonType[];
    metadata: CatalogMetadata;
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
}

interface SearchResponse {
    data: CatalogProject[];
    meta: {
        offset: number;
        limit: number;
        total: number;
    };
}

interface StatusMessage {
    tone: 'success' | 'danger' | 'warning' | 'info';
    text: string;
}

const directoryFor = (type: AddonType): string => (type === 'plugin' ? '/plugins' : '/mods');
const typeLabel = (type: AddonType): string => (type === 'plugin' ? 'plugin' : 'mod');
const formatDownloads = (value: number): string => {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1).replace('.0', '')} mi`;
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(1).replace('.0', '')} mil`;
    }

    return String(value);
};
const formatBytes = (value: number): string => {
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;

    return `${(value / 1024 / 1024).toFixed(1)} MB`;
};
const errorStatus = (error: unknown): number | undefined =>
    (error as { response?: { status?: number } })?.response?.status;

const AddonsPanel = ({
    serverIdentifier,
    addonType,
    onAddonTypeChange,
    enabledTypes,
    metadata,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
}: AddonsPanelProps) => {
    const availableLoaders = metadata.loaders[addonType] ?? [];
    const [gameVersion, setGameVersion] = useState(metadata.versions[0]?.id ?? '');
    const [loader, setLoader] = useState(availableLoaders[0]?.id ?? '');
    const [sort, setSort] = useState('relevance');
    const [query, setQuery] = useState('');
    const [submittedQuery, setSubmittedQuery] = useState('');
    const [searchNonce, setSearchNonce] = useState(0);
    const [offset, setOffset] = useState(0);
    const [projects, setProjects] = useState<CatalogProject[]>([]);
    const [searchMeta, setSearchMeta] = useState({
        offset: 0,
        limit: 12,
        total: 0,
    });
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [installed, setInstalled] = useState<InstalledAddon[]>([]);
    const [installedLoading, setInstalledLoading] = useState(false);
    const [directoryExists, setDirectoryExists] = useState(true);
    const [status, setStatus] = useState<StatusMessage | null>(null);
    const [selectedProject, setSelectedProject] = useState<CatalogProject | null>(null);
    const [versions, setVersions] = useState<CatalogVersion[]>([]);
    const [versionsLoading, setVersionsLoading] = useState(false);
    const [installingVersion, setInstallingVersion] = useState<string | null>(null);
    const [deletingAddon, setDeletingAddon] = useState<InstalledAddon | null>(null);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    const directory = directoryFor(addonType);

    useEffect(() => {
        const firstLoader = metadata.loaders[addonType]?.[0]?.id ?? '';
        setLoader(firstLoader);
        setOffset(0);
        setStatus(null);
    }, [addonType, metadata.loaders]);

    useEffect(() => {
        if (!metadata.versions.some((version) => version.id === gameVersion)) {
            setGameVersion(metadata.versions[0]?.id ?? '');
        }
    }, [gameVersion, metadata.versions]);

    const loadInstalled = useCallback(async () => {
        if (!canRead) {
            setInstalled([]);
            return;
        }

        setInstalledLoading(true);

        try {
            const { data } = await http.get(`/api/client/servers/${serverIdentifier}/files/list`, {
                params: { directory },
            });

            const addons = (data.data ?? [])
                .map(({ attributes }: { attributes: Record<string, unknown> }): InstalledAddon => ({
                    name: String(attributes.name ?? ''),
                    size: Number(attributes.size ?? 0),
                    modifiedAt: attributes.modified_at ? String(attributes.modified_at) : null,
                    disabled: String(attributes.name ?? '')
                        .toLowerCase()
                        .endsWith('.jar.disabled'),
                }))
                .filter((addon: InstalledAddon) => {
                    const name = addon.name.toLowerCase();
                    return name.endsWith('.jar') || name.endsWith('.jar.disabled');
                })
                .sort((left: InstalledAddon, right: InstalledAddon) => left.name.localeCompare(right.name));

            setInstalled(addons);
            setDirectoryExists(true);
        } catch (error) {
            if (errorStatus(error) === 404) {
                setInstalled([]);
                setDirectoryExists(false);
            } else {
                setStatus({ tone: 'danger', text: httpErrorToHuman(error) });
            }
        } finally {
            setInstalledLoading(false);
        }
    }, [canRead, directory, serverIdentifier]);

    useEffect(() => {
        void loadInstalled();
    }, [loadInstalled]);

    useEffect(() => {
        if (!gameVersion || !loader || !availableLoaders.some((option) => option.id === loader)) {
            return;
        }

        let active = true;

        const search = async () => {
            setSearching(true);
            setSearchError('');

            try {
                const { data } = await http.get<SearchResponse>('/api/client/extensions/minehub/catalog/search', {
                    params: {
                        query: submittedQuery,
                        type: addonType,
                        version: gameVersion,
                        loader,
                        sort,
                        offset,
                    },
                });

                if (active) {
                    setProjects(data.data);
                    setSearchMeta(data.meta);
                }
            } catch (error) {
                if (active) {
                    setProjects([]);
                    setSearchError(httpErrorToHuman(error));
                }
            } finally {
                if (active) {
                    setSearching(false);
                }
            }
        };

        void search();

        return () => {
            active = false;
        };
    }, [addonType, availableLoaders, gameVersion, loader, offset, searchNonce, sort, submittedQuery]);

    const installedNames = useMemo(
        () => new Set(installed.map((addon) => addon.name.toLowerCase().replace(/\.disabled$/, ''))),
        [installed]
    );

    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        setOffset(0);
        setSubmittedQuery(query.trim());
        setSearchNonce((value) => value + 1);
    };

    const openVersions = async (project: CatalogProject) => {
        setSelectedProject(project);
        setVersions([]);
        setVersionsLoading(true);

        try {
            const { data } = await http.get<{ data: CatalogVersion[] }>(
                `/api/client/extensions/minehub/catalog/projects/${project.id}/versions`,
                { params: { type: addonType, version: gameVersion, loader } }
            );
            setVersions(data.data);
        } catch (error) {
            setSelectedProject(null);
            setStatus({ tone: 'danger', text: httpErrorToHuman(error) });
        } finally {
            setVersionsLoading(false);
        }
    };

    const install = async (version: CatalogVersion) => {
        setInstallingVersion(version.id);
        setStatus(null);

        try {
            if (!directoryExists || !canRead) {
                try {
                    await http.post(`/api/client/servers/${serverIdentifier}/files/create-folder`, {
                        root: '/',
                        name: directory.slice(1),
                    });
                } catch (error) {
                    if (![400, 409].includes(errorStatus(error) ?? 0)) {
                        throw error;
                    }
                }
                setDirectoryExists(true);
            }

            await http.post(`/api/client/servers/${serverIdentifier}/files/pull`, {
                url: version.file.url,
                directory,
                filename: version.file.filename,
                use_header: false,
                foreground: true,
            });

            setSelectedProject(null);
            setStatus({
                tone: 'success',
                text: `${version.file.filename} foi instalado em ${directory}. Reinicie o servidor para carregá-lo.`,
            });
            await loadInstalled();
        } catch (error) {
            setStatus({ tone: 'danger', text: httpErrorToHuman(error) });
        } finally {
            setInstallingVersion(null);
        }
    };

    const removeAddon = async () => {
        if (!deletingAddon) return;

        setActionInProgress(deletingAddon.name);

        try {
            await http.post(`/api/client/servers/${serverIdentifier}/files/delete`, {
                root: directory,
                files: [deletingAddon.name],
            });
            setStatus({
                tone: 'success',
                text: `${deletingAddon.name} foi removido.`,
            });
            setDeletingAddon(null);
            await loadInstalled();
        } catch (error) {
            setStatus({ tone: 'danger', text: httpErrorToHuman(error) });
        } finally {
            setActionInProgress(null);
        }
    };

    const toggleAddon = async (addon: InstalledAddon) => {
        const targetName = addon.disabled ? addon.name.replace(/\.disabled$/i, '') : `${addon.name}.disabled`;

        setActionInProgress(addon.name);

        try {
            await http.put(`/api/client/servers/${serverIdentifier}/files/rename`, {
                root: directory,
                files: [{ from: addon.name, to: targetName }],
            });
            setStatus({
                tone: 'success',
                text: `${addon.name} foi ${addon.disabled ? 'ativado' : 'desativado'}. Reinicie o servidor para aplicar.`,
            });
            await loadInstalled();
        } catch (error) {
            setStatus({ tone: 'danger', text: httpErrorToHuman(error) });
        } finally {
            setActionInProgress(null);
        }
    };

    const selectedLoaderName = availableLoaders.find((option) => option.id === loader)?.name ?? loader;

    return (
        <>
            <Panel>
                <PanelHeader>
                    <Heading>
                        <h2>Gerenciador de addons</h2>
                        <p>Instale pelo catálogo ou administre os arquivos já presentes no servidor.</p>
                    </Heading>
                    <Toolbar aria-label='Tipo de addon'>
                        {enabledTypes.map((type) => (
                            <Button
                                key={type}
                                type='button'
                                $variant={addonType === type ? 'primary' : 'secondary'}
                                onClick={() => onAddonTypeChange(type)}
                            >
                                {type === 'plugin' ? 'Plugins' : 'Mods'}
                            </Button>
                        ))}
                        <Button type='button' $variant='secondary' onClick={() => void loadInstalled()}>
                            Atualizar
                        </Button>
                    </Toolbar>
                </PanelHeader>

                <Filters as='form' onSubmit={submitSearch}>
                    <Field>
                        Pesquisar
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.currentTarget.value)}
                            placeholder={`Nome de um ${typeLabel(addonType)}...`}
                            maxLength={80}
                        />
                    </Field>
                    <Field>
                        Minecraft
                        <Select
                            value={gameVersion}
                            onChange={(event) => {
                                setGameVersion(event.currentTarget.value);
                                setOffset(0);
                            }}
                        >
                            {metadata.versions.map((version) => (
                                <option key={version.id} value={version.id}>
                                    {version.name}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field>
                        Loader
                        <Select
                            value={loader}
                            onChange={(event) => {
                                setLoader(event.currentTarget.value);
                                setOffset(0);
                            }}
                        >
                            {availableLoaders.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.name}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <Field>
                        Ordenar
                        <Select
                            value={sort}
                            onChange={(event) => {
                                setSort(event.currentTarget.value);
                                setOffset(0);
                            }}
                        >
                            <option value='relevance'>Relevância</option>
                            <option value='downloads'>Downloads</option>
                            <option value='updated'>Atualizados</option>
                            <option value='newest'>Mais novos</option>
                        </Select>
                    </Field>
                    <Button type='submit' disabled={searching || !gameVersion || !loader}>
                        {searching ? <Spinner /> : 'Buscar'}
                    </Button>
                </Filters>

                <Content>
                    {status ? <Notice $tone={status.tone}>{status.text}</Notice> : null}
                    {!canRead ? (
                        <Notice $tone='warning'>
                            Você não possui a permissão <code>file.read</code>. A lista de addons instalados não pode
                            ser exibida.
                        </Notice>
                    ) : null}
                    {!canCreate ? (
                        <Notice $tone='warning'>
                            Você precisa da permissão <code>file.create</code> para instalar addons pelo catálogo.
                        </Notice>
                    ) : null}

                    <SectionTitle>
                        <h3>Instalados em {directory}</h3>
                        <span>{installed.length} arquivo(s)</span>
                    </SectionTitle>

                    {installedLoading ? (
                        <LoadingState>
                            <Spinner aria-label='Carregando addons instalados' />
                        </LoadingState>
                    ) : installed.length === 0 ? (
                        <EmptyState>
                            <div>
                                <strong>Nenhum {typeLabel(addonType)} encontrado</strong>
                                <p>
                                    Escolha uma opção do catálogo abaixo. A pasta {directory} será criada
                                    automaticamente na primeira instalação.
                                </p>
                            </div>
                        </EmptyState>
                    ) : (
                        <CardGrid>
                            {installed.map((addon) => (
                                <Card key={addon.name}>
                                    <CardTop>
                                        <ProjectIcon>{addon.name.slice(0, 1).toUpperCase()}</ProjectIcon>
                                        <CardCopy>
                                            <h4 title={addon.name}>{addon.name}</h4>
                                            <small>
                                                {formatBytes(addon.size)}
                                                {addon.modifiedAt
                                                    ? ` · ${new Date(addon.modifiedAt).toLocaleDateString('pt-BR')}`
                                                    : ''}
                                            </small>
                                        </CardCopy>
                                        <Pill $warning={addon.disabled}>{addon.disabled ? 'Desativado' : 'Ativo'}</Pill>
                                    </CardTop>
                                    <Description>
                                        Arquivo local em {directory}. Alterações entram em vigor após reiniciar o
                                        servidor.
                                    </Description>
                                    <CardFooter>
                                        <Button
                                            type='button'
                                            $compact
                                            $variant='secondary'
                                            disabled={!canUpdate || actionInProgress === addon.name}
                                            onClick={() => void toggleAddon(addon)}
                                        >
                                            {addon.disabled ? 'Ativar' : 'Desativar'}
                                        </Button>
                                        <Button
                                            type='button'
                                            $compact
                                            $variant='danger'
                                            disabled={!canDelete || actionInProgress === addon.name}
                                            onClick={() => setDeletingAddon(addon)}
                                        >
                                            Remover
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </CardGrid>
                    )}

                    <Divider />

                    <SectionTitle>
                        <h3>
                            Catálogo para {gameVersion || 'Minecraft'} · {selectedLoaderName}
                        </h3>
                        <span>{searchMeta.total} resultado(s)</span>
                    </SectionTitle>

                    {searchError ? <Notice $tone='danger'>{searchError}</Notice> : null}
                    {searching ? (
                        <LoadingState>
                            <Spinner aria-label='Pesquisando catálogo' />
                        </LoadingState>
                    ) : projects.length === 0 ? (
                        <EmptyState>
                            <div>
                                <strong>Nenhum resultado compatível</strong>
                                <p>Tente outro termo, versão do Minecraft ou loader.</p>
                            </div>
                        </EmptyState>
                    ) : (
                        <CardGrid>
                            {projects.map((project) => (
                                <Card key={project.id}>
                                    <CardTop>
                                        <ProjectIcon $url={project.icon_url}>
                                            {project.title.slice(0, 1).toUpperCase()}
                                        </ProjectIcon>
                                        <CardCopy>
                                            <h4 title={project.title}>{project.title}</h4>
                                            <small>por {project.author}</small>
                                        </CardCopy>
                                    </CardTop>
                                    <Description>{project.description}</Description>
                                    <CardFooter>
                                        <Meta>{formatDownloads(project.downloads)} downloads</Meta>
                                        <Button
                                            type='button'
                                            $compact
                                            disabled={!canCreate}
                                            onClick={() => void openVersions(project)}
                                        >
                                            Instalar
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </CardGrid>
                    )}

                    {searchMeta.total > searchMeta.limit ? (
                        <Toolbar style={{ justifyContent: 'flex-end', marginTop: 15 }}>
                            <Button
                                type='button'
                                $variant='secondary'
                                disabled={offset === 0 || searching}
                                onClick={() => setOffset(Math.max(0, offset - searchMeta.limit))}
                            >
                                Anterior
                            </Button>
                            <Button
                                type='button'
                                $variant='secondary'
                                disabled={offset + searchMeta.limit >= searchMeta.total || searching}
                                onClick={() => setOffset(offset + searchMeta.limit)}
                            >
                                Próxima
                            </Button>
                        </Toolbar>
                    ) : null}
                </Content>
            </Panel>

            {selectedProject ? (
                <ModalBackdrop
                    role='dialog'
                    aria-modal='true'
                    aria-labelledby='minehub-version-title'
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !installingVersion) {
                            setSelectedProject(null);
                        }
                    }}
                >
                    <ModalCard>
                        <ModalHeader>
                            <div>
                                <h3 id='minehub-version-title'>Instalar {selectedProject.title}</h3>
                                <p>
                                    Escolha uma versão para Minecraft {gameVersion} com {selectedLoaderName}.
                                </p>
                            </div>
                            <Button
                                type='button'
                                $variant='ghost'
                                $compact
                                disabled={Boolean(installingVersion)}
                                onClick={() => setSelectedProject(null)}
                                aria-label='Fechar'
                            >
                                Fechar
                            </Button>
                        </ModalHeader>
                        <ModalBody>
                            {versionsLoading ? (
                                <LoadingState>
                                    <Spinner aria-label='Carregando versões' />
                                </LoadingState>
                            ) : versions.length === 0 ? (
                                <EmptyState>
                                    <div>
                                        <strong>Nenhum arquivo .jar disponível</strong>
                                        <p>Esse projeto não possui uma versão compatível com os filtros atuais.</p>
                                    </div>
                                </EmptyState>
                            ) : (
                                <VersionList>
                                    {versions.map((version) => (
                                        <VersionButton
                                            key={version.id}
                                            type='button'
                                            disabled={
                                                Boolean(installingVersion) ||
                                                installedNames.has(version.file.filename.toLowerCase())
                                            }
                                            onClick={() => void install(version)}
                                        >
                                            <span>
                                                <strong>{version.name}</strong>
                                                <small>
                                                    {version.version_number} · {formatBytes(version.file.size)} ·{' '}
                                                    {version.version_type}
                                                </small>
                                            </span>
                                            {installedNames.has(version.file.filename.toLowerCase()) ? (
                                                <Pill>Instalado</Pill>
                                            ) : installingVersion === version.id ? (
                                                <Spinner />
                                            ) : (
                                                <Pill>Selecionar</Pill>
                                            )}
                                        </VersionButton>
                                    ))}
                                </VersionList>
                            )}
                        </ModalBody>
                    </ModalCard>
                </ModalBackdrop>
            ) : null}

            {deletingAddon ? (
                <ModalBackdrop role='dialog' aria-modal='true' aria-labelledby='minehub-delete-title'>
                    <ModalCard style={{ maxWidth: 460 }}>
                        <ModalHeader>
                            <div>
                                <h3 id='minehub-delete-title'>Remover addon?</h3>
                                <p>Esta ação excluirá permanentemente o arquivo do servidor.</p>
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            <Notice $tone='warning'>{deletingAddon.name}</Notice>
                            <Toolbar style={{ justifyContent: 'flex-end' }}>
                                <Button
                                    type='button'
                                    $variant='secondary'
                                    disabled={Boolean(actionInProgress)}
                                    onClick={() => setDeletingAddon(null)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type='button'
                                    $variant='danger'
                                    disabled={Boolean(actionInProgress)}
                                    onClick={() => void removeAddon()}
                                >
                                    {actionInProgress ? <Spinner /> : 'Remover arquivo'}
                                </Button>
                            </Toolbar>
                        </ModalBody>
                    </ModalCard>
                </ModalBackdrop>
            ) : null}
        </>
    );
};

export default AddonsPanel;
