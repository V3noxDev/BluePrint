import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faRedo, faSlidersH } from '@fortawesome/free-solid-svg-icons';
import http from '@/api/http';
import {
    PROPERTY_CATEGORIES,
    PropertyDefinition,
    boolValue,
    toBoolString,
} from './propertyDefinitions';

interface Props {
    uuid: string;
    canEdit: boolean;
    onToast: (type: 'ok' | 'err', message: string) => void;
}

type PropertyMap = Record<string, string>;

const Field = ({
    def,
    value,
    disabled,
    onChange,
}: {
    def: PropertyDefinition;
    value: string;
    disabled: boolean;
    onChange: (key: string, next: string) => void;
}) => {
    if (def.type === 'boolean') {
        return (
            <div className="mcm-field">
                <label className="mcm-toggle">
                    <input
                        type="checkbox"
                        checked={boolValue(value)}
                        disabled={disabled || def.readonly}
                        onChange={(e) => onChange(def.key, toBoolString(e.target.checked))}
                    />
                    <span>{def.label}</span>
                </label>
                {def.help && <div className="mcm-help">{def.help}</div>}
            </div>
        );
    }

    if (def.type === 'select') {
        const options = def.options || [];
        const hasCurrent = options.some((o) => o.value === value);

        return (
            <div className="mcm-field">
                <label htmlFor={`mcm-${def.key}`}>{def.label}</label>
                <select
                    id={`mcm-${def.key}`}
                    className="mcm-select"
                    value={value}
                    disabled={disabled || def.readonly}
                    onChange={(e) => onChange(def.key, e.target.value)}
                >
                    <option value="">—</option>
                    {!hasCurrent && value !== '' && <option value={value}>{value}</option>}
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {def.help && <div className="mcm-help">{def.help}</div>}
            </div>
        );
    }

    return (
        <div className="mcm-field">
            <label htmlFor={`mcm-${def.key}`}>{def.label}</label>
            <input
                id={`mcm-${def.key}`}
                className="mcm-input"
                type={def.type === 'number' ? 'number' : 'text'}
                value={value}
                placeholder={def.placeholder}
                disabled={disabled || def.readonly}
                onChange={(e) => onChange(def.key, e.target.value)}
            />
            {def.help && <div className="mcm-help">{def.help}</div>}
        </div>
    );
};

export default ({ uuid, canEdit, onToast }: Props) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [properties, setProperties] = useState<PropertyMap>({});
    const [extraKeys, setExtraKeys] = useState<string[]>([]);
    const [path, setPath] = useState('/server.properties');

    const knownKeys = useMemo(
        () => new Set(PROPERTY_CATEGORIES.flatMap((c) => c.properties.map((p) => p.key))),
        []
    );

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await http.get(`/api/client/extensions/mcmanager/${uuid}/properties`);
            const map: PropertyMap = data.properties || {};
            setProperties(map);
            setPath(data.path || '/server.properties');
            setExtraKeys(Object.keys(map).filter((key) => !knownKeys.has(key)).sort());
        } catch (error: any) {
            onToast('err', error?.response?.data?.error || error?.response?.data?.message || 'Falha ao carregar server.properties');
            setProperties({});
            setExtraKeys([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uuid]);

    const setValue = (key: string, next: string) => {
        setProperties((prev) => ({ ...prev, [key]: next }));
    };

    const save = async () => {
        if (!canEdit) {
            onToast('err', 'Edição de properties desabilitada pelo administrador.');
            return;
        }

        setSaving(true);
        try {
            const { data } = await http.put(`/api/client/extensions/mcmanager/${uuid}/properties`, {
                properties,
            });
            setProperties(data.properties || properties);
            onToast('ok', data.message || 'server.properties salvo com sucesso.');
        } catch (error: any) {
            onToast('err', error?.response?.data?.error || error?.response?.data?.message || 'Falha ao salvar server.properties');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="mcm-panel">
                <div className="mcm-status">
                    <span className="mcm-spinner" /> Carregando {path}…
                </div>
            </div>
        );
    }

    return (
        <div className="mcm-panel">
            <div className="mcm-panel-head">
                <div>
                    <h3>
                        <FontAwesomeIcon icon={faSlidersH} style={{ marginRight: 8 }} />
                        Editor de server.properties
                    </h3>
                    <p>
                        Arquivo: <code>{path}</code> — alterações importantes podem exigir restart.
                    </p>
                </div>
                <div className="mcm-actions" style={{ marginTop: 0 }}>
                    <button type="button" className="mcm-btn mcm-btn-secondary" onClick={load} disabled={saving}>
                        <FontAwesomeIcon icon={faRedo} /> Recarregar
                    </button>
                    <button type="button" className="mcm-btn mcm-btn-primary" onClick={save} disabled={saving || !canEdit}>
                        {saving ? <span className="mcm-spinner" /> : <FontAwesomeIcon icon={faSave} />}
                        Salvar
                    </button>
                </div>
            </div>

            {PROPERTY_CATEGORIES.map((category) => (
                <div key={category.id}>
                    <div className="mcm-category">{category.title}</div>
                    <div className="mcm-grid">
                        {category.properties.map((def) => (
                            <Field
                                key={def.key}
                                def={def}
                                value={properties[def.key] ?? ''}
                                disabled={saving}
                                onChange={setValue}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {extraKeys.length > 0 && (
                <div>
                    <div className="mcm-category">Outras properties</div>
                    <div className="mcm-grid">
                        {extraKeys.map((key) => (
                            <div className="mcm-field" key={key}>
                                <label htmlFor={`mcm-extra-${key}`}>{key}</label>
                                <input
                                    id={`mcm-extra-${key}`}
                                    className="mcm-input"
                                    type="text"
                                    value={properties[key] ?? ''}
                                    disabled={saving || !canEdit}
                                    onChange={(e) => setValue(key, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
