import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ServerContext } from '@/state/server';
import http from '@/api/http';
import useFlash from '@/plugins/useFlash';
import Spinner from '@/components/elements/Spinner';

interface PropertiesResponse {
    success: boolean;
    data?: {
        properties: Record<string, string>;
        definitions?: Record<string, unknown>;
    };
    message?: string;
}

const BOOLEAN_KEYS = new Set([
    'accepts-transfers',
    'allow-flight',
    'allow-nether',
    'broadcast-console-to-ops',
    'broadcast-rcon-to-ops',
    'debug',
    'enable-command-block',
    'enable-jmx-monitoring',
    'enable-query',
    'enable-rcon',
    'enable-status',
    'enforce-secure-profile',
    'enforce-whitelist',
    'force-gamemode',
    'generate-structures',
    'hardcore',
    'hide-online-players',
    'online-mode',
    'prevent-proxy-connections',
    'pvp',
    'require-resource-pack',
    'spawn-animals',
    'spawn-monsters',
    'spawn-npcs',
    'sync-chunk-writes',
    'use-native-transport',
    'white-list',
]);

const formatLabel = (key: string): string =>
    key.replace(/[-_]/g, ' ').replace(/\./g, ' ').toUpperCase();

const isBooleanValue = (key: string, value: string): boolean => {
    if (BOOLEAN_KEYS.has(key)) return true;
    return value === 'true' || value === 'false';
};

const ServerPropertiesEditor = () => {
    const { id } = ServerContext.useStoreState((state) => state.server.data!);
    const { clearFlashes, addFlash } = useFlash();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [properties, setProperties] = useState<Record<string, string>>({});
    const [original, setOriginal] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [dirty, setDirty] = useState(false);

    const loadProperties = useCallback(async () => {
        setLoading(true);
        setError(null);
        clearFlashes('minehub:properties');

        try {
            const { data } = await http.get<PropertiesResponse>(
                `/api/client/extensions/minehub/servers/${id}/properties`
            );

            if (data.success && data.data) {
                setProperties({ ...data.data.properties });
                setOriginal({ ...data.data.properties });
                setDirty(false);
            } else {
                setError(data.message || 'Failed to load properties.');
            }
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    'Could not load server.properties.'
            );
        } finally {
            setLoading(false);
        }
    }, [id, clearFlashes]);

    useEffect(() => {
        loadProperties();
    }, [loadProperties]);

    const updateProperty = (key: string, value: string) => {
        setProperties((prev) => ({ ...prev, [key]: value }));
        setDirty(true);
    };

    const handleSave = async () => {
        setSaving(true);
        clearFlashes('minehub:properties');

        try {
            const { data } = await http.post(
                `/api/client/extensions/minehub/servers/${id}/properties`,
                { properties }
            );

            if (data.success) {
                setOriginal({ ...properties });
                setDirty(false);
                addFlash({
                    key: 'minehub:properties',
                    type: 'success',
                    message: 'Configuration saved successfully.',
                });
            }
        } catch (err: any) {
            addFlash({
                key: 'minehub:properties',
                type: 'error',
                message:
                    err?.response?.data?.message ||
                    'Failed to save server.properties.',
            });
        } finally {
            setSaving(false);
        }
    };

    const filteredKeys = useMemo(() => {
        const query = search.trim().toLowerCase();
        const keys = Object.keys(properties).sort((a, b) => a.localeCompare(b));

        if (!query) return keys;

        return keys.filter((key) => {
            const label = formatLabel(key).toLowerCase();
            const value = (properties[key] || '').toLowerCase();
            return key.includes(query) || label.includes(query) || value.includes(query);
        });
    }, [properties, search]);

    if (loading) {
        return (
            <div className={'mh-loading'}>
                <Spinner size={'large'} />
                <span>Loading configuration...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={'mh-alert'}>
                <p>{error}</p>
                <button type={'button'} className={'mh-btn mh-btn--ghost'} onClick={loadProperties}>
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className={'mh-configs'}>
            <div className={'mh-toolbar'}>
                <div className={'mh-select'}>
                    <select value={'server.properties'} disabled>
                        <option value={'server.properties'}>server.properties</option>
                    </select>
                    <svg viewBox={'0 0 20 20'} fill={'currentColor'} aria-hidden={'true'}>
                        <path
                            fillRule={'evenodd'}
                            d={'M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'}
                            clipRule={'evenodd'}
                        />
                    </svg>
                </div>

                <div className={'mh-search'}>
                    <input
                        type={'text'}
                        placeholder={'Search...'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <button
                    type={'button'}
                    className={'mh-btn mh-btn--save'}
                    onClick={handleSave}
                    disabled={saving || !dirty}
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </div>

            {filteredKeys.length === 0 ? (
                <div className={'mh-empty'}>No properties found.</div>
            ) : (
                <div className={'mh-grid'}>
                    {filteredKeys.map((key) => {
                        const value = properties[key] ?? '';
                        const booleanField = isBooleanValue(key, value);
                        const isOn = value === 'true';

                        return (
                            <div key={key} className={'mh-card'}>
                                <div className={'mh-card__label'}>{formatLabel(key)}</div>

                                {booleanField ? (
                                    <button
                                        type={'button'}
                                        className={`mh-toggle ${isOn ? 'is-on' : ''}`}
                                        onClick={() =>
                                            updateProperty(key, isOn ? 'false' : 'true')
                                        }
                                        aria-pressed={isOn}
                                        aria-label={formatLabel(key)}
                                    >
                                        <span className={'mh-toggle__knob'} />
                                    </button>
                                ) : (
                                    <input
                                        className={'mh-input'}
                                        type={'text'}
                                        value={value}
                                        onChange={(e) => updateProperty(key, e.target.value)}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ServerPropertiesEditor;
