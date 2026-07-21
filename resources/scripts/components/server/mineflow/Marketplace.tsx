import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBoxOpen,
    faChevronLeft,
    faChevronRight,
    faCube,
    faDownload,
    faPuzzlePiece,
    faSearch,
} from '@fortawesome/free-solid-svg-icons';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import Select from '@/components/elements/Select';
import Spinner from '@/components/elements/Spinner';
import Can from '@/components/elements/Can';
import { Button } from '@/components/elements/button';
import { Dialog } from '@/components/elements/dialog';
import { httpErrorToHuman } from '@/api/http';
import {
    Badge,
    EmptyState,
    Panel,
    ProjectCard,
    ProjectGrid,
    ProjectIcon,
    ToolbarGrid,
} from './styles';
import { getProjectVersions, installAddon, searchCatalog } from './api';
import { AddonKind, CatalogIndex, CatalogProject, ProjectVersion } from './types';

interface Props {
    uuid: string;
    onInstalled: (message: string) => void;
    onError: (message: string) => void;
}

const pluginLoaders = ['paper', 'purpur', 'spigot', 'bukkit', 'folia', 'velocity', 'waterfall', 'bungeecord'];
const modLoaders = ['fabric', 'forge', 'neoforge', 'quilt'];
const commonVersions = ['1.21.8', '1.21.7', '1.21.6', '1.21.5', '1.21.4', '1.21.1', '1.20.6', '1.20.4', '1.20.1', '1.19.4', '1.19.2', '1.18.2'];

const formatCount = (value: number): string =>
    new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

const formatBytes = (value: number): string => {
    if (value < 1024) return `${value} B`;
    if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KiB`;
    return `${(value / 1024 ** 2).toFixed(1)} MiB`;
};

export default ({ uuid, onInstalled, onError }: Props) => {
    const [kind, setKind] = useState<AddonKind>('plugin');
    const [query, setQuery] = useState('');
    const [gameVersion, setGameVersion] = useState('');
    const [loader, setLoader] = useState('');
    const [index, setIndex] = useState<CatalogIndex>('relevance');
    const [page, setPage] = useState(0);
    const [projects, setProjects] = useState<CatalogProject[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<CatalogProject | null>(null);
    const [versions, setVersions] = useState<ProjectVersion[]>([]);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [installing, setInstalling] = useState<string | null>(null);
    const requestSequence = useRef(0);

    const loaders = kind === 'plugin' ? pluginLoaders : modLoaders;
    const pageCount = Math.max(1, Math.ceil(total / 20));

    useEffect(() => {
        setLoader('');
        setPage(0);
    }, [kind]);

    useEffect(() => {
        setPage(0);
    }, [query, gameVersion, loader, index]);

    useEffect(() => {
        const sequence = ++requestSequence.current;
        const timer = window.setTimeout(
            () => {
                setLoading(true);
                searchCatalog(uuid, { query, kind, gameVersion, loader, index, offset: page * 20 })
                    .then((response) => {
                        if (sequence !== requestSequence.current) return;
                        setProjects(response.hits);
                        setTotal(response.total_hits);
                    })
                    .catch((error) => {
                        if (sequence !== requestSequence.current) return;
                        setProjects([]);
                        setTotal(0);
                        onError(httpErrorToHuman(error));
                    })
                    .then(() => {
                        if (sequence === requestSequence.current) setLoading(false);
                    });
            },
            query ? 350 : 0
        );

        return () => window.clearTimeout(timer);
    }, [uuid, query, kind, gameVersion, loader, index, page, onError]);

    useEffect(() => {
        if (!selected) {
            setVersions([]);
            return;
        }

        setLoadingVersions(true);
        getProjectVersions(uuid, selected.project_id, gameVersion, loader)
            .then(setVersions)
            .catch((error) => onError(httpErrorToHuman(error)))
            .then(() => setLoadingVersions(false));
    }, [uuid, selected, gameVersion, loader, onError]);

    const versionOptions = useMemo(
        () => versions.filter((version) => version.files.length > 0).slice(0, 60),
        [versions]
    );

    const install = (version: ProjectVersion): void => {
        if (!selected) return;

        setInstalling(version.id);
        installAddon(uuid, kind, selected.project_id, version.id)
            .then((response) => {
                onInstalled(`${response.addon.name} foi instalado em ${response.addon.path}.`);
                setSelected(null);
            })
            .catch((error) => onError(httpErrorToHuman(error)))
            .then(() => setInstalling(null));
    };

    return (
        <>
            <Panel>
                <div className={'flex flex-col gap-4 mb-5 md:flex-row md:items-center md:justify-between'}>
                    <div>
                        <h2 className={'text-xl font-bold text-neutral-100'}>Catálogo de addons</h2>
                        <p className={'text-sm text-neutral-400 mt-1'}>
                            Resultados verificados do Modrinth. O arquivo é validado antes de chegar ao seu servidor.
                        </p>
                    </div>
                    <div className={'inline-flex rounded-lg border border-neutral-600 bg-neutral-800 p-1'}>
                        <button
                            type={'button'}
                            onClick={() => setKind('plugin')}
                            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                                kind === 'plugin' ? 'bg-indigo-600 text-white shadow' : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            <FontAwesomeIcon icon={faPuzzlePiece} className={'mr-2'} />
                            Plugins
                        </button>
                        <button
                            type={'button'}
                            onClick={() => setKind('mod')}
                            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                                kind === 'mod' ? 'bg-violet-600 text-white shadow' : 'text-neutral-400 hover:text-white'
                            }`}
                        >
                            <FontAwesomeIcon icon={faCube} className={'mr-2'} />
                            Mods
                        </button>
                    </div>
                </div>

                <ToolbarGrid>
                    <div>
                        <Label htmlFor={'mineflow-search'}>Buscar</Label>
                        <div className={'relative mt-1'}>
                            <FontAwesomeIcon
                                icon={faSearch}
                                className={'absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400'}
                            />
                            <Input
                                id={'mineflow-search'}
                                value={query}
                                onChange={(event) => setQuery(event.currentTarget.value)}
                                placeholder={`Buscar ${kind === 'plugin' ? 'plugins' : 'mods'}...`}
                                className={'pl-10'}
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor={'mineflow-version'}>Minecraft</Label>
                        <Select
                            id={'mineflow-version'}
                            value={gameVersion}
                            onChange={(event) => setGameVersion(event.currentTarget.value)}
                            className={'mt-1'}
                        >
                            <option value={''}>Todas as versões</option>
                            {commonVersions.map((version) => (
                                <option key={version} value={version}>
                                    {version}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor={'mineflow-loader'}>Loader</Label>
                        <Select
                            id={'mineflow-loader'}
                            value={loader}
                            onChange={(event) => setLoader(event.currentTarget.value)}
                            className={'mt-1'}
                        >
                            <option value={''}>Todos os loaders</option>
                            {loaders.map((name) => (
                                <option key={name} value={name}>
                                    {name.charAt(0).toUpperCase() + name.slice(1)}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor={'mineflow-order'}>Ordenar</Label>
                        <Select
                            id={'mineflow-order'}
                            value={index}
                            onChange={(event) => setIndex(event.currentTarget.value as CatalogIndex)}
                            className={'mt-1'}
                        >
                            <option value={'relevance'}>Relevância</option>
                            <option value={'downloads'}>Mais baixados</option>
                            <option value={'follows'}>Mais seguidos</option>
                            <option value={'newest'}>Mais novos</option>
                            <option value={'updated'}>Atualizados</option>
                        </Select>
                    </div>
                </ToolbarGrid>

                {loading ? (
                    <div className={'py-20'}>
                        <Spinner size={'large'} centered />
                    </div>
                ) : projects.length === 0 ? (
                    <EmptyState>
                        <FontAwesomeIcon icon={faBoxOpen} className={'text-4xl text-neutral-500 mb-4'} />
                        <h3 className={'text-lg font-semibold text-neutral-200'}>Nenhum addon encontrado</h3>
                        <p className={'text-sm text-neutral-400 mt-1'}>Tente remover um filtro ou usar outro termo.</p>
                    </EmptyState>
                ) : (
                    <>
                        <ProjectGrid>
                            {projects.map((project) => (
                                <ProjectCard key={project.project_id} type={'button'} onClick={() => setSelected(project)}>
                                    <div className={'flex gap-4'}>
                                        <ProjectIcon $url={project.icon_url}>
                                            {!project.icon_url && (
                                                <span className={'flex h-full items-center justify-center text-neutral-400'}>
                                                    <FontAwesomeIcon icon={kind === 'plugin' ? faPuzzlePiece : faCube} />
                                                </span>
                                            )}
                                        </ProjectIcon>
                                        <div className={'min-w-0 flex-1'}>
                                            <h3 className={'truncate font-bold text-neutral-100'}>{project.title}</h3>
                                            <p className={'truncate text-xs text-neutral-400 mt-0.5'}>por {project.author}</p>
                                        </div>
                                    </div>
                                    <p className={'mt-4 text-sm leading-5 text-neutral-300 line-clamp-3 min-h-[3.75rem]'}>
                                        {project.description}
                                    </p>
                                    <div className={'mt-4 flex items-center justify-between gap-3'}>
                                        <div className={'flex flex-wrap gap-1.5'}>
                                            {project.display_categories.slice(0, 2).map((category) => (
                                                <Badge key={category}>{category}</Badge>
                                            ))}
                                        </div>
                                        <span className={'whitespace-nowrap text-xs font-medium text-neutral-400'}>
                                            <FontAwesomeIcon icon={faDownload} className={'mr-1.5'} />
                                            {formatCount(project.downloads)}
                                        </span>
                                    </div>
                                </ProjectCard>
                            ))}
                        </ProjectGrid>

                        <div className={'mt-6 flex items-center justify-between'}>
                            <p className={'text-sm text-neutral-400'}>
                                {formatCount(total)} resultado{total === 1 ? '' : 's'}
                            </p>
                            <div className={'flex items-center gap-3'}>
                                <Button.Text
                                    size={Button.Sizes.Small}
                                    disabled={page === 0}
                                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </Button.Text>
                                <span className={'text-sm font-semibold text-neutral-300'}>
                                    {page + 1} / {pageCount}
                                </span>
                                <Button.Text
                                    size={Button.Sizes.Small}
                                    disabled={page + 1 >= pageCount}
                                    onClick={() => setPage((current) => current + 1)}
                                >
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </Button.Text>
                            </div>
                        </div>
                    </>
                )}
            </Panel>

            <Dialog
                open={selected !== null}
                onClose={() => setSelected(null)}
                title={selected ? `Instalar ${selected.title}` : 'Selecionar versão'}
                description={'Escolha uma versão compatível com o loader e o Minecraft do seu servidor.'}
            >
                <div className={'mt-5 max-h-[52vh] space-y-3 overflow-y-auto pr-1'}>
                    {loadingVersions ? (
                        <div className={'py-12'}>
                            <Spinner size={'large'} centered />
                        </div>
                    ) : versionOptions.length === 0 ? (
                        <EmptyState>
                            <FontAwesomeIcon icon={faBoxOpen} className={'text-3xl text-neutral-500 mb-3'} />
                            <p className={'font-semibold text-neutral-200'}>Nenhuma versão compatível</p>
                            <p className={'text-sm text-neutral-400 mt-1'}>Feche esta janela e ajuste os filtros.</p>
                        </EmptyState>
                    ) : (
                        versionOptions.map((version) => {
                            const file = version.files.find((candidate) => candidate.primary) || version.files[0];

                            return (
                                <div
                                    key={version.id}
                                    className={'flex flex-col gap-4 rounded-xl border border-neutral-700 bg-neutral-800/70 p-4 sm:flex-row sm:items-center'}
                                >
                                    <div className={'min-w-0 flex-1'}>
                                        <div className={'flex flex-wrap items-center gap-2'}>
                                            <h4 className={'font-bold text-neutral-100'}>
                                                {version.name || version.version_number}
                                            </h4>
                                            <Badge
                                                $tone={
                                                    version.version_type === 'release'
                                                        ? 'green'
                                                        : version.version_type === 'beta'
                                                        ? 'amber'
                                                        : 'neutral'
                                                }
                                            >
                                                {version.version_type}
                                            </Badge>
                                        </div>
                                        <p className={'mt-1 truncate text-xs text-neutral-400'}>
                                            {version.game_versions.slice(0, 5).join(', ') || 'Versão universal'}
                                            {' · '}
                                            {version.loaders.join(', ') || 'loader universal'}
                                            {file ? ` · ${formatBytes(file.size)}` : ''}
                                        </p>
                                    </div>
                                    <Can action={'file.create'}>
                                        <Button
                                            size={Button.Sizes.Small}
                                            disabled={installing !== null}
                                            onClick={() => install(version)}
                                        >
                                            <FontAwesomeIcon
                                                icon={faDownload}
                                                spin={installing === version.id}
                                                className={'mr-2'}
                                            />
                                            {installing === version.id ? 'Instalando...' : 'Instalar'}
                                        </Button>
                                    </Can>
                                </div>
                            );
                        })
                    )}
                </div>
            </Dialog>
        </>
    );
};
