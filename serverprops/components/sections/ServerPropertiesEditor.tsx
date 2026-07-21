import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ServerContext } from '@/state/server';
import http from '@/api/http';
import Spinner from '@/components/elements/Spinner';

interface PropertiesResponse {
    success: boolean;
    data?: {
        properties: Record<string, string>;
    };
    message?: string;
}

const LABELS_PT: Record<string, string> = {
    'accepts-transfers': 'Aceitar transferências',
    'allow-flight': 'Permitir voo',
    'allow-nether': 'Permitir Nether',
    'broadcast-console-to-ops': 'Enviar console para ops',
    'broadcast-rcon-to-ops': 'Enviar RCON para ops',
    'bug-report-link': 'Link de relatório de bugs',
    'debug': 'Modo debug',
    'difficulty': 'Dificuldade',
    'enable-command-block': 'Blocos de comando',
    'enable-jmx-monitoring': 'Monitoramento JMX',
    'enable-query': 'Ativar Query',
    'enable-rcon': 'Ativar RCON',
    'enable-status': 'Status do servidor',
    'enforce-secure-profile': 'Perfil seguro obrigatório',
    'enforce-whitelist': 'Forçar whitelist',
    'entity-broadcast-range-percentage': 'Alcance de broadcast de entidades (%)',
    'force-gamemode': 'Forçar modo de jogo',
    'function-permission-level': 'Nível de permissão de funções',
    'gamemode': 'Modo de jogo',
    'generate-structures': 'Gerar estruturas',
    'generator-settings': 'Configurações do gerador',
    'hardcore': 'Hardcore',
    'hide-online-players': 'Ocultar jogadores online',
    'initial-disabled-packs': 'Packs desativados iniciais',
    'initial-enabled-packs': 'Packs ativados iniciais',
    'level-name': 'Nome do mundo',
    'level-seed': 'Seed do mundo',
    'level-type': 'Tipo de mundo',
    'log-ips': 'Registrar IPs',
    'max-chained-neighbor-updates': 'Máx. updates encadeados',
    'max-players': 'Máximo de jogadores',
    'max-tick-time': 'Tempo máximo por tick (ms)',
    'max-world-size': 'Tamanho máximo do mundo',
    'motd': 'MOTD',
    'network-compression-threshold': 'Compressão de rede',
    'online-mode': 'Modo online (Mojang)',
    'op-permission-level': 'Nível de permissão de OP',
    'player-idle-timeout': 'Timeout AFK (min)',
    'prevent-proxy-connections': 'Bloquear conexões proxy',
    'pvp': 'PvP',
    'query.port': 'Porta Query',
    'rate-limit': 'Limite de taxa',
    'rcon.password': 'Senha RCON',
    'rcon.port': 'Porta RCON',
    'region-file-compression': 'Compressão de região',
    'require-resource-pack': 'Exigir resource pack',
    'resource-pack': 'Resource pack',
    'resource-pack-id': 'ID do resource pack',
    'resource-pack-prompt': 'Mensagem do resource pack',
    'resource-pack-sha1': 'SHA1 do resource pack',
    'server-ip': 'IP do servidor',
    'server-port': 'Porta do servidor',
    'simulation-distance': 'Distância de simulação',
    'spawn-animals': 'Spawnar animais',
    'spawn-monsters': 'Spawnar monstros',
    'spawn-npcs': 'Spawnar NPCs',
    'spawn-protection': 'Proteção do spawn',
    'sync-chunk-writes': 'Sincronizar escrita de chunks',
    'text-filtering-config': 'Filtro de texto',
    'use-native-transport': 'Transporte nativo',
    'view-distance': 'Distância de visão',
    'white-list': 'Whitelist',
};

const formatLabel = (key: string): string => {
    if (LABELS_PT[key]) return LABELS_PT[key];

    return key
        .replace(/[-_.]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
};

/** Só true/false exatos viram toggle. Qualquer outro valor = texto. */
const isBooleanValue = (value: string): boolean => {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === 'false';
};

const ServerPropertiesEditor = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [properties, setProperties] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [dirty, setDirty] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        window.setTimeout(() => setToast(null), 3500);
    };

    const loadProperties = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { data } = await http.get<PropertiesResponse>(
                `/api/client/extensions/serverprops/servers/${uuid}/properties`
            );

            if (data.success && data.data) {
                // Apenas chaves que existem no server.properties do servidor
                setProperties({ ...data.data.properties });
                setDirty(false);
            } else {
                setError(data.message || 'Não foi possível carregar as propriedades.');
            }
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                    'Arquivo server.properties não encontrado neste servidor.'
            );
        } finally {
            setLoading(false);
        }
    }, [uuid]);

    useEffect(() => {
        loadProperties();
    }, [loadProperties]);

    const updateProperty = (key: string, value: string) => {
        setProperties((prev) => ({ ...prev, [key]: value }));
        setDirty(true);
    };

    const handleSave = async () => {
        setSaving(true);

        try {
            const { data } = await http.post(
                `/api/client/extensions/serverprops/servers/${uuid}/properties`,
                { properties }
            );

            if (data.success) {
                setDirty(false);
                showToast('success', 'Configurações salvas com sucesso!');
            } else {
                showToast('error', data.message || 'Falha ao salvar.');
            }
        } catch (err: any) {
            showToast(
                'error',
                err?.response?.data?.message || 'Erro ao salvar o server.properties.'
            );
        } finally {
            setSaving(false);
        }
    };

    const filteredKeys = useMemo(() => {
        const query = search.trim().toLowerCase();
        // Só as chaves que vieram do arquivo
        const keys = Object.keys(properties).sort((a, b) => a.localeCompare(b));

        if (!query) return keys;

        return keys.filter((key) => {
            const label = formatLabel(key).toLowerCase();
            const value = (properties[key] || '').toLowerCase();
            return (
                key.toLowerCase().includes(query) ||
                label.includes(query) ||
                value.includes(query)
            );
        });
    }, [properties, search]);

    if (loading) {
        return (
            <div className={'mh-loading'}>
                <Spinner size={'large'} />
                <span>Carregando configurações...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={'mh-alert mh-alert--error'}>
                <p>{error}</p>
                <button type={'button'} className={'mh-btn mh-btn--ghost'} onClick={loadProperties}>
                    Tentar novamente
                </button>
            </div>
        );
    }

    return (
        <div className={'mh-configs'}>
            {toast && (
                <div className={`mh-toast mh-toast--${toast.type}`} role={'status'}>
                    <span className={'mh-toast__icon'}>{toast.type === 'success' ? '✓' : '!'}</span>
                    <span>{toast.message}</span>
                </div>
            )}

            <div className={'mh-toolbar'}>
                <div className={'mh-file'}>
                    <span>server.properties</span>
                </div>

                <div className={'mh-search'}>
                    <input
                        type={'text'}
                        placeholder={'Buscar...'}
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
                    {saving ? 'Salvando...' : 'Salvar'}
                </button>
            </div>

            {filteredKeys.length === 0 ? (
                <div className={'mh-empty'}>
                    {search
                        ? 'Nenhuma propriedade encontrada para esta busca.'
                        : 'Nenhuma propriedade encontrada no server.properties.'}
                </div>
            ) : (
                <div className={'mh-grid'}>
                    {filteredKeys.map((key) => {
                        const value = properties[key] ?? '';
                        const booleanField = isBooleanValue(value);
                        const isOn = value.trim().toLowerCase() === 'true';

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
