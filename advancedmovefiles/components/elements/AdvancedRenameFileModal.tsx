import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Modal, { RequiredModalProps } from '@/components/elements/Modal';
import { ServerContext } from '@/state/server';
import { join, dirname, relative, normalize } from 'pathe';
import renameFiles from '@/api/server/files/renameFiles';
import loadDirectory, { FileObject } from '@/api/server/files/loadDirectory';
import createDirectory from '@/api/server/files/createDirectory';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import useFlash from '@/plugins/useFlash';
import Spinner from '@/components/elements/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faFolder,
    faPlus,
    faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/elements/button/index';

type OwnProps = RequiredModalProps & {
    files: string[];
    useMoveTerminology?: boolean;
};

const normalizePath = (path: string): string => {
    const n = normalize(path || '/');
    return n === '.' || n === '' ? '/' : n;
};

const parentPath = (path: string): string => {
    const p = normalizePath(path);
    if (p === '/') return '/';
    const parent = dirname(p);
    return parent === '.' ? '/' : normalizePath(parent);
};

const displayPath = (path: string): string => {
    const p = normalizePath(path);
    return p === '/' ? '/home/container/' : `/home/container${p}/`;
};

const pathSegments = (path: string): { label: string; path: string }[] => {
    const p = normalizePath(path);
    if (p === '/') return [{ label: 'container', path: '/' }];
    const parts = p.split('/').filter(Boolean);
    const segments: { label: string; path: string }[] = [{ label: 'container', path: '/' }];
    let acc = '';
    for (const part of parts) {
        acc = join(acc, part);
        segments.push({ label: part, path: normalizePath(acc) });
    }
    return segments;
};

const AdvancedRenameFileModal = ({ files, useMoveTerminology, visible, onDismissed }: OwnProps) => {
    const uuid = ServerContext.useStoreState((s) => s.server.data!.uuid);
    const sourceDirectory = ServerContext.useStoreState((s) => s.files.directory);
    const { mutate } = useFileManagerSwr();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const setSelectedFiles = ServerContext.useStoreActions((a) => a.files.setSelectedFiles);

    const [browsePath, setBrowsePath] = useState('/');
    const [entries, setEntries] = useState<FileObject[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [fileName, setFileName] = useState('');
    const [newDirName, setNewDirName] = useState('');
    const [creatingDir, setCreatingDir] = useState(false);

    const isMove = !!useMoveTerminology;
    const count = files.length;

    useEffect(() => {
        if (!visible) return;
        setBrowsePath(normalizePath(sourceDirectory));
        setFileName(files.length === 1 ? files[0] : '');
        setNewDirName('');
    }, [visible, sourceDirectory, files]);

    const refreshEntries = useCallback(() => {
        if (!visible || !uuid) return;
        setLoading(true);
        loadDirectory(uuid, browsePath)
            .then((list) => {
                const moving = new Set(files);
                setEntries(
                    list.filter((f) => !f.isFile && !moving.has(f.name)),
                );
            })
            .catch((error) => clearAndAddHttpError({ key: 'files', error }))
            .finally(() => setLoading(false));
    }, [visible, uuid, browsePath, files, clearAndAddHttpError]);

    useEffect(() => {
        refreshEntries();
    }, [refreshEntries]);

    const destRelative = useMemo(() => {
        const rel = relative(normalizePath(sourceDirectory), normalizePath(browsePath));
        if (!rel || rel === '.') return '';
        return rel;
    }, [sourceDirectory, browsePath]);

    const previewPath = useMemo(() => {
        if (isMove) {
            if (count > 1) {
                return `${displayPath(browsePath)}${count} itens`;
            }
            return `${displayPath(browsePath)}${files[0] || ''}`;
        }
        const name = fileName || files[0] || '';
        return `${displayPath(browsePath)}${name}`;
    }, [isMove, count, browsePath, files, fileName]);

    const handleCreateDirectory = async () => {
        const name = newDirName.trim();
        if (!name || name.includes('/') || name.includes('\\')) return;
        setCreatingDir(true);
        clearFlashes('files');
        try {
            await createDirectory(uuid, browsePath, name);
            setNewDirName('');
            refreshEntries();
        } catch (error) {
            clearAndAddHttpError({ key: 'files', error });
        } finally {
            setCreatingDir(false);
        }
    };

    const buildOperations = (): { from: string; to: string }[] => {
        if (isMove) {
            if (count > 1) {
                const base = destRelative || '.';
                return files.map((f) => ({
                    from: f,
                    to: base === '.' ? f : join(base, f),
                }));
            }
            const dest = destRelative ? join(destRelative, files[0]) : files[0];
            return [{ from: files[0], to: dest }];
        }

        const name = fileName.trim();
        if (!name) return [];
        const to = destRelative ? join(destRelative, name) : name;
        return files.map((f) => ({ from: f, to }));
    };

    const handleSubmit = async () => {
        const ops = buildOperations();
        if (!ops.length || (!isMove && !fileName.trim())) return;

        setSubmitting(true);
        clearFlashes('files');

        if (files.length === 1) {
            const op = ops[0];
            const sameDirRename = !isMove && op.to.split('/').length === 1;
            if (sameDirRename) {
                mutate(
                    (data) => data.map((f) => (f.name === files[0] ? { ...f, name: op.to } : f)),
                    false,
                );
            } else {
                mutate((data) => data.filter((f) => f.name !== files[0]), false);
            }
        } else if (isMove) {
            mutate((data) => data.filter((f) => !files.includes(f.name)), false);
        }

        try {
            await renameFiles(uuid, sourceDirectory, ops);
            await mutate();
            setSelectedFiles([]);
            onDismissed();
        } catch (error) {
            await mutate();
            clearAndAddHttpError({ key: 'files', error });
        } finally {
            setSubmitting(false);
        }
    };

    const title = isMove
        ? `Mover ${count} ${count === 1 ? 'arquivo ou pasta' : 'arquivos ou pastas'}`
        : 'Renomear arquivo ou pasta';

    const canSubmit = isMove ? count > 0 : !!fileName.trim();

    return (
        <Modal visible={visible} onDismissed={onDismissed} showSpinnerOverlay={submitting}>
            <div className="amf-modal">
                <div className="amf-modal__header">
                    <h2 className="amf-modal__title">{title}</h2>
                    <button type="button" className="amf-modal__close" onClick={onDismissed} aria-label="Fechar">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className="amf-breadcrumb">
                    <FontAwesomeIcon icon={faFolder} className="amf-breadcrumb__icon" />
                    {pathSegments(browsePath).map((seg, i) => (
                        <React.Fragment key={seg.path}>
                            {i > 0 && <span className="amf-breadcrumb__sep">/</span>}
                            <button
                                type="button"
                                className="amf-breadcrumb__part"
                                onClick={() => setBrowsePath(seg.path)}
                            >
                                {seg.label}
                            </button>
                        </React.Fragment>
                    ))}
                </div>

                <div className="amf-toolbar">
                    <button
                        type="button"
                        className="amf-btn amf-btn--ghost"
                        disabled={browsePath === '/' || submitting}
                        onClick={() => setBrowsePath(parentPath(browsePath))}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Voltar
                    </button>
                    <div className="amf-newdir">
                        <input
                            type="text"
                            className="amf-input"
                            placeholder="Nova pasta"
                            value={newDirName}
                            disabled={submitting || creatingDir}
                            onChange={(e) => setNewDirName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateDirectory()}
                        />
                        <button
                            type="button"
                            className="amf-btn amf-btn--icon"
                            disabled={!newDirName.trim() || submitting || creatingDir}
                            onClick={handleCreateDirectory}
                            title="Criar pasta"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                        </button>
                    </div>
                </div>

                <div className="amf-list">
                    {loading ? (
                        <div className="amf-list__loading">
                            <Spinner size="small" />
                        </div>
                    ) : entries.length === 0 ? (
                        <p className="amf-list__empty">Nenhuma pasta neste diretório.</p>
                    ) : (
                        entries.map((entry) => (
                            <button
                                key={entry.key}
                                type="button"
                                className="amf-list__item"
                                disabled={submitting}
                                onClick={() => setBrowsePath(join(browsePath, entry.name))}
                            >
                                <FontAwesomeIcon icon={faFolder} className="amf-list__folder" />
                                <span>{entry.name}</span>
                                <span className="amf-list__arrow">›</span>
                            </button>
                        ))
                    )}
                </div>

                {isMove ? (
                    <p className="amf-preview">
                        → <strong>{count}</strong>{' '}
                        {count === 1 ? 'item será movido' : 'itens serão movidos'} para{' '}
                        <code>{displayPath(browsePath)}</code>
                    </p>
                ) : (
                    <div className="amf-rename">
                        <label className="amf-rename__label" htmlFor="amf-filename">
                            Nome do arquivo
                        </label>
                        <input
                            id="amf-filename"
                            type="text"
                            className="amf-input amf-input--full"
                            value={fileName}
                            disabled={submitting}
                            onChange={(e) => setFileName(e.target.value)}
                        />
                        <p className="amf-preview">
                            Destino: <code>{previewPath}</code>
                        </p>
                    </div>
                )}

                <div className="amf-actions">
                    <Button.Text onClick={onDismissed} disabled={submitting}>
                        Cancelar
                    </Button.Text>
                    <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
                        {isMove ? 'Mover' : 'Renomear'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AdvancedRenameFileModal;
