/**
 * MC Properties Manager — Dashboard Component
 * Blueprint Extension for Pterodactyl Panel
 *
 * Injects a "Properties" tab into the server dashboard that allows
 * users to read and write server.properties directly via the Wings API.
 */

import React, { useState, useEffect, useCallback, Fragment } from 'react';
import http from '@/api/http';
import { ServerContext } from '@/state/server';

// ─── Types ──────────────────────────────────────────────────────────────────

type PropType = 'boolean' | 'number' | 'string' | 'select';

interface PropertyDef {
    key: string;
    label: string;
    description: string;
    type: PropType;
    options?: string[];
    min?: number;
    max?: number;
    defaultValue: string;
    requiresRestart: boolean;
    category: Category;
}

type Category = 'General' | 'Gameplay' | 'World' | 'Performance' | 'Network' | 'Advanced';

// ─── Property Schema ─────────────────────────────────────────────────────────

const PROPERTIES: PropertyDef[] = [
    // ── General ──────────────────────────────────────────────────────────
    {
        key: 'motd',
        label: 'MOTD',
        description: 'Mensagem exibida na lista de servidores. Suporta formatação §.',
        type: 'string',
        defaultValue: 'A Minecraft Server',
        requiresRestart: false,
        category: 'General',
    },
    {
        key: 'server-name',
        label: 'Nome do Servidor',
        description: 'Nome do servidor exibido em alguns clientes (1.19.4+).',
        type: 'string',
        defaultValue: 'Dedicated Server',
        requiresRestart: true,
        category: 'General',
    },
    {
        key: 'server-port',
        label: 'Porta',
        description: 'Porta de conexão do servidor Minecraft (padrão: 25565).',
        type: 'number',
        min: 1,
        max: 65535,
        defaultValue: '25565',
        requiresRestart: true,
        category: 'General',
    },
    {
        key: 'online-mode',
        label: 'Modo Online (Auth Mojang)',
        description: 'Valida contas dos jogadores com os servidores da Mojang. Desativar permite contas crackeadas.',
        type: 'boolean',
        defaultValue: 'true',
        requiresRestart: true,
        category: 'General',
    },
    {
        key: 'white-list',
        label: 'Whitelist',
        description: 'Ativa a whitelist. Apenas jogadores na lista podem entrar.',
        type: 'boolean',
        defaultValue: 'false',
        requiresRestart: false,
        category: 'General',
    },
    {
        key: 'enforce-whitelist',
        label: 'Enforce Whitelist',
        description: 'Remove jogadores que não estão na whitelist quando ela é ativada durante a sessão.',
        type: 'boolean',
        defaultValue: 'false',
        requiresRestart: false,
        category: 'General',
    },

    // ── Gameplay ─────────────────────────────────────────────────────────
    {
        key: 'gamemode',
        label: 'Modo de Jogo Padrão',
        description: 'Modo de jogo que novos jogadores recebem ao entrar.',
        type: 'select',
        options: ['survival', 'creative', 'adventure', 'spectator'],
        defaultValue: 'survival',
        requiresRestart: false,
        category: 'Gameplay',
    },
    {
        key: 'difficulty',
        label: 'Dificuldade',
        description: 'Nível de dificuldade do servidor.',
        type: 'select',
        options: ['peaceful', 'easy', 'normal', 'hard'],
        defaultValue: 'easy',
        requiresRestart: false,
        category: 'Gameplay',
    },
    {
        key: 'hardcore',
        label: 'Modo Hardcore',
        description: 'Ativa o modo hardcore. Jogadores que morrerem ficam em modo espectador.',
        type: 'boolean',
        defaultValue: 'false',
        requiresRestart: true,
        category: 'Gameplay',
    },
    {
        key: 'pvp',
        label: 'PvP (Jogador vs. Jogador)',
        description: 'Permite que jogadores causem dano uns aos outros.',
        type: 'boolean',
        defaultValue: 'true',
        requiresRestart: false,
        category: 'Gameplay',
    },
    {
        key: 'spawn-protection',
        label: 'Raio de Proteção do Spawn',
        description: 'Raio em blocos ao redor do spawn protegido contra modificações. 0 = desativado.',
        type: 'number',
        min: 0,
        max: 29999984,
        defaultValue: '16',
        requiresRestart: false,
        category: 'Gameplay',
    },
    {
        key: 'allow-flight',
        label: 'Permitir Voo',
        description: 'Permite voo em servidores de sobrevivência. Pode ser usado para evitar kickar jogadores com mods de voo.',
        type: 'boolean',
        defaultValue: 'false',
        requiresRestart: false,
        category: 'Gameplay',
    },
    {
        key: 'allow-nether',
        label: 'Permitir Nether',
        description: 'Permite que jogadores entrem no Nether via portais.',
        type: 'boolean',
        defaultValue: 'true',
        requiresRestart: false,
        category: 'Gameplay',
    },
    {
        key: 'spawn-animals',
        label: 'Spawnar Animais',
        description: 'Permite o spawn de animais passivos (vacas, ovelhas, porcos etc.).',
        type: 'boolean',
        defaultValue: 'true',
        requiresRestart: false,
        category: 'Gameplay',
    },
    {
        key: 'spawn-monsters',
        label: 'Spawnar Monstros',
        description: 'Permite o spawn de monstros hostis (zumbis, esqueletos etc.).',
        type: 'boolean',
        defaultValue: 'true',
        requiresRestart: false,
        category: 'Gameplay',
    },
    {
        key: 'spawn-npcs',
        label: 'Spawnar NPCs (Aldeões)',
        description: 'Permite o spawn de aldeões e outros NPCs.',
        type: 'boolean',
        defaultValue: 'true',
        requiresRestart: false,
        category: 'Gameplay',
    },

    // ── World ────────────────────────────────────────────────────────────
    {
        key: 'level-name',
        label: 'Nome do Mundo',
        description: 'Nome da pasta do mundo. Alterar carrega/cria um mundo diferente.',
        type: 'string',
        defaultValue: 'world',
        requiresRestart: true,
        category: 'World',
    },
    {
        key: 'level-seed',
        label: 'Seed do Mundo',
        description: 'Seed para geração do mundo. Deixe em branco para seed aleatória.',
        type: 'string',
        defaultValue: '',
        requiresRestart: true,
        category: 'World',
    },
    {
        key: 'level-type',
        label: 'Tipo de Mundo',
        description: 'Tipo de geração do mundo.',
        type: 'select',
        options: ['minecraft:default', 'minecraft:flat', 'minecraft:large_biomes', 'minecraft:amplified', 'minecraft:single_biome_surface'],
        defaultValue: 'minecraft:default',
        requiresRestart: true,
        category: 'World',
    },
    {
        key: 'generate-structures',
        label: 'Gerar Estruturas',
        description: 'Permite a geração de estruturas do mundo (vilas, fortalezas, etc.).',
        type: 'boolean',
        defaultValue: 'true',
        requiresRestart: true,
        category: 'World',
    },
    {
        key: 'view-distance',
        label: 'Distância de Visão (chunks)',
        description: 'Quantidade de chunks enviados ao redor do jogador. Valores maiores aumentam o uso de RAM/CPU.',
        type: 'number',
        min: 3,
        max: 32,
        defaultValue: '10',
        requiresRestart: false,
        category: 'World',
    },
    {
        key: 'simulation-distance',
        label: 'Distância de Simulação (chunks)',
        description: 'Raio de chunks onde entidades e redstone são processados.',
        type: 'number',
        min: 3,
        max: 32,
        defaultValue: '10',
        requiresRestart: false,
        category: 'World',
    },
    {
        key: 'max-world-size',
        label: 'Tamanho Máximo do Mundo',
        description: 'Raio máximo do mundo em blocos a partir do centro (0,0). Mínimo: 1.',
        type: 'number',
        min: 1,
        max: 29999984,
        defaultValue: '29999984',
        requiresRestart: false,
        category: 'World',
    },
    {
        key: 'max-build-height',
        label: 'Altura Máxima de Construção',
        description: 'Altitude máxima onde blocos podem ser colocados (obsoleto em 1.18+, usa data packs).',
        type: 'number',
        min: 0,
        max: 2032,
        defaultValue: '256',
        requiresRestart: true,
        category: 'World',
    },

    // ── Performance ───────────────────────────────────────────────────────
    {
        key: 'max-players',
        label: 'Máximo de Jogadores',
        description: 'Número máximo de jogadores simultâneos no servidor.',
        type: 'number',
        min: 1,
        max: 2147483647,
        defaultValue: '20',
        requiresRestart: false,
        category: 'Performance',
    },
    {
        key: 'max-tick-time',
        label: 'Tempo Máximo de Tick (ms)',
        description: 'Tempo máximo em ms que um único tick pode levar antes do servidor ser considerado travado. -1 = desativado.',
        type: 'number',
        min: -1,
        max: 2147483647,
        defaultValue: '60000',
        requiresRestart: false,
        category: 'Performance',
    },
    {
        key: 'network-compression-threshold',
        label: 'Limiar de Compressão de Rede',
        description: 'Pacotes maiores que esse valor (bytes) são comprimidos. -1 = compressão desativada.',
        type: 'number',
        min: -1,
        max: 65535,
        defaultValue: '256',
        requiresRestart: true,
        category: 'Performance',
    },
    {
        key: 'entity-broadcast-range-percentage',
        label: 'Alcance de Broadcast de Entidades (%)',
        description: 'Porcentagem da distância padrão em que entidades são enviadas aos clientes. Menor = menos lag.',
        type: 'number',
        min: 10,
        max: 1000,
        defaultValue: '100',
        requiresRestart: false,
        category: 'Performance',
    },
    {
        key: 'sync-chunk-writes',
        label: 'Sync Chunk Writes',
        description: 'Força a escrita síncrona de chunks. Pode reduzir corrupcao de dados ao custo de performance.',
        type: 'boolean',
        defaultValue: 'true',
        requiresRestart: false,
        category: 'Performance',
    },
    {
        key: 'use-native-transport',
        label: 'Transporte Nativo (Linux)',
        description: 'Usa Netty epoll nativo no Linux para melhor performance de rede.',
        type: 'boolean',
        defaultValue: 'true',
        requiresRestart: true,
        category: 'Performance',
    },

    // ── Network ──────────────────────────────────────────────────────────
    {
        key: 'server-ip',
        label: 'IP do Servidor',
        description: 'IP ao qual o servidor faz bind. Deixe em branco para aceitar todas as interfaces.',
        type: 'string',
        defaultValue: '',
        requiresRestart: true,
        category: 'Network',
    },
    {
        key: 'enable-status',
        label: 'Habilitar Status (Ping)',
        description: 'Responde ao ping do launcher. Desativar oculta o servidor na lista.',
        type: 'boolean',
        defaultValue: 'true',
        requiresRestart: false,
        category: 'Network',
    },
    {
        key: 'enable-query',
        label: 'Habilitar Query (GameSpy4)',
        description: 'Ativa o protocolo GameSpy4 para ferramentas de monitoramento.',
        type: 'boolean',
        defaultValue: 'false',
        requiresRestart: true,
        category: 'Network',
    },
    {
        key: 'query.port',
        label: 'Porta Query',
        description: 'Porta do protocolo GameSpy4 (usado quando enable-query=true).',
        type: 'number',
        min: 1,
        max: 65535,
        defaultValue: '25565',
        requiresRestart: true,
        category: 'Network',
    },
    {
        key: 'enable-rcon',
        label: 'Habilitar RCON',
        description: 'Ativa o protocolo RCON para administração remota via linha de comando.',
        type: 'boolean',
        defaultValue: 'false',
        requiresRestart: true,
        category: 'Network',
    },
    {
        key: 'rcon.port',
        label: 'Porta RCON',
        description: 'Porta para conexões RCON (padrão: 25575).',
        type: 'number',
        min: 1,
        max: 65535,
        defaultValue: '25575',
        requiresRestart: true,
        category: 'Network',
    },
    {
        key: 'rcon.password',
        label: 'Senha RCON',
        description: 'Senha para autenticação RCON. Deixe em branco para desativar mesmo com RCON habilitado.',
        type: 'string',
        defaultValue: '',
        requiresRestart: true,
        category: 'Network',
    },

    // ── Advanced ─────────────────────────────────────────────────────────
    {
        key: 'enable-command-block',
        label: 'Habilitar Command Blocks',
        description: 'Permite o uso de command blocks no servidor.',
        type: 'boolean',
        defaultValue: 'false',
        requiresRestart: false,
        category: 'Advanced',
    },
    {
        key: 'force-gamemode',
        label: 'Forçar Modo de Jogo',
        description: 'Forçar todos os jogadores ao gamemode padrão ao entrar no servidor.',
        type: 'boolean',
        defaultValue: 'false',
        requiresRestart: false,
        category: 'Advanced',
    },
    {
        key: 'function-permission-level',
        label: 'Nível de Permissão de Functions',
        description: 'Nível de permissão de operador necessário para executar funções (1-4).',
        type: 'number',
        min: 1,
        max: 4,
        defaultValue: '2',
        requiresRestart: false,
        category: 'Advanced',
    },
    {
        key: 'op-permission-level',
        label: 'Nível de Permissão de OP',
        description: 'Nível de permissão dos operadores (1-4). Nível 4 = acesso total.',
        type: 'number',
        min: 1,
        max: 4,
        defaultValue: '4',
        requiresRestart: false,
        category: 'Advanced',
    },
    {
        key: 'player-idle-timeout',
        label: 'Timeout de Inatividade (min)',
        description: 'Minutos de inatividade antes de kickar o jogador. 0 = desativado.',
        type: 'number',
        min: 0,
        max: 2147483647,
        defaultValue: '0',
        requiresRestart: false,
        category: 'Advanced',
    },
    {
        key: 'log-ips',
        label: 'Registrar IPs nos Logs',
        description: 'Registra IPs dos jogadores nos logs do servidor.',
        type: 'boolean',
        defaultValue: 'true',
        requiresRestart: true,
        category: 'Advanced',
    },
    {
        key: 'resource-pack',
        label: 'URL do Resource Pack',
        description: 'URL de um resource pack para enviar aos clientes ao entrar.',
        type: 'string',
        defaultValue: '',
        requiresRestart: false,
        category: 'Advanced',
    },
    {
        key: 'resource-pack-sha1',
        label: 'SHA1 do Resource Pack',
        description: 'Hash SHA1 do resource pack para verificação de integridade.',
        type: 'string',
        defaultValue: '',
        requiresRestart: false,
        category: 'Advanced',
    },
    {
        key: 'require-resource-pack',
        label: 'Exigir Resource Pack',
        description: 'Desconecta jogadores que recusarem o resource pack.',
        type: 'boolean',
        defaultValue: 'false',
        requiresRestart: false,
        category: 'Advanced',
    },
    {
        key: 'resource-pack-prompt',
        label: 'Texto do Prompt do Resource Pack',
        description: 'Mensagem exibida no diálogo de resource pack (1.17+). Suporta JSON de texto.',
        type: 'string',
        defaultValue: '',
        requiresRestart: false,
        category: 'Advanced',
    },
];

// ─── Category Config ──────────────────────────────────────────────────────────

const CATEGORIES: { id: Category; label: string; icon: string; color: string; accent: string }[] = [
    { id: 'General',     label: 'General',     icon: '🌐', color: '#4CAF50', accent: 'rgba(76,175,80,0.15)'   },
    { id: 'Gameplay',    label: 'Gameplay',    icon: '🎮', color: '#89b4fa', accent: 'rgba(137,180,250,0.15)' },
    { id: 'World',       label: 'World',       icon: '🌍', color: '#a6e3a1', accent: 'rgba(166,227,161,0.15)' },
    { id: 'Performance', label: 'Performance', icon: '⚡', color: '#fab387', accent: 'rgba(250,179,135,0.15)' },
    { id: 'Network',     label: 'Network',     icon: '🔗', color: '#f38ba8', accent: 'rgba(243,168,168,0.15)' },
    { id: 'Advanced',    label: 'Advanced',    icon: '🔧', color: '#cba6f7', accent: 'rgba(203,166,247,0.15)' },
];

// ─── Utility ──────────────────────────────────────────────────────────────────

function parseProperties(content: string): Record<string, string> {
    const props: Record<string, string> = {};
    for (const line of content.split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const eq = t.indexOf('=');
        if (eq === -1) continue;
        props[t.slice(0, eq).trim()] = t.slice(eq + 1); // keep trailing spaces in value intentionally stripped
    }
    return props;
}

function serializeProperties(original: string, overrides: Record<string, string>): string {
    const updated = new Set<string>();
    const lines = original.split('\n').map(line => {
        const t = line.trim();
        if (!t || t.startsWith('#')) return line;
        const eq = t.indexOf('=');
        if (eq === -1) return line;
        const key = t.slice(0, eq).trim();
        if (key in overrides) {
            updated.add(key);
            return `${key}=${overrides[key]}`;
        }
        return line;
    });

    // Append any keys that were not in the original file
    for (const [k, v] of Object.entries(overrides)) {
        if (!updated.has(k)) lines.push(`${k}=${v}`);
    }
    return lines.join('\n');
}

// ─── Inline Styles ────────────────────────────────────────────────────────────

const S = {
    page: {
        minHeight: '100vh',
        background: 'transparent',
        padding: '0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#cdd6f4',
    } as React.CSSProperties,

    header: {
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0d1b2a 60%, #0f2c1a 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(76,175,80,0.2)',
        padding: '24px 28px',
        marginBottom: '20px',
        position: 'relative',
        overflow: 'hidden',
    } as React.CSSProperties,

    headerGlow: {
        position: 'absolute',
        top: '-60px',
        right: '-60px',
        width: '220px',
        height: '220px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(76,175,80,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
    } as React.CSSProperties,

    card: {
        background: '#1e1e2e',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.07)',
        overflow: 'hidden',
        marginBottom: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    } as React.CSSProperties,

    cardHeader: {
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        userSelect: 'none',
    } as React.CSSProperties,

    tabBar: {
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap' as const,
        marginBottom: '20px',
    } as React.CSSProperties,

    tab: (active: boolean, color: string, accent: string) => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        borderRadius: '8px',
        border: `1px solid ${active ? color + '55' : 'rgba(255,255,255,0.08)'}`,
        background: active ? accent : 'rgba(255,255,255,0.03)',
        color: active ? color : 'rgba(255,255,255,0.5)',
        fontWeight: active ? 600 : 400,
        fontSize: '13px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    }) as React.CSSProperties,

    propRow: {
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '16px',
        alignItems: 'center',
        transition: 'background 0.15s ease',
    } as React.CSSProperties,

    propLabel: {
        fontSize: '13px',
        fontWeight: 600,
        color: '#cdd6f4',
        marginBottom: '3px',
    } as React.CSSProperties,

    propDesc: {
        fontSize: '12px',
        color: 'rgba(255,255,255,0.38)',
        lineHeight: '1.5',
    } as React.CSSProperties,

    input: {
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '7px',
        color: '#cdd6f4',
        padding: '7px 12px',
        fontSize: '13px',
        outline: 'none',
        minWidth: '160px',
        transition: 'border-color 0.2s',
    } as React.CSSProperties,

    select: {
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '7px',
        color: '#cdd6f4',
        padding: '7px 12px',
        fontSize: '13px',
        outline: 'none',
        minWidth: '160px',
        cursor: 'pointer',
    } as React.CSSProperties,

    toggleWrap: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: '160px',
        justifyContent: 'flex-end',
    } as React.CSSProperties,

    toggleTrack: (on: boolean) => ({
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        background: on ? '#4CAF50' : 'rgba(255,255,255,0.12)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.25s ease',
        border: `2px solid ${on ? '#388e3c' : 'rgba(255,255,255,0.1)'}`,
        flexShrink: 0,
    }) as React.CSSProperties,

    toggleThumb: (on: boolean) => ({
        position: 'absolute',
        top: '2px',
        left: on ? '20px' : '2px',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.25s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
    }) as React.CSSProperties,

    saveBtn: (loading: boolean) => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '11px 28px',
        borderRadius: '9px',
        border: 'none',
        background: loading ? 'rgba(76,175,80,0.4)' : 'linear-gradient(135deg, #4CAF50, #388e3c)',
        color: '#fff',
        fontWeight: 700,
        fontSize: '14px',
        cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow: loading ? 'none' : '0 4px 16px rgba(76,175,80,0.35)',
        transition: 'all 0.25s ease',
        opacity: loading ? 0.7 : 1,
    }) as React.CSSProperties,

    resetBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '11px 20px',
        borderRadius: '9px',
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.04)',
        color: 'rgba(255,255,255,0.6)',
        fontWeight: 600,
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    } as React.CSSProperties,

    toast: (type: 'success' | 'error' | 'info') => ({
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        padding: '14px 20px',
        borderRadius: '10px',
        background: type === 'success' ? '#1b3a1f' : type === 'error' ? '#3a1b1b' : '#1b2a3a',
        border: `1px solid ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f38ba8' : '#89b4fa'}`,
        color: '#cdd6f4',
        fontSize: '14px',
        fontWeight: 500,
        zIndex: 9999,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        maxWidth: '380px',
        animation: 'slideIn 0.3s ease',
    }) as React.CSSProperties,

    restartBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '4px',
        background: 'rgba(250,179,135,0.12)',
        border: '1px solid rgba(250,179,135,0.3)',
        color: '#fab387',
        fontSize: '10px',
        fontWeight: 600,
        marginLeft: '8px',
    } as React.CSSProperties,

    spinner: {
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: '#fff',
        animation: 'spin 0.7s linear infinite',
        display: 'inline-block',
    } as React.CSSProperties,
};

// ─── Toggle Component ─────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <div
            style={S.toggleTrack(value)}
            onClick={() => onChange(!value)}
            role='switch'
            aria-checked={value}
        >
            <div style={S.toggleThumb(value)} />
        </div>
    );
}

// ─── Property Row ─────────────────────────────────────────────────────────────

function PropRow({
    def,
    value,
    onChange,
}: {
    def: PropertyDef;
    value: string;
    onChange: (key: string, val: string) => void;
}) {
    const [hovered, setHovered] = useState(false);

    const boolVal = value.toLowerCase() === 'true';

    return (
        <div
            style={{ ...S.propRow, background: hovered ? 'rgba(255,255,255,0.025)' : 'transparent' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Label + desc */}
            <div>
                <div style={S.propLabel}>
                    {def.label}
                    {def.requiresRestart && (
                        <span style={S.restartBadge}>⚠ restart</span>
                    )}
                </div>
                <div style={S.propDesc}>{def.description}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.22)', marginTop: '3px', fontFamily: 'monospace' }}>
                    {def.key}
                </div>
            </div>

            {/* Input */}
            <div style={S.toggleWrap}>
                {def.type === 'boolean' && (
                    <Fragment>
                        <span style={{ fontSize: '12px', color: boolVal ? '#4CAF50' : 'rgba(255,255,255,0.35)' }}>
                            {boolVal ? 'Enabled' : 'Disabled'}
                        </span>
                        <Toggle value={boolVal} onChange={v => onChange(def.key, String(v))} />
                    </Fragment>
                )}

                {def.type === 'select' && (
                    <select
                        style={S.select}
                        value={value || def.defaultValue}
                        onChange={e => onChange(def.key, e.target.value)}
                    >
                        {def.options!.map(opt => (
                            <option key={opt} value={opt} style={{ background: '#1e1e2e' }}>
                                {opt}
                            </option>
                        ))}
                    </select>
                )}

                {def.type === 'number' && (
                    <input
                        type='number'
                        style={S.input}
                        value={value || def.defaultValue}
                        min={def.min}
                        max={def.max}
                        onChange={e => onChange(def.key, e.target.value)}
                        onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#4CAF5055'; }}
                        onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.12)'; }}
                    />
                )}

                {def.type === 'string' && (
                    <input
                        type={def.key === 'rcon.password' ? 'password' : 'text'}
                        style={{ ...S.input, minWidth: '200px' }}
                        value={value}
                        placeholder={def.defaultValue || '(em branco)'}
                        onChange={e => onChange(def.key, e.target.value)}
                        onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#4CAF5055'; }}
                        onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.12)'; }}
                    />
                )}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function McPropertiesManager() {
    const uuid = ServerContext.useStoreState(s => s.server.data?.uuid ?? '');

    const [rawContent, setRawContent]   = useState<string | null>(null);
    const [values, setValues]           = useState<Record<string, string>>({});
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(false);
    const [error, setError]             = useState<string | null>(null);
    const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [activeTab, setActiveTab]     = useState<Category>('General');
    const [hasChanges, setHasChanges]   = useState(false);

    // ── Fetch ─────────────────────────────────────────────────────────────

    const fetchProperties = useCallback(async () => {
        if (!uuid) return;
        setLoading(true);
        setError(null);
        try {
            const res = await http.get(`/api/client/servers/${uuid}/files/contents`, {
                params: { file: '/server.properties' },
                responseType: 'text',
                transformRequest: [],
                transformResponse: [(data: unknown) => data],
            });
            const text = typeof res.data === 'string' ? res.data : String(res.data);
            setRawContent(text);
            setValues(parseProperties(text));
            setHasChanges(false);
        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : 'Não foi possível ler o server.properties. Verifique se o servidor está configurado corretamente.';
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    }, [uuid]);

    useEffect(() => { fetchProperties(); }, [fetchProperties]);

    // ── Toast ─────────────────────────────────────────────────────────────

    function showToast(msg: string, type: 'success' | 'error' | 'info') {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4500);
    }

    // ── Change handler ────────────────────────────────────────────────────

    function handleChange(key: string, val: string) {
        setValues(prev => ({ ...prev, [key]: val }));
        setHasChanges(true);
    }

    // ── Save ──────────────────────────────────────────────────────────────

    async function handleSave() {
        if (!uuid || !rawContent || saving) return;
        setSaving(true);
        try {
            const newContent = serializeProperties(rawContent, values);
            await http.post(
                `/api/client/servers/${uuid}/files/write`,
                newContent,
                {
                    params: { file: '/server.properties' },
                    headers: { 'Content-Type': 'text/plain' },
                }
            );
            setRawContent(newContent);
            setHasChanges(false);
            showToast('✅ server.properties salvo com sucesso! Reinicie o servidor para aplicar as mudanças.', 'success');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro ao salvar o arquivo.';
            showToast(`❌ ${msg}`, 'error');
        } finally {
            setSaving(false);
        }
    }

    // ── Reset ─────────────────────────────────────────────────────────────

    function handleReset() {
        if (rawContent) {
            setValues(parseProperties(rawContent));
            setHasChanges(false);
            showToast('🔄 Alterações descartadas.', 'info');
        }
    }

    // ─────────────────────────────────────────────────────────────────────

    const catDef    = CATEGORIES.find(c => c.id === activeTab)!;
    const catProps  = PROPERTIES.filter(p => p.category === activeTab);
    const restartCount = catProps.filter(p => p.requiresRestart && values[p.key] !== undefined).length;

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <div style={S.page}>
            {/* Keyframes injected via style tag */}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes slideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
            `}</style>

            {/* ── Header ── */}
            <div style={S.header}>
                <div style={S.headerGlow} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '36px', lineHeight: 1 }}>⚙️</div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#cdd6f4', letterSpacing: '-0.3px' }}>
                            MC Properties Manager
                        </h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
                            Edite o <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '4px', color: '#89b4fa', fontSize: '11px' }}>server.properties</code> do seu servidor Minecraft Java diretamente pelo painel.
                        </p>
                    </div>
                    <button
                        style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '12px',
                            cursor: 'pointer',
                        }}
                        onClick={fetchProperties}
                        disabled={loading}
                    >
                        🔄 Recarregar
                    </button>
                </div>
            </div>

            {/* ── Loading ── */}
            {loading && (
                <div style={{ ...S.card, padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '40px', marginBottom: '16px', animation: 'pulse 1.5s ease infinite' }}>📄</div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>Lendo server.properties...</p>
                </div>
            )}

            {/* ── Error ── */}
            {!loading && error && (
                <div style={{ ...S.card, padding: '40px 24px', textAlign: 'center', borderColor: 'rgba(243,139,168,0.3)' }}>
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>❌</div>
                    <p style={{ color: '#f38ba8', fontWeight: 600, margin: '0 0 8px 0' }}>Não foi possível carregar o arquivo</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '0 0 20px 0' }}>{error}</p>
                    <button
                        style={S.saveBtn(false)}
                        onClick={fetchProperties}
                    >
                        🔄 Tentar Novamente
                    </button>
                </div>
            )}

            {/* ── Main Content ── */}
            {!loading && !error && (
                <Fragment>
                    {/* Category Tabs */}
                    <div style={S.tabBar}>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                style={S.tab(activeTab === cat.id, cat.color, cat.accent)}
                                onClick={() => setActiveTab(cat.id)}
                            >
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                                <span style={{
                                    fontSize: '11px',
                                    background: activeTab === cat.id ? cat.color + '30' : 'rgba(255,255,255,0.08)',
                                    padding: '1px 6px',
                                    borderRadius: '10px',
                                }}>
                                    {PROPERTIES.filter(p => p.category === cat.id).length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Properties Card */}
                    <div style={S.card}>
                        {/* Card Header */}
                        <div style={{ ...S.cardHeader, cursor: 'default' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '20px' }}>{catDef.icon}</span>
                                <span style={{ fontWeight: 700, color: catDef.color, fontSize: '15px' }}>
                                    {catDef.label}
                                </span>
                                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                                    — {catProps.length} propriedades
                                </span>
                            </div>
                            {restartCount > 0 && (
                                <span style={S.restartBadge}>
                                    ⚠ {restartCount} requer restart
                                </span>
                            )}
                        </div>

                        {/* Property Rows */}
                        {catProps.map(def => (
                            <PropRow
                                key={def.key}
                                def={def}
                                value={values[def.key] ?? def.defaultValue}
                                onChange={handleChange}
                            />
                        ))}
                    </div>

                    {/* ── Restart notice ── */}
                    {catProps.some(p => p.requiresRestart) && (
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            background: 'rgba(250,179,135,0.06)',
                            border: '1px solid rgba(250,179,135,0.2)',
                            color: 'rgba(255,255,255,0.55)',
                            fontSize: '13px',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <span>⚠️</span>
                            <span>Propriedades marcadas com <strong style={{ color: '#fab387' }}>restart</strong> requerem reinicialização do servidor para ter efeito.</span>
                        </div>
                    )}

                    {/* ── Action Bar ── */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        padding: '20px 0 8px 0',
                        flexWrap: 'wrap',
                    }}>
                        <button style={S.saveBtn(saving)} onClick={handleSave} disabled={saving}>
                            {saving
                                ? <Fragment><div style={S.spinner} /> Salvando...</Fragment>
                                : <Fragment>💾 Salvar Propriedades</>
                            }
                        </button>

                        {hasChanges && (
                            <button style={S.resetBtn} onClick={handleReset}>
                                ↩ Descartar
                            </button>
                        )}

                        {hasChanges && (
                            <span style={{ fontSize: '12px', color: '#fab387', fontWeight: 500 }}>
                                • Há alterações não salvas
                            </span>
                        )}
                    </div>
                </Fragment>
            )}

            {/* ── Toast ── */}
            {toast && (
                <div style={S.toast(toast.type)}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
