import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  formatBytes,
  getModrinthVersions,
  installPlugin,
  listPlugins,
  removePlugins,
  searchModrinth,
  togglePlugin,
  type PluginEntry,
} from '../services/api';

type Props = {
  serverUuid: string;
};

type Hit = {
  project_id: string;
  title: string;
  description: string;
  author?: string;
  downloads?: number;
  icon_url?: string;
  categories?: string[];
  slug?: string;
};

type VersionFile = {
  url: string;
  filename: string;
  primary?: boolean;
  size?: number;
};

type Version = {
  id: string;
  name: string;
  version_number?: string;
  version_type?: string;
  date_published?: string;
  downloads?: number;
  files?: VersionFile[];
  game_versions?: string[];
  loaders?: string[];
};

const LOADERS = ['paper', 'purpur', 'spigot', 'bukkit', 'folia', 'fabric', 'forge', 'neoforge', 'quilt'];

const Toast = ({
  message,
  kind,
  onClose,
}: {
  message: string;
  kind: 'ok' | 'error';
  onClose: () => void;
}) => {
  useEffect(() => {
    const t = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`mc-toast is-${kind}`} role="status">
      {message}
    </div>
  );
};

export default ({ serverUuid }: Props) => {
  const [directory, setDirectory] = useState<'plugins' | 'mods'>('plugins');
  const [installed, setInstalled] = useState<PluginEntry[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loadingInstalled, setLoadingInstalled] = useState(true);

  const [query, setQuery] = useState('');
  const [loader, setLoader] = useState('paper');
  const [sort, setSort] = useState('relevance');
  const [hits, setHits] = useState<Hit[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [searching, setSearching] = useState(false);

  const [activeHit, setActiveHit] = useState<Hit | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; kind: 'ok' | 'error' } | null>(null);

  const selectedFiles = useMemo(
    () => Object.keys(selected).filter((k) => selected[k]),
    [selected]
  );

  const notify = useCallback((message: string, kind: 'ok' | 'error' = 'ok') => {
    setToast({ message, kind });
  }, []);

  const refreshInstalled = useCallback(async () => {
    setLoadingInstalled(true);
    try {
      const res = await listPlugins(serverUuid, directory);
      setInstalled(res.plugins || []);
      setSelected({});
    } catch (e: any) {
      notify(e?.response?.data?.message || 'Failed to list installed addons.', 'error');
      setInstalled([]);
    } finally {
      setLoadingInstalled(false);
    }
  }, [serverUuid, directory, notify]);

  useEffect(() => {
    refreshInstalled();
  }, [refreshInstalled]);

  const runSearch = useCallback(
    async (nextOffset = 0) => {
      setSearching(true);
      try {
        const facets: string[][] = [['project_type:plugin']];
        if (directory === 'mods') {
          facets[0] = ['project_type:mod'];
        }
        if (loader) {
          facets.push([`categories:${loader}`]);
        }

        const res = await searchModrinth({
          query,
          offset: nextOffset,
          limit: 12,
          index: sort,
          facets: JSON.stringify(facets),
        });

        if (!res.success) {
          notify(res.message || 'Search failed.', 'error');
          setHits([]);
          setTotal(0);
          return;
        }

        const payload = res.data || {};
        setHits(payload.hits || []);
        setTotal(payload.total_hits || 0);
        setOffset(nextOffset);
      } catch (e: any) {
        notify(e?.response?.data?.message || 'Search request failed.', 'error');
      } finally {
        setSearching(false);
      }
    },
    [query, loader, sort, directory, notify]
  );

  useEffect(() => {
    const t = window.setTimeout(() => runSearch(0), 350);
    return () => window.clearTimeout(t);
  }, [runSearch]);

  const openVersions = async (hit: Hit) => {
    setActiveHit(hit);
    setLoadingVersions(true);
    setVersions([]);
    try {
      const res = await getModrinthVersions(hit.project_id);
      if (!res.success) {
        notify(res.message || 'Could not load versions.', 'error');
        return;
      }
      setVersions(res.versions || []);
    } catch (e: any) {
      notify(e?.response?.data?.message || 'Could not load versions.', 'error');
    } finally {
      setLoadingVersions(false);
    }
  };

  const doInstall = async (version: Version, file: VersionFile) => {
    setInstalling(version.id);
    try {
      const res = await installPlugin({
        serverUuid,
        downloadUrl: file.url,
        filename: file.filename,
        directory,
      });
      if (!res.success) {
        notify(res.message || 'Install failed.', 'error');
        return;
      }
      notify(`Installed ${file.filename}`);
      await refreshInstalled();
    } catch (e: any) {
      notify(e?.response?.data?.message || 'Install failed.', 'error');
    } finally {
      setInstalling(null);
    }
  };

  const doRemoveSelected = async () => {
    if (!selectedFiles.length) return;
    if (!window.confirm(`Remove ${selectedFiles.length} selected addon(s)?`)) return;

    setBusy(true);
    try {
      const res = await removePlugins({
        serverUuid,
        files: selectedFiles,
        directory,
      });
      if (!res.success) {
        notify(res.message || 'Remove failed.', 'error');
        return;
      }
      notify(`Removed ${res.removed?.length || selectedFiles.length} addon(s)`);
      await refreshInstalled();
    } catch (e: any) {
      notify(e?.response?.data?.message || 'Remove failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const doToggle = async (plugin: PluginEntry) => {
    setBusy(true);
    try {
      const res = await togglePlugin({
        serverUuid,
        filename: plugin.name,
        enable: !plugin.enabled,
        directory,
      });
      if (!res.success) {
        notify(res.message || 'Toggle failed.', 'error');
        return;
      }
      notify(plugin.enabled ? `Disabled ${plugin.name}` : `Enabled ${plugin.name}`);
      await refreshInstalled();
    } catch (e: any) {
      notify(e?.response?.data?.message || 'Toggle failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const allSelected = installed.length > 0 && selectedFiles.length === installed.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelected({});
      return;
    }
    const next: Record<string, boolean> = {};
    installed.forEach((p) => {
      next[p.name] = true;
    });
    setSelected(next);
  };

  const filteredVersions = useMemo(() => {
    return versions.filter((v) => {
      if (loader && v.loaders && v.loaders.length && !v.loaders.includes(loader)) {
        return false;
      }
      return true;
    });
  }, [versions, loader]);

  return (
    <>
      <section className="mc-panel">
        <div className="mc-toolbar">
          <div className="mc-search">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={directory === 'mods' ? 'Search Modrinth mods…' : 'Search Modrinth plugins…'}
            />
          </div>
          <select className="mc-select" value={directory} onChange={(e) => setDirectory(e.target.value as any)}>
            <option value="plugins">plugins/</option>
            <option value="mods">mods/</option>
          </select>
          <select className="mc-select" value={loader} onChange={(e) => setLoader(e.target.value)}>
            <option value="">Any loader</option>
            {LOADERS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <select className="mc-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="relevance">Relevance</option>
            <option value="downloads">Downloads</option>
            <option value="follows">Popularity</option>
            <option value="newest">Newest</option>
            <option value="updated">Updated</option>
          </select>
        </div>

        <div className="mc-statline">
          <span>
            Results: <strong>{total}</strong>
          </span>
          <span>
            Target: <strong>/{directory}</strong>
          </span>
          <span>Source: Modrinth</span>
        </div>

        {searching ? (
          <div className="mc-spinner" />
        ) : hits.length === 0 ? (
          <div className="mc-empty">
            <strong>No addons found</strong>
            Try another search term or loader filter.
          </div>
        ) : (
          <div className="mc-grid">
            {hits.map((hit) => (
              <article key={hit.project_id} className="mc-card">
                <div className="mc-card-head">
                  <img
                    className="mc-card-icon"
                    src={hit.icon_url || ''}
                    alt=""
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.visibility = 'hidden';
                    }}
                  />
                  <div>
                    <h3>{hit.title}</h3>
                    <div className="mc-meta">
                      {(hit.downloads || 0).toLocaleString()} downloads
                      {hit.author ? ` · ${hit.author}` : ''}
                    </div>
                  </div>
                </div>
                <p>{hit.description || 'No description provided.'}</p>
                <div className="mc-chip-row">
                  {(hit.categories || []).slice(0, 3).map((c) => (
                    <span key={c} className="mc-chip">
                      {c}
                    </span>
                  ))}
                </div>
                <button type="button" className="mc-btn mc-btn-primary" onClick={() => openVersions(hit)}>
                  Select version
                </button>
              </article>
            ))}
          </div>
        )}

        <div className="mc-toolbar" style={{ marginTop: '1rem', marginBottom: 0 }}>
          <button
            type="button"
            className="mc-btn mc-btn-ghost"
            disabled={offset <= 0 || searching}
            onClick={() => runSearch(Math.max(0, offset - 12))}
          >
            Previous
          </button>
          <span className="mc-meta" style={{ color: 'var(--mc-muted)' }}>
            Page {Math.floor(offset / 12) + 1}
          </span>
          <button
            type="button"
            className="mc-btn mc-btn-ghost"
            disabled={offset + 12 >= total || searching}
            onClick={() => runSearch(offset + 12)}
          >
            Next
          </button>
        </div>
      </section>

      <section className="mc-panel">
        <div className="mc-toolbar">
          <div>
            <strong style={{ color: '#fff', fontSize: '1rem' }}>Installed in /{directory}</strong>
            <div className="mc-meta" style={{ color: 'var(--mc-muted)', marginTop: 2 }}>
              Multi-select to remove, or toggle enable/disable without deleting.
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="mc-btn mc-btn-ghost" onClick={refreshInstalled} disabled={loadingInstalled}>
              Refresh
            </button>
            <button
              type="button"
              className="mc-btn mc-btn-danger"
              disabled={!selectedFiles.length || busy}
              onClick={doRemoveSelected}
            >
              Remove selected ({selectedFiles.length})
            </button>
          </div>
        </div>

        {loadingInstalled ? (
          <div className="mc-spinner" />
        ) : installed.length === 0 ? (
          <div className="mc-empty">
            <strong>No jars installed yet</strong>
            Search above and install your first addon.
          </div>
        ) : (
          <div className="mc-table-wrap">
            <table className="mc-table">
              <thead>
                <tr>
                  <th style={{ width: 42 }}>
                    <input className="mc-check" type="checkbox" checked={allSelected} onChange={toggleAll} />
                  </th>
                  <th>File</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th style={{ width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {installed.map((plugin) => (
                  <tr key={plugin.name} className={selected[plugin.name] ? 'is-selected' : ''}>
                    <td>
                      <input
                        className="mc-check"
                        type="checkbox"
                        checked={!!selected[plugin.name]}
                        onChange={(e) =>
                          setSelected((prev) => ({
                            ...prev,
                            [plugin.name]: e.target.checked,
                          }))
                        }
                      />
                    </td>
                    <td>
                      <strong style={{ color: '#fff' }}>{plugin.name}</strong>
                    </td>
                    <td>{formatBytes(plugin.size)}</td>
                    <td>
                      <span className={`mc-badge ${plugin.enabled ? 'mc-badge-on' : 'mc-badge-off'}`}>
                        {plugin.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="mc-btn mc-btn-ghost"
                        disabled={busy}
                        onClick={() => doToggle(plugin)}
                      >
                        {plugin.enabled ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {activeHit && (
        <div className="mc-modal-backdrop" onClick={() => setActiveHit(null)}>
          <div className="mc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mc-modal-head">
              <div>
                <h2>{activeHit.title}</h2>
                <p>Choose a version to install into /{directory}</p>
              </div>
              <button type="button" className="mc-btn mc-btn-ghost" onClick={() => setActiveHit(null)}>
                Close
              </button>
            </div>
            <div className="mc-modal-body">
              {loadingVersions ? (
                <div className="mc-spinner" />
              ) : filteredVersions.length === 0 ? (
                <div className="mc-empty">
                  <strong>No matching versions</strong>
                  Try clearing the loader filter.
                </div>
              ) : (
                filteredVersions.map((version) => {
                  const file = (version.files || []).find((f) => f.primary) || (version.files || [])[0];
                  if (!file) return null;
                  return (
                    <div className="mc-version" key={version.id}>
                      <div>
                        <strong style={{ color: '#fff' }}>
                          {version.name || version.version_number || version.id}
                        </strong>
                        <div className="mc-meta" style={{ color: 'var(--mc-muted)', marginTop: 4 }}>
                          {(version.version_type || 'release').toUpperCase()}
                          {version.game_versions?.length ? ` · MC ${version.game_versions.slice(0, 4).join(', ')}` : ''}
                          {version.loaders?.length ? ` · ${version.loaders.slice(0, 3).join(', ')}` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="mc-btn mc-btn-primary"
                        disabled={installing === version.id}
                        onClick={() => doInstall(version, file)}
                      >
                        {installing === version.id ? 'Installing…' : 'Install'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} kind={toast.kind} onClose={() => setToast(null)} />}
    </>
  );
};
