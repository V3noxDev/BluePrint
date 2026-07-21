import React, { useEffect, useState, useCallback } from 'react';
import { ServerContext } from '@/state/server';
import http from '@/api/http';
import useFlash from '@/plugins/useFlash';
import Spinner from '@/components/elements/Spinner';

interface FieldDef {
    key: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'select';
    description?: string;
    min?: number;
    max?: number;
    options?: string[];
}

interface SectionDef {
    label: string;
    icon: string;
    fields: FieldDef[];
}

interface PropertiesResponse {
    success: boolean;
    data?: {
        properties: Record<string, string>;
        definitions: Record<string, SectionDef>;
        modules: string[];
    };
    message?: string;
}

const ServerPropertiesEditor = () => {
    const { id } = ServerContext.useStoreState((state) => state.server.data!);
    const { clearFlashes, addFlash } = useFlash();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [properties, setProperties] = useState<Record<string, string>>({});
    const [original, setOriginal] = useState<Record<string, string>>({});
    const [definitions, setDefinitions] = useState<Record<string, SectionDef>>({});
    const [error, setError] = useState<string | null>(null);
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
                setDefinitions(data.data.definitions);
            } else {
                setError(data.message || 'Erro ao carregar propriedades.');
            }
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    'Não foi possível carregar o server.properties.'
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

    const toggleBoolean = (key: string) => {
        const current = properties[key] === 'true';
        updateProperty(key, current ? 'false' : 'true');
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
                    message: 'server.properties salvo com sucesso!',
                });
            }
        } catch (err: any) {
            addFlash({
                key: 'minehub:properties',
                type: 'error',
                message:
                    err?.response?.data?.message ||
                    'Erro ao salvar server.properties.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setProperties({ ...original });
        setDirty(false);
    };

    const renderField = (field: FieldDef) => {
        const value = properties[field.key] ?? '';

        if (field.type === 'boolean') {
            const isOn = value === 'true';
            return (
                <div key={field.key} className={'minehub-switch'}>
                    <div className={'minehub-switch__info'}>
                        <div className={'minehub-switch__label'}>{field.label}</div>
                        {field.description && (
                            <div className={'minehub-switch__desc'}>{field.description}</div>
                        )}
                    </div>
                    <button
                        type={'button'}
                        className={`minehub-switch__toggle ${isOn ? 'active' : ''}`}
                        onClick={() => toggleBoolean(field.key)}
                    />
                </div>
            );
        }

        if (field.type === 'select') {
            return (
                <div key={field.key} className={'minehub-field'}>
                    <label className={'minehub-field__label'}>{field.label}</label>
                    <select
                        value={value}
                        onChange={(e) => updateProperty(field.key, e.target.value)}
                    >
                        {field.options?.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                    {field.description && (
                        <div className={'minehub-field__desc'}>{field.description}</div>
                    )}
                </div>
            );
        }

        return (
            <div key={field.key} className={'minehub-field'}>
                <label className={'minehub-field__label'}>{field.label}</label>
                <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={value}
                    min={field.min}
                    max={field.max}
                    onChange={(e) => updateProperty(field.key, e.target.value)}
                />
                {field.description && (
                    <div className={'minehub-field__desc'}>{field.description}</div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className={'minehub-loading'}>
                <Spinner size={'large'} />
                <span>Carregando server.properties...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={'minehub-alert minehub-alert--error'}>
                {error}
                <div style={{ marginTop: '12px' }}>
                    <button className={'minehub-btn minehub-btn--ghost'} onClick={loadProperties}>
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {Object.entries(definitions).map(([key, section]) => (
                <div key={key} className={'minehub-props-section'}>
                    <div className={'minehub-props-section__header'}>
                        <span className={'minehub-props-section__icon'}>{section.icon}</span>
                        <h3>{section.label}</h3>
                    </div>
                    <div className={'minehub-props-grid'}>
                        {section.fields.map((field) =>
                            field.type === 'boolean'
                                ? renderField(field)
                                : renderField(field)
                        )}
                    </div>
                </div>
            ))}

            {dirty && (
                <div className={'minehub-save-bar'}>
                    <div className={'minehub-save-bar__inner'}>
                        <span className={'minehub-save-bar__text'}>
                            Alterações não salvas
                        </span>
                        <button
                            className={'minehub-btn minehub-btn--ghost'}
                            onClick={handleReset}
                            disabled={saving}
                        >
                            Descartar
                        </button>
                        <button
                            className={'minehub-btn minehub-btn--primary'}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Salvando...' : '💾 Salvar Properties'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServerPropertiesEditor;
