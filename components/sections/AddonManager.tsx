import React, { useEffect, useMemo, useState } from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import { ToastProvider, useToasts } from '../elements/Toasts';
import ConfirmDialog from '../elements/ConfirmDialog';
import {
  Addon,
  AddonBranch,
  AddonCategory,
  CATEGORIES,
  BUILTIN_CATALOG,
} from '../lib/catalog';
import { deleteFiles, listDirectory, pullRemoteFile } from '../lib/api';

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);
const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

/** Inline copy of what `data.public` ships with. Kept here for reliability. */
const CATALOG = BUILTIN_CATALOG;

const BRANCH_LABEL: Record<AddonBranch, string> = {
  paper: 'Paper',
  spigot: 'Spigot',
  purpur: 'Purpur',
  forge: 'Forge',
  fabric: 'Fabric',
  neoforge: 'NeoForge',
};

const AddonManagerInner: React.FC = () => {
  const toasts = useToasts();

  const [installed, setInstalled] = useState<Set<string> | null>(null);
  const [installedNames, setInstalledNames] = useState<string[]>([]);
  const [folder, setFolder] = useState<'plugins' | 'mods'>('plugins');
  const [branch, setBranch] = useState<AddonBranch>('paper');
  const [category, setCategory] = useState<AddonCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<Record<string, 'installing' | 'removing'>>({});
  const [confirm, setConfirm] = useState<null | { addon: Addon; action: 'install' | 'remove' }>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scan = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listDirectory(`/${folder}`);
      const jars = items.filter((i) => i.is_file && i.name.toLowerCase().endsWith('.jar'));
      const names = jars.map((j) => j.name);
      setInstalledNames(names);
      const known = new Set<string>();
      for (const addon of CATALOG) {
        if (names.includes(addon.filename)) known.add(addon.id);
      }
      setInstalled(known);
    } catch (e) {
      setInstalled(new Set());
      setInstalledNames([]);
      setError(e instanceof Error ? e.message : 'Could not scan the addon folder');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void scan(); }, [folder]);

  const install = async (addon: Addon) => {
    setBusy((b) => ({ ...b, [addon.id]: 'installing' }));
    try {
      await pullRemoteFile(addon.url, `/${folder}`, addon.filename);
      toasts.push({
        kind: 'success',
        title: `Installing ${addon.name}`,
        hint: `Downloading into /${folder} — restart the server when done`,
      });
      // Optimistic UI update; a scan follows soon.
      setInstalled((prev) => new Set(prev ? [...prev, addon.id] : [addon.id]));
      window.setTimeout(scan, 3000);
    } catch (e) {
      toasts.push({
        kind: 'error',
        title: `Failed to install ${addon.name}`,
        hint: e instanceof Error ? e.message : 'Unknown error',
      });
    } finally {
      setBusy(({ [addon.id]: _, ...rest }) => rest);
    }
  };

  const remove = async (addon: Addon) => {
    setBusy((b) => ({ ...b, [addon.id]: 'removing' }));
    try {
      await deleteFiles(`/${folder}`, [addon.filename]);
      toasts.push({ kind: 'success', title: `Removed ${addon.name}` });
      setInstalled((prev) => {
        if (!prev) return prev;
        const next = new Set(prev);
        next.delete(addon.id);
        return next;
      });
      window.setTimeout(scan, 500);
    } catch (e) {
      toasts.push({
        kind: 'error',
        title: `Failed to remove ${addon.name}`,
        hint: e instanceof Error ? e.message : 'Unknown error',
      });
    } finally {
      setBusy(({ [addon.id]: _, ...rest }) => rest);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter((a) => {
      if (!a.branches.includes(branch)) return false;
      if (category !== 'all' && a.category !== category) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        (a.author ?? '').toLowerCase().includes(q)
      );
    });
  }, [query, branch, category]);

  const activeCount = installed?.size ?? 0;

  const startAction = (addon: Addon, action: 'install' | 'remove') => {
    // The extension always confirms uninstalls; installs are one-click.
    if (action === 'remove') setConfirm({ addon, action });
    else void install(addon);
  };

  return (
    <PageContentBlock title={'MC Hub — Addon manager'}>
      <div className="mchub-page">

        {/* Hero */}
        <section className="mchub-hero">
          <span className="mchub-hero-badge">
            <span className="mchub-hero-dot" /> Auto-installer
          </span>
          <h1 className="mchub-hero-title">Addon manager</h1>
          <p className="mchub-hero-sub">
            Browse a curated catalog of Minecraft plugins &amp; mods and install
            them straight into your server with a single click. Pick a branch,
            filter by category, remove what you no longer need.
          </p>
        </section>

        {/* Toolbar */}
        <section className="mchub-card mchub-mb-4">
          <div className="mchub-flex mchub-between mchub-gap-3" style={{ flexWrap: 'wrap' }}>
            <div className="mchub-search" style={{ flex: 1, minWidth: 260, marginBottom: 0 }}>
              <IconSearch />
              <input
                className="mchub-input"
                placeholder="Search addons, plugins, mods…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="mchub-flex mchub-gap-2">
              <div>
                <label className="mchub-muted" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                  Branch
                </label>
                <select className="mchub-select" value={branch} onChange={(e) => {
                  const b = e.target.value as AddonBranch;
                  setBranch(b);
                  // Auto-switch target folder to match branch loader.
                  const isMod = ['forge', 'fabric', 'neoforge'].includes(b);
                  setFolder(isMod ? 'mods' : 'plugins');
                }}>
                  {(Object.keys(BRANCH_LABEL) as AddonBranch[]).map((b) => (
                    <option key={b} value={b}>{BRANCH_LABEL[b]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mchub-muted" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                  Install folder
                </label>
                <select className="mchub-select" value={folder} onChange={(e) => setFolder(e.target.value as 'plugins' | 'mods')}>
                  <option value="plugins">/plugins</option>
                  <option value="mods">/mods</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mchub-tabs mchub-mt-4">
            <button
              className={`mchub-tab ${category === 'all' ? 'active' : ''}`}
              onClick={() => setCategory('all')}
              type="button"
            >
              All ({filtered.length})
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                className={`mchub-tab ${category === c.id ? 'active' : ''}`}
                onClick={() => setCategory(c.id)}
                type="button"
                title={c.hint}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="mchub-status-line mchub-mt-4">
            {loading ? (
              <><Spinner size={'small'} /> Scanning /{folder}…</>
            ) : error ? (
              <span className="mchub-text-danger">Could not scan /{folder}: {error}</span>
            ) : (
              <>
                <span>
                  <strong style={{ color: '#f8fafc' }}>{activeCount}</strong> catalog addon{activeCount === 1 ? '' : 's'} detected in <span className="mchub-mono">/{folder}</span> — {installedNames.length} total .jar files
                </span>
                <button className="mchub-btn ghost" style={{ padding: '4px 10px' }} onClick={scan} type="button">
                  Rescan
                </button>
              </>
            )}
          </div>
        </section>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="mchub-empty">
            <h4>No matching addons</h4>
            <p>Try a different search, branch, or category.</p>
          </div>
        ) : (
          <section className="mchub-addon-grid">
            {filtered.map((addon) => {
              const on = installed?.has(addon.id) ?? false;
              const state = busy[addon.id];
              return (
                <div className="mchub-addon" key={addon.id}>
                  <div className="mchub-addon-head">
                    <span className="mchub-addon-icon">{initials(addon.name)}</span>
                    <div>
                      <h3 className="mchub-addon-title">{addon.name}</h3>
                      <div className="mchub-addon-meta">
                        {addon.author ? <>by {addon.author}</> : null}
                      </div>
                    </div>
                  </div>
                  <p className="mchub-addon-desc">{addon.description}</p>
                  <div className="mchub-addon-tags">
                    {addon.branches.map((b) => (
                      <span key={b} className={`mchub-addon-tag ${b === branch ? 'branch' : ''}`}>
                        {BRANCH_LABEL[b]}
                      </span>
                    ))}
                    <span className="mchub-addon-tag">
                      {CATEGORIES.find(c => c.id === addon.category)?.label ?? addon.category}
                    </span>
                  </div>
                  <div className="mchub-addon-actions">
                    {on ? (
                      <button
                        type="button"
                        className="mchub-btn danger"
                        onClick={() => startAction(addon, 'remove')}
                        disabled={!!state}
                      >
                        {state === 'removing' ? 'Removing…' : (<><IconTrash /> Uninstall</>)}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="mchub-btn primary"
                        onClick={() => startAction(addon, 'install')}
                        disabled={!!state}
                      >
                        {state === 'installing' ? 'Installing…' : (<><IconDownload /> Install</>)}
                      </button>
                    )}
                    {addon.website ? (
                      <a className="mchub-btn ghost" href={addon.website} target="_blank" rel="noreferrer noopener">
                        Info
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.action === 'remove' ? `Remove ${confirm?.addon.name}?` : 'Install addon'}
        message={
          confirm?.action === 'remove'
            ? <>Deleting <span className="mchub-mono">{confirm?.addon.filename}</span> from <span className="mchub-mono">/{folder}</span>. You can reinstall it later.</>
            : <>Downloading and installing <strong>{confirm?.addon.name}</strong> into <span className="mchub-mono">/{folder}</span>.</>
        }
        confirmLabel={confirm?.action === 'remove' ? 'Remove' : 'Install'}
        danger={confirm?.action === 'remove'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const c = confirm;
          setConfirm(null);
          if (!c) return;
          if (c.action === 'remove') void remove(c.addon);
          else void install(c.addon);
        }}
      />
    </PageContentBlock>
  );
};

function initials(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9 ]+/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

const AddonManager: React.FC = () => (
  <ToastProvider>
    <AddonManagerInner />
  </ToastProvider>
);

export default AddonManager;
