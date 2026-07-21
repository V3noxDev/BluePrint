import React, { useEffect, useMemo, useState } from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import { ToastProvider, useToasts } from '../elements/Toasts';
import {
  PROPERTY_SCHEMA,
  PropertyDef,
  GROUP_LABEL,
  parseProperties,
  serializeProperties,
  toMap,
  applyMap,
  PropertyLine,
} from '../lib/properties';
import { readFile, writeFile } from '../lib/api';

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PROPERTIES_FILE = '/server.properties';
const BACKUP_FILE = '/server.properties.mchub.bak';

const EditorInner: React.FC = () => {
  const toasts = useToasts();
  const [lines, setLines] = useState<PropertyLine[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [original, setOriginal] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<'all' | PropertyDef['group']>('all');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await readFile(PROPERTIES_FILE);
      const parsed = parseProperties(raw);
      const map = toMap(parsed);
      setLines(parsed);
      setValues(map);
      setOriginal(map);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load server.properties';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const dirty = useMemo(() => {
    for (const [k, v] of Object.entries(values)) if (original[k] !== v) return true;
    for (const k of Object.keys(original)) if (!(k in values)) return true;
    return false;
  }, [values, original]);

  const setValue = (key: string, value: string) => setValues(v => ({ ...v, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      // Best-effort backup of the previous content.
      try {
        await writeFile(BACKUP_FILE, serializeProperties(lines));
      } catch { /* backup is optional */ }

      const patched = applyMap(lines, values);
      const out = serializeProperties(patched);
      await writeFile(PROPERTIES_FILE, out);
      setLines(patched);
      setOriginal(values);
      toasts.push({ kind: 'success', title: 'Saved server.properties', hint: 'Restart the server for changes to take effect' });
    } catch (e) {
      toasts.push({ kind: 'error', title: 'Save failed', hint: e instanceof Error ? e.message : 'Unknown error' });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setValues(original);
    toasts.push({ kind: 'info', title: 'Discarded changes' });
  };

  // Build a merged schema so unknown keys still get an entry.
  const mergedSchema: PropertyDef[] = useMemo(() => {
    const known = new Set(PROPERTY_SCHEMA.map(p => p.key));
    const extras: PropertyDef[] = Object.keys(values)
      .filter(k => !known.has(k))
      .map(k => ({ key: k, label: k, group: 'misc' as const, type: { kind: 'string' as const } }));
    return [...PROPERTY_SCHEMA, ...extras];
  }, [values]);

  // Filter and group
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = mergedSchema.filter(p => {
      if (group !== 'all' && p.group !== group) return false;
      if (!q) return true;
      return (
        p.key.toLowerCase().includes(q) ||
        p.label.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
      );
    });
    const out = new Map<PropertyDef['group'], PropertyDef[]>();
    for (const p of filtered) {
      if (!out.has(p.group)) out.set(p.group, []);
      out.get(p.group)!.push(p);
    }
    return out;
  }, [mergedSchema, query, group]);

  return (
    <PageContentBlock title={'MC Hub — server.properties'}>
      <div className="mchub-page">

        {/* Hero */}
        <section className="mchub-hero">
          <span className="mchub-hero-badge">
            <span className="mchub-hero-dot" /> Editor
          </span>
          <h1 className="mchub-hero-title">Server properties</h1>
          <p className="mchub-hero-sub">
            Every setting from <span className="mchub-mono">server.properties</span> as
            a typed input, with descriptions and validation. Changes are saved
            straight to the file — a safety backup is written alongside it.
          </p>
        </section>

        {/* Toolbar */}
        <section className="mchub-card mchub-mb-4">
          <div className="mchub-flex mchub-between mchub-gap-3" style={{ flexWrap: 'wrap' }}>
            <div className="mchub-search" style={{ flex: 1, minWidth: 260, marginBottom: 0 }}>
              <IconSearch />
              <input
                className="mchub-input"
                placeholder="Search properties…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="mchub-flex mchub-gap-2">
              <button className="mchub-btn ghost" onClick={reset} disabled={!dirty || saving} type="button">
                Discard
              </button>
              <button className="mchub-btn primary" onClick={save} disabled={!dirty || saving || loading} type="button">
                {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
              </button>
            </div>
          </div>

          <div className="mchub-tabs mchub-mt-4">
            <button className={`mchub-tab ${group === 'all' ? 'active' : ''}`} onClick={() => setGroup('all')} type="button">
              All
            </button>
            {(Object.keys(GROUP_LABEL) as PropertyDef['group'][]).map((g) => (
              <button
                key={g}
                className={`mchub-tab ${group === g ? 'active' : ''}`}
                onClick={() => setGroup(g)}
                type="button"
              >
                {GROUP_LABEL[g]}
              </button>
            ))}
          </div>
        </section>

        {/* Body */}
        {loading ? (
          <div className="mchub-empty">
            <Spinner size={'large'} />
            <h4>Loading server.properties…</h4>
            <p>Reading from your Wings daemon.</p>
          </div>
        ) : error ? (
          <div className="mchub-empty">
            <h4 className="mchub-text-danger">Could not load server.properties</h4>
            <p>{error}</p>
            <button className="mchub-btn primary mchub-mt-4" onClick={load} type="button">Retry</button>
          </div>
        ) : groups.size === 0 ? (
          <div className="mchub-empty">
            <h4>No properties match your filter</h4>
            <p>Try a different search or category.</p>
          </div>
        ) : (
          Array.from(groups.entries()).map(([g, defs]) => (
            <div key={g} className="mchub-property-group">
              <div className="mchub-property-group-head">
                <h3>{GROUP_LABEL[g]}</h3>
                <span className="mchub-count">{defs.length}</span>
              </div>
              <div>
                {defs.map((def) => (
                  <PropertyRow
                    key={def.key}
                    def={def}
                    value={values[def.key] ?? def.default ?? ''}
                    onChange={(v) => setValue(def.key, v)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </PageContentBlock>
  );
};

const PropertyRow: React.FC<{
  def: PropertyDef;
  value: string;
  onChange: (v: string) => void;
}> = ({ def, value, onChange }) => {
  let control: React.ReactNode;
  if (def.type.kind === 'boolean') {
    const on = value === 'true';
    control = (
      <label className="mchub-toggle">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
        />
        <span className="mchub-slider" />
      </label>
    );
  } else if (def.type.kind === 'int') {
    control = (
      <input
        type="number"
        min={def.type.min}
        max={def.type.max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  } else if (def.type.kind === 'enum') {
    control = (
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {def.type.options.map((opt) => (
          <option value={opt} key={opt}>{opt}</option>
        ))}
        {def.type.options.includes(value) ? null : <option value={value}>{value || '—'}</option>}
      </select>
    );
  } else {
    control = (
      <input
        type="text"
        placeholder={def.type.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <div className="mchub-property-row">
      <div className="mchub-property-label">
        <span className="key">{def.key}</span>
        <span className="desc">{def.description ?? def.label}</span>
      </div>
      <div className="mchub-property-value">{control}</div>
    </div>
  );
};

const PropertiesEditor: React.FC = () => (
  <ToastProvider>
    <EditorInner />
  </ToastProvider>
);

export default PropertiesEditor;
