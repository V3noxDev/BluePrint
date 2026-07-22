import React, { Component, useCallback, useEffect, useMemo, useState } from 'react';
import { ServerContext } from '@/state/server';
import http from '@/api/http';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';

interface TemplateVariable {
    id: number;
    name: string;
    env_variable: string;
    description: string | null;
    default_value: string | null;
    rules: string | null;
    selectable: boolean;
}

interface Template {
    id: number;
    name: string;
    icon_url: string | null;
    category: string | null;
    description: string | null;
    full_description?: string | null;
    version: string;
    author: string | null;
    has_password: boolean;
    password_description: string | null;
    variables: TemplateVariable[];
}

interface Allocation {
    id: number;
    text: string;
    port: number;
}

const stripHtml = (value: string | null): string =>
    (value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const renderHtml = (value: string | null): React.ReactNode => {
    if (!value) return null;
    if (!/<[a-z][\s\S]*>/i.test(value)) return value;
    return <span dangerouslySetInnerHTML={{ __html: value }} />;
};

const parseEnumOptions = (rules: string | null | undefined): string[] => {
    const match = (rules ?? '').match(/in:([^|]+)/);
    if (!match) return [];
    return match[1].split(',').map((v) => v.trim()).filter(Boolean);
};

const formatApiError = (e: unknown): string => {
    const err = e as {
        response?: { data?: { error?: string; message?: string; errors?: Record<string, string[]> } };
        message?: string;
    };
    const data = err.response?.data;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
    if (data?.errors) {
        const first = Object.values(data.errors).flat()[0];
        if (first) return first;
    }
    if (err.message) return err.message;
    return 'Falha na requisição.';
};

const asArray = <T,>(value: unknown): T[] =>
    Array.isArray(value) ? value.filter((item): item is T => item != null) : [];

const normalizeVariables = (variables: unknown): TemplateVariable[] =>
    asArray<TemplateVariable>(variables).filter((v) => typeof v === 'object');

const variableRules = (v: TemplateVariable | null | undefined): string => v?.rules ?? '';

const fieldValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    return String(value);
};

const variableKey = (v: TemplateVariable): string => v.env_variable || `var-${v.id}`;

const isPortVariable = (v: TemplateVariable) => {
    const rules = variableRules(v);
    return /port/i.test(v.name || '') || /port/i.test(v.env_variable || '') || /port/i.test(rules);
};

const isBooleanVariable = (v: TemplateVariable) => /boolean/i.test(variableRules(v));

const TemplatesSectionContent = () => {
    const uuid = ServerContext.useStoreState((s) => s.server.data?.uuid);

    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [values, setValues] = useState<Record<string, string>>({});
    const [allocations, setAllocations] = useState<Allocation[]>([]);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [success, setSuccess] = useState<string | null>(null);

    const selected = useMemo(
        () => templates.find((t) => t?.id === selectedId) ?? null,
        [templates, selectedId],
    );

    const filtered = useMemo(() => {
        if (!categoryFilter) return templates;
        return templates.filter((t) => (t.category || '') === categoryFilter);
    }, [templates, categoryFilter]);

    const grouped = useMemo(() => {
        const map = new Map<string, Template[]>();
        filtered.forEach((t) => {
            const cat = t.category || 'Outros';
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat)!.push(t);
        });
        return map;
    }, [filtered]);

    const load = useCallback(async () => {
        if (!uuid) {
            setLoading(false);
            setError('Servidor não carregado. Recarregue a página.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const { data } = await http.get(`/api/client/extensions/templates/servers/${uuid}/templates`);
            if (data?.success === false) {
                throw new Error(data.error || data.message || 'Não foi possível carregar os templates.');
            }

            const payload = data?.data ?? data ?? {};
            setTemplates(asArray<Template>(payload.templates));
            setCategories(asArray<string>(payload.categories));

            const { data: allocData } = await http.get(
                `/api/client/extensions/templates/servers/${uuid}/templates/allocations`,
            );
            if (allocData?.success === false) {
                setAllocations([]);
            } else {
                setAllocations(asArray<Allocation>(allocData?.data ?? allocData));
            }
        } catch (e: unknown) {
            setError(formatApiError(e));
            setTemplates([]);
            setCategories([]);
            setAllocations([]);
        } finally {
            setLoading(false);
        }
    }, [uuid]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!selected) {
            setValues({});
            return;
        }
        const init: Record<string, string> = {};
        normalizeVariables(selected.variables).forEach((v) => {
            init[variableKey(v)] = fieldValue(v.default_value);
        });
        setValues(init);
    }, [selected]);

    useEffect(() => {
        if (!selected || allocations.length === 0) return;

        const ports = allocations
            .map((a) => (a?.port === null || a?.port === undefined ? '' : String(a.port)))
            .filter(Boolean);
        if (!ports.length) return;

        setValues((prev) => {
            let changed = false;
            const next = { ...prev };

            normalizeVariables(selected.variables).forEach((v) => {
                if (!isPortVariable(v)) return;
                const key = variableKey(v);
                const current = fieldValue(next[key]);
                if (!ports.includes(current)) {
                    next[key] = ports.includes(fieldValue(v.default_value))
                        ? fieldValue(v.default_value)
                        : ports[0];
                    changed = true;
                }
            });

            return changed ? next : prev;
        });
    }, [allocations, selected]);

    const validateBeforeInstall = (): string | null => {
        if (!selected) return 'Nenhum template selecionado.';
        for (const v of normalizeVariables(selected.variables)) {
            const key = variableKey(v);
            const val = values[key];
            if (variableRules(v).includes('required') && val === '') {
                return `Preencha o campo "${v.name || v.env_variable}".`;
            }
        }
        return null;
    };

    const handleInstall = async () => {
        if (!selected || !uuid) return;
        const validationError = validateBeforeInstall();
        if (validationError) {
            setError(validationError);
            setShowConfirm(false);
            return;
        }
        setInstalling(true);
        setError(null);
        try {
            const { data: res } = await http.post(`/api/client/extensions/templates/servers/${uuid}/templates/install`, {
                template_id: selected.id,
                password: password || undefined,
                variables: values,
            });
            if (res?.success === false) {
                throw new Error(res.error || res.message || 'Falha ao instalar template.');
            }
            setSuccess(res?.message || `Template "${selected.name}" instalado com sucesso!`);
            setShowConfirm(false);
            setShowPassword(false);
            setPassword('');
        } catch (e: unknown) {
            setError(formatApiError(e));
            setShowConfirm(false);
        } finally {
            setInstalling(false);
        }
    };

    const onInstallClick = () => {
        if (!selected) return;
        const validationError = validateBeforeInstall();
        if (validationError) {
            setError(validationError);
            return;
        }
        setError(null);
        if (selected.has_password) {
            setShowPassword(true);
            return;
        }
        setShowConfirm(true);
    };

    const renderVariableField = (v: TemplateVariable) => {
        const rules = variableRules(v);
        const enumOptions = parseEnumOptions(rules);
        const fieldKey = variableKey(v);
        const currentValue = fieldValue(values[fieldKey]);
        const usePortSelect = isPortVariable(v) && allocations.length > 0;

        if (usePortSelect) {
            const ports = allocations
                .map((a) => (a?.port === null || a?.port === undefined ? '' : String(a.port)))
                .filter(Boolean);
            const selectValue = ports.includes(currentValue) ? currentValue : ports[0] ?? '';

            return (
                <select
                    key={`${fieldKey}-select`}
                    id={`var-${v.id}`}
                    className="tpl-input"
                    value={selectValue}
                    onChange={(e) =>
                        setValues((prev) => ({
                            ...prev,
                            [fieldKey]: e.target.value,
                        }))
                    }
                >
                    <option value="">Selecione uma porta</option>
                    {allocations.map((a) => {
                        if (a?.port === null || a?.port === undefined) return null;
                        const port = String(a.port);
                        return (
                            <option key={a.id ?? port} value={port}>
                                {a.text || port}
                            </option>
                        );
                    })}
                </select>
            );
        }

        if (isPortVariable(v)) {
            return (
                <input
                    key={`${fieldKey}-number`}
                    id={`var-${v.id}`}
                    type="number"
                    className="tpl-input"
                    placeholder="Ex: 19132"
                    value={currentValue}
                    onChange={(e) =>
                        setValues((prev) => ({
                            ...prev,
                            [fieldKey]: e.target.value,
                        }))
                    }
                />
            );
        }

        if (isBooleanVariable(v)) {
            return (
                <label className="tpl-toggle">
                    <input
                        key={`${fieldKey}-bool`}
                        id={`var-${v.id}`}
                        type="checkbox"
                        checked={currentValue === '1' || currentValue === 'true'}
                        onChange={(e) =>
                            setValues((prev) => ({
                                ...prev,
                                [fieldKey]: e.target.checked ? '1' : '0',
                            }))
                        }
                    />
                    <span className="tpl-toggle__track" />
                </label>
            );
        }

        if (enumOptions.length > 0) {
            const selectValue = enumOptions.includes(currentValue) ? currentValue : enumOptions[0];

            return (
                <select
                    key={`${fieldKey}-enum`}
                    id={`var-${v.id}`}
                    className="tpl-input"
                    value={selectValue}
                    onChange={(e) =>
                        setValues((prev) => ({
                            ...prev,
                            [fieldKey]: e.target.value,
                        }))
                    }
                >
                    {enumOptions.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            );
        }

        return (
            <input
                key={`${fieldKey}-text`}
                id={`var-${v.id}`}
                type="text"
                className="tpl-input"
                value={currentValue}
                onChange={(e) =>
                    setValues((prev) => ({
                        ...prev,
                        [fieldKey]: e.target.value,
                    }))
                }
            />
        );
    };

    if (loading) {
        return (
            <PageContentBlock title="Templates">
                <div className="tpl-loading">
                    <Spinner size="large" />
                    <span>Carregando templates...</span>
                </div>
            </PageContentBlock>
        );
    }

    return (
        <PageContentBlock title="Templates">
            <div className="tpl-page">
                {error && <div className="tpl-alert tpl-alert--error">{error}</div>}
                {success && <div className="tpl-alert tpl-alert--ok">{success}</div>}

                <div className="tpl-layout">
                    <aside className="tpl-sidebar">
                        {categories.length > 0 && (
                            <div className="tpl-filters">
                                <button
                                    type="button"
                                    className={`tpl-filter${!categoryFilter ? ' is-active' : ''}`}
                                    onClick={() => setCategoryFilter('')}
                                >
                                    Todos
                                </button>
                                {categories.filter(Boolean).map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        className={`tpl-filter${categoryFilter === c ? ' is-active' : ''}`}
                                        onClick={() => setCategoryFilter(c)}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        )}

                        {Array.from(grouped.entries()).map(([cat, items]) => (
                            <div key={cat} className="tpl-group">
                                <div className="tpl-group__title">{cat}</div>
                                {items.map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        className={`tpl-card${selectedId === t.id ? ' is-active' : ''}`}
                                        onClick={() => {
                                            setSelectedId(t.id);
                                            setSuccess(null);
                                            setError(null);
                                        }}
                                    >
                                        {t.icon_url ? (
                                            <img src={t.icon_url} alt="" className="tpl-card__icon" />
                                        ) : (
                                            <div className="tpl-card__icon tpl-card__icon--fallback">
                                                {(t.name || '??').slice(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="tpl-card__body">
                                            <div className="tpl-card__name">{t.name || 'Template'}</div>
                                            <div className="tpl-card__desc">{stripHtml(t.description)}</div>
                                            <div className="tpl-card__meta">
                                                {t.author || '—'} — {t.version || '1.0.0'}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ))}

                        {!templates.length && (
                            <p className="tpl-empty">Nenhum template disponível. Peça ao admin para criar um.</p>
                        )}
                    </aside>

                    <main className="tpl-detail">
                        {!selected ? (
                            <div className="tpl-detail__empty">
                                Selecione um template para ver mais informações.
                            </div>
                        ) : (
                            <>
                                <h2 className="tpl-detail__title">{selected.name || 'Template'}</h2>
                                {selected.full_description ? (
                                    <div className="tpl-detail__html">{renderHtml(selected.full_description)}</div>
                                ) : selected.description ? (
                                    <div className="tpl-detail__desc">{renderHtml(selected.description)}</div>
                                ) : null}

                                <div className="tpl-vars">
                                    {normalizeVariables(selected.variables).map((v) => (
                                        <div key={v.id ?? variableKey(v)} className="tpl-var">
                                            <label className="tpl-var__label" htmlFor={`var-${v.id}`}>
                                                {v.name || v.env_variable}
                                            </label>
                                            {v.description && (
                                                <p className="tpl-var__hint">{renderHtml(v.description)}</p>
                                            )}
                                            {renderVariableField(v)}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    className="tpl-install-btn"
                                    disabled={installing}
                                    onClick={onInstallClick}
                                >
                                    {installing ? 'Instalando…' : 'Instalar'}
                                </button>
                            </>
                        )}
                    </main>
                </div>

                {showConfirm && (
                    <div className="tpl-modal-backdrop" onClick={() => !installing && setShowConfirm(false)}>
                        <div className="tpl-modal" onClick={(e) => e.stopPropagation()}>
                            <p>
                                Tem certeza que deseja instalar este template? Isso pode sobrescrever
                                arquivos existentes no servidor. O servidor pode ficar ligado — não será
                                desligado automaticamente.
                            </p>
                            <div className="tpl-modal__actions">
                                <button
                                    type="button"
                                    className="tpl-btn tpl-btn--muted"
                                    disabled={installing}
                                    onClick={() => setShowConfirm(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="tpl-btn tpl-btn--danger"
                                    disabled={installing}
                                    onClick={handleInstall}
                                >
                                    {installing ? 'Instalando…' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showPassword && selected && (
                    <div className="tpl-modal-backdrop" onClick={() => setShowPassword(false)}>
                        <div className="tpl-modal" onClick={(e) => e.stopPropagation()}>
                            <h3>Senha do template</h3>
                            {selected.password_description && (
                                <div className="tpl-detail__html">{renderHtml(selected.password_description)}</div>
                            )}
                            <input
                                type="password"
                                className="tpl-input"
                                placeholder="Senha do template"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <div className="tpl-modal__actions">
                                <button type="button" className="tpl-btn tpl-btn--muted" onClick={() => setShowPassword(false)}>
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="tpl-btn tpl-btn--primary"
                                    onClick={() => {
                                        setShowPassword(false);
                                        setShowConfirm(true);
                                    }}
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageContentBlock>
    );
};

type ErrorBoundaryState = { error: Error | null };

class TemplatesErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
    state: ErrorBoundaryState = { error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error };
    }

    render() {
        if (this.state.error) {
            return (
                <PageContentBlock title="Templates">
                    <div className="tpl-alert tpl-alert--error">
                        Erro ao renderizar Templates: {this.state.error.message}
                    </div>
                </PageContentBlock>
            );
        }

        return this.props.children;
    }
}

const TemplatesSection = () => (
    <TemplatesErrorBoundary>
        <TemplatesSectionContent />
    </TemplatesErrorBoundary>
);

export default TemplatesSection;
