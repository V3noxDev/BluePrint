import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
    rules: string;
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

const parseEnumOptions = (rules: string): string[] => {
    const match = rules.match(/in:([^|]+)/);
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

const normalizeVariables = (variables: TemplateVariable[] | null | undefined): TemplateVariable[] =>
    Array.isArray(variables) ? variables : [];

const TemplatesSection = () => {
    const uuid = ServerContext.useStoreState((s) => s.server.data!.uuid);

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
        () => templates.find((t) => t.id === selectedId) ?? null,
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
        setLoading(true);
        setError(null);
        try {
            const { data } = await http.get(`/api/client/extensions/templates/servers/${uuid}/templates`);
            const list: Template[] = data.data?.templates ?? data.templates ?? [];
            setTemplates(list);
            setCategories(data.data?.categories ?? data.categories ?? []);
            const { data: allocData } = await http.get(
                `/api/client/extensions/templates/servers/${uuid}/templates/allocations`,
            );
            setAllocations(allocData.data ?? allocData ?? []);
        } catch (e: unknown) {
            setError(formatApiError(e));
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
            init[v.env_variable] = v.default_value ?? '';
        });
        setValues(init);
    }, [selected]);

    const validateBeforeInstall = (): string | null => {
        if (!selected) return 'Nenhum template selecionado.';
        for (const v of normalizeVariables(selected.variables)) {
            const val = values[v.env_variable];
            if (v.rules.includes('required') && (val === undefined || val === null || val === '')) {
                return `Preencha o campo "${v.name}".`;
            }
        }
        return null;
    };

    const handleInstall = async () => {
        if (!selected) return;
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
            if (res.success === false) {
                throw new Error(res.error || res.message || 'Falha ao instalar template.');
            }
            setSuccess(res.message || `Template "${selected.name}" instalado com sucesso!`);
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

    const isPortVariable = (v: TemplateVariable) =>
        /port/i.test(v.name) || /port/i.test(v.env_variable) || /port/i.test(v.rules);

    const isBooleanVariable = (v: TemplateVariable) => /boolean/i.test(v.rules);

    const renderVariableField = (v: TemplateVariable) => {
        const enumOptions = parseEnumOptions(v.rules);

        if (isPortVariable(v) && allocations.length > 0) {
            return (
                <select
                    id={`var-${v.id}`}
                    className="tpl-input"
                    value={values[v.env_variable] ?? ''}
                    onChange={(e) =>
                        setValues((prev) => ({
                            ...prev,
                            [v.env_variable]: e.target.value,
                        }))
                    }
                >
                    <option value="">Selecione uma porta</option>
                    {allocations.map((a) => (
                        <option key={a.id} value={String(a.port)}>
                            {a.text}
                        </option>
                    ))}
                </select>
            );
        }

        if (isPortVariable(v)) {
            return (
                <input
                    id={`var-${v.id}`}
                    type="number"
                    className="tpl-input"
                    placeholder="Ex: 19132"
                    value={values[v.env_variable] ?? ''}
                    onChange={(e) =>
                        setValues((prev) => ({
                            ...prev,
                            [v.env_variable]: e.target.value,
                        }))
                    }
                />
            );
        }

        if (isBooleanVariable(v)) {
            return (
                <label className="tpl-toggle">
                    <input
                        id={`var-${v.id}`}
                        type="checkbox"
                        checked={values[v.env_variable] === '1' || values[v.env_variable] === 'true'}
                        onChange={(e) =>
                            setValues((prev) => ({
                                ...prev,
                                [v.env_variable]: e.target.checked ? '1' : '0',
                            }))
                        }
                    />
                    <span className="tpl-toggle__track" />
                </label>
            );
        }

        if (enumOptions.length > 0) {
            return (
                <select
                    id={`var-${v.id}`}
                    className="tpl-input"
                    value={values[v.env_variable] ?? enumOptions[0]}
                    onChange={(e) =>
                        setValues((prev) => ({
                            ...prev,
                            [v.env_variable]: e.target.value,
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
                id={`var-${v.id}`}
                type="text"
                className="tpl-input"
                value={values[v.env_variable] ?? ''}
                onChange={(e) =>
                    setValues((prev) => ({
                        ...prev,
                        [v.env_variable]: e.target.value,
                    }))
                }
            />
        );
    };

    if (loading) {
        return (
            <PageContentBlock title="Templates">
                <Spinner centered />
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
                                {categories.map((c) => (
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
                                                {t.name.slice(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="tpl-card__body">
                                            <div className="tpl-card__name">{t.name}</div>
                                            <div className="tpl-card__desc">{stripHtml(t.description)}</div>
                                            <div className="tpl-card__meta">
                                                {t.author} — {t.version}
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
                                <h2 className="tpl-detail__title">{selected.name}</h2>
                                {selected.full_description ? (
                                    <div className="tpl-detail__html">{renderHtml(selected.full_description)}</div>
                                ) : selected.description ? (
                                    <div className="tpl-detail__desc">{renderHtml(selected.description)}</div>
                                ) : null}

                                <div className="tpl-vars">
                                    {normalizeVariables(selected.variables).map((v) => (
                                        <div key={v.id} className="tpl-var">
                                            <label className="tpl-var__label" htmlFor={`var-${v.id}`}>
                                                {v.name}
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
                    <div className="tpl-modal-backdrop" onClick={() => setShowConfirm(false)}>
                        <div className="tpl-modal" onClick={(e) => e.stopPropagation()}>
                            <p>
                                Tem certeza que deseja instalar este template? Isso pode sobrescrever
                                arquivos existentes no servidor.
                            </p>
                            <div className="tpl-modal__actions">
                                <button type="button" className="tpl-btn tpl-btn--muted" onClick={() => setShowConfirm(false)}>
                                    Cancelar
                                </button>
                                <button type="button" className="tpl-btn tpl-btn--danger" onClick={handleInstall}>
                                    Confirmar
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

export default TemplatesSection;
