import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  backupProperties,
  getProperties,
  restoreProperties,
  saveProperties,
  type PropertyField,
  type PropertyGroup,
} from '../services/api';

type Props = {
  serverUuid: string;
};

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

function coerceDisplay(field: PropertyField, value: string) {
  if (field.type === 'boolean') {
    return value === 'true' || value === '1';
  }
  return value;
}

export default ({ serverUuid }: Props) => {
  const [groups, setGroups] = useState<PropertyGroup[]>([]);
  const [fields, setFields] = useState<PropertyField[]>([]);
  const [extras, setExtras] = useState<{ key: string; value: string }[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeGroup, setActiveGroup] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [missing, setMissing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; kind: 'ok' | 'error' } | null>(null);
  const [showRawExtras, setShowRawExtras] = useState(false);

  const notify = useCallback((text: string, kind: 'ok' | 'error' = 'ok') => {
    setToast({ message: text, kind });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setMissing(false);
    setMessage(null);
    try {
      const res = await getProperties(serverUuid);
      if (!res.success || !res.exists) {
        setMissing(true);
        setMessage(res.message || 'server.properties was not found.');
        setGroups([]);
        setFields([]);
        setValues({});
        return;
      }

      setGroups(res.groups || []);
      setFields(res.fields || []);
      setExtras(res.extras || []);

      const next: Record<string, string> = {};
      (res.fields || []).forEach((f) => {
        next[f.key] = f.value ?? '';
      });
      setValues(next);
      setDirty(false);
      if (res.groups?.length) {
        setActiveGroup(res.groups[0].id);
      }
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 404) {
        setMissing(true);
        setMessage(e?.response?.data?.message || 'server.properties not found.');
      } else {
        notify(e?.response?.data?.message || 'Failed to load properties.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [serverUuid, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleFields = useMemo(
    () => fields.filter((f) => f.group === activeGroup),
    [fields, activeGroup]
  );

  const setValue = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const payloadValues: Record<string, string | boolean | number> = {};
      fields.forEach((field) => {
        const raw = values[field.key] ?? '';
        if (field.type === 'boolean') {
          payloadValues[field.key] = raw === 'true';
        } else if (field.type === 'number') {
          payloadValues[field.key] = raw === '' ? '' : Number(raw);
        } else {
          payloadValues[field.key] = raw;
        }
      });

      const res = await saveProperties({
        serverUuid,
        values: payloadValues,
        extras,
        create_backup: true,
      });

      if (!res.success) {
        notify(res.message || 'Save failed.', 'error');
        return;
      }

      notify('server.properties saved (backup created).');
      setDirty(false);
      await load();
    } catch (e: any) {
      notify(e?.response?.data?.message || 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onBackup = async () => {
    try {
      const res = await backupProperties(serverUuid);
      if (!res.success) {
        notify(res.message || 'Backup failed.', 'error');
        return;
      }
      notify('Backup written to server.properties.minecontrol.bak');
    } catch (e: any) {
      notify(e?.response?.data?.message || 'Backup failed.', 'error');
    }
  };

  const onRestore = async () => {
    if (!window.confirm('Restore server.properties from the MineControl backup?')) return;
    try {
      const res = await restoreProperties(serverUuid);
      if (!res.success) {
        notify(res.message || 'Restore failed.', 'error');
        return;
      }
      notify('Backup restored.');
      await load();
    } catch (e: any) {
      notify(e?.response?.data?.message || 'Restore failed.', 'error');
    }
  };

  if (loading) {
    return (
      <section className="mc-panel">
        <div className="mc-spinner" />
      </section>
    );
  }

  if (missing) {
    return (
      <section className="mc-panel">
        <div className="mc-empty">
          <strong>server.properties not found</strong>
          {message || 'Start the Minecraft Java server once so the file is generated, then refresh.'}
          <div style={{ marginTop: '1rem' }}>
            <button type="button" className="mc-btn mc-btn-primary" onClick={load}>
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="mc-panel">
        <div className="mc-toolbar">
          <div>
            <strong style={{ color: '#fff', fontSize: '1rem' }}>server.properties</strong>
            <div style={{ color: 'var(--mc-muted)', fontSize: '0.82rem', marginTop: 2 }}>
              Edit Minecraft Java settings with grouped controls. A backup is created on save.
              {dirty ? ' · Unsaved changes' : ''}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="mc-btn mc-btn-ghost" onClick={load}>
              Reload
            </button>
            <button type="button" className="mc-btn mc-btn-amber" onClick={onBackup}>
              Backup
            </button>
            <button type="button" className="mc-btn mc-btn-ghost" onClick={onRestore}>
              Restore
            </button>
            <button type="button" className="mc-btn mc-btn-primary" disabled={saving || !dirty} onClick={onSave}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>

        <div className="mc-props-layout">
          <aside className="mc-side-nav">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                className={activeGroup === group.id ? 'is-active' : ''}
                onClick={() => setActiveGroup(group.id)}
              >
                {group.label}
              </button>
            ))}
            <button
              type="button"
              className={showRawExtras && activeGroup === '__extras' ? 'is-active' : ''}
              onClick={() => {
                setActiveGroup('__extras');
                setShowRawExtras(true);
              }}
            >
              Extra keys
            </button>
          </aside>

          <div>
            {activeGroup !== '__extras' && (
              <>
                <div className="mc-statline">
                  <span>
                    Category: <strong>{groups.find((g) => g.id === activeGroup)?.label}</strong>
                  </span>
                  <span>{groups.find((g) => g.id === activeGroup)?.description}</span>
                </div>

                {visibleFields.map((field) => {
                  const value = values[field.key] ?? '';
                  return (
                    <div className="mc-field" key={field.key}>
                      <div>
                        <label htmlFor={`mc-prop-${field.key}`}>{field.label}</label>
                        {field.help && <div className="mc-help">{field.help}</div>}
                        <div className="mc-help">
                          <code>{field.key}</code>
                        </div>
                      </div>
                      <div>
                        {field.type === 'boolean' ? (
                          <label className="mc-switch">
                            <input
                              id={`mc-prop-${field.key}`}
                              type="checkbox"
                              checked={!!coerceDisplay(field, value)}
                              onChange={(e) => setValue(field.key, e.target.checked ? 'true' : 'false')}
                            />
                            <span />
                          </label>
                        ) : field.type === 'select' ? (
                          <select
                            id={`mc-prop-${field.key}`}
                            className="mc-select"
                            value={value}
                            onChange={(e) => setValue(field.key, e.target.value)}
                          >
                            {(field.options || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            id={`mc-prop-${field.key}`}
                            className="mc-input"
                            type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'}
                            value={value}
                            min={field.min}
                            max={field.max}
                            onChange={(e) => setValue(field.key, e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {activeGroup === '__extras' && (
              <>
                <div className="mc-statline">
                  <span>
                    Extra keys found in the file that are not in the curated schema. They are preserved on save.
                  </span>
                </div>
                {extras.length === 0 ? (
                  <div className="mc-empty">
                    <strong>No extra keys</strong>
                    Everything in this file is covered by the schema.
                  </div>
                ) : (
                  extras.map((extra, idx) => (
                    <div className="mc-field" key={`${extra.key}-${idx}`}>
                      <div>
                        <label>{extra.key}</label>
                      </div>
                      <div>
                        <input
                          className="mc-input"
                          value={extra.value}
                          onChange={(e) => {
                            const next = [...extras];
                            next[idx] = { ...next[idx], value: e.target.value };
                            setExtras(next);
                            setDirty(true);
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {toast && <Toast message={toast.message} kind={toast.kind} onClose={() => setToast(null)} />}
    </>
  );
};
