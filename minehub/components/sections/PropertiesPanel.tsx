import React, { useCallback, useEffect, useMemo, useState } from 'react';
import http, { httpErrorToHuman } from '@/api/http';
import { getProperty, propertyAsBoolean, setProperty } from '../lib/serverProperties';
import {
    Button,
    Content,
    EmptyState,
    Field,
    Group,
    GroupHeading,
    Heading,
    Input,
    LoadingState,
    Notice,
    Panel,
    PanelHeader,
    PropertiesGrid,
    PropertyCard,
    Select,
    Spinner,
    Textarea,
    Toggle,
    ToggleRow,
    Toolbar,
} from '../styles';

interface PropertiesPanelProps {
    serverIdentifier: string;
    canRead: boolean;
    canUpdate: boolean;
}

type FieldDefinition =
    | {
          key: string;
          label: string;
          description: string;
          type: 'text' | 'number';
          placeholder?: string;
          min?: number;
          max?: number;
      }
    | {
          key: string;
          label: string;
          description: string;
          type: 'select';
          options: Array<{ value: string; label: string }>;
      }
    | {
          key: string;
          label: string;
          description: string;
          type: 'toggle';
          fallback?: boolean;
      };

interface PropertyGroup {
    title: string;
    description: string;
    fields: FieldDefinition[];
}

const groups: PropertyGroup[] = [
    {
        title: 'Informações e jogadores',
        description: 'Identidade do servidor e limites principais.',
        fields: [
            {
                key: 'motd',
                label: 'Mensagem do servidor (MOTD)',
                description: 'Texto exibido na lista de servidores do Minecraft.',
                type: 'text',
                placeholder: 'Um servidor Minecraft',
            },
            {
                key: 'max-players',
                label: 'Máximo de jogadores',
                description: 'Quantidade máxima de conexões simultâneas.',
                type: 'number',
                min: 1,
                max: 10000,
            },
            {
                key: 'player-idle-timeout',
                label: 'Expulsar por inatividade',
                description: 'Minutos até expulsar um jogador inativo. Use 0 para desativar.',
                type: 'number',
                min: 0,
                max: 1440,
            },
            {
                key: 'hide-online-players',
                label: 'Ocultar jogadores online',
                description: 'Não envia a lista de jogadores na consulta de status.',
                type: 'toggle',
            },
        ],
    },
    {
        title: 'Jogabilidade',
        description: 'Regras aplicadas ao mundo e aos jogadores.',
        fields: [
            {
                key: 'gamemode',
                label: 'Modo de jogo',
                description: 'Modo padrão para novos jogadores.',
                type: 'select',
                options: [
                    { value: 'survival', label: 'Sobrevivência' },
                    { value: 'creative', label: 'Criativo' },
                    { value: 'adventure', label: 'Aventura' },
                    { value: 'spectator', label: 'Espectador' },
                ],
            },
            {
                key: 'difficulty',
                label: 'Dificuldade',
                description: 'Dificuldade padrão do mundo.',
                type: 'select',
                options: [
                    { value: 'peaceful', label: 'Pacífico' },
                    { value: 'easy', label: 'Fácil' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'hard', label: 'Difícil' },
                ],
            },
            {
                key: 'pvp',
                label: 'PvP',
                description: 'Permite dano entre jogadores.',
                type: 'toggle',
                fallback: true,
            },
            {
                key: 'hardcore',
                label: 'Modo hardcore',
                description: 'Morte permanente e dificuldade elevada.',
                type: 'toggle',
            },
            {
                key: 'allow-flight',
                label: 'Permitir voo',
                description: 'Evita expulsar jogadores detectados voando.',
                type: 'toggle',
            },
            {
                key: 'enable-command-block',
                label: 'Command blocks',
                description: 'Ativa blocos de comando no servidor.',
                type: 'toggle',
            },
        ],
    },
    {
        title: 'Mundo',
        description: 'Geração, seed e distâncias de carregamento.',
        fields: [
            {
                key: 'level-name',
                label: 'Nome da pasta do mundo',
                description: 'Diretório usado para armazenar o mundo.',
                type: 'text',
                placeholder: 'world',
            },
            {
                key: 'level-seed',
                label: 'Seed',
                description: 'Usada apenas quando um novo mundo é gerado.',
                type: 'text',
                placeholder: 'Aleatória',
            },
            {
                key: 'level-type',
                label: 'Tipo de mundo',
                description: 'Ex.: minecraft:normal, minecraft:flat ou minecraft:large_biomes.',
                type: 'text',
                placeholder: 'minecraft:normal',
            },
            {
                key: 'spawn-protection',
                label: 'Proteção do spawn',
                description: 'Raio protegido ao redor do spawn. Use 0 para desativar.',
                type: 'number',
                min: 0,
                max: 1000,
            },
            {
                key: 'view-distance',
                label: 'Distância de visão',
                description: 'Chunks enviados aos jogadores. Valores altos usam mais recursos.',
                type: 'number',
                min: 2,
                max: 32,
            },
            {
                key: 'simulation-distance',
                label: 'Distância de simulação',
                description: 'Chunks onde entidades e redstone continuam ativos.',
                type: 'number',
                min: 2,
                max: 32,
            },
            {
                key: 'generate-structures',
                label: 'Gerar estruturas',
                description: 'Gera vilas, templos e outras estruturas.',
                type: 'toggle',
                fallback: true,
            },
        ],
    },
    {
        title: 'Acesso e segurança',
        description: 'Autenticação, whitelist e perfis assinados.',
        fields: [
            {
                key: 'online-mode',
                label: 'Modo online',
                description: 'Valida as contas nos serviços oficiais. Recomendado manter ativado.',
                type: 'toggle',
                fallback: true,
            },
            {
                key: 'enforce-secure-profile',
                label: 'Exigir perfil seguro',
                description: 'Exige chave pública assinada para os jogadores.',
                type: 'toggle',
                fallback: true,
            },
            {
                key: 'white-list',
                label: 'Whitelist',
                description: 'Permite somente jogadores incluídos na whitelist.',
                type: 'toggle',
            },
            {
                key: 'enforce-whitelist',
                label: 'Forçar whitelist',
                description: 'Remove jogadores que deixarem de estar autorizados.',
                type: 'toggle',
            },
            {
                key: 'prevent-proxy-connections',
                label: 'Bloquear conexões por proxy',
                description: 'Compara a rede da conta com a conexão atual.',
                type: 'toggle',
            },
        ],
    },
    {
        title: 'Rede e desempenho',
        description: 'Ajustes avançados que afetam consumo e comunicação.',
        fields: [
            {
                key: 'network-compression-threshold',
                label: 'Limite de compressão',
                description: 'Tamanho mínimo em bytes para comprimir pacotes. -1 desativa.',
                type: 'number',
                min: -1,
                max: 65535,
            },
            {
                key: 'entity-broadcast-range-percentage',
                label: 'Alcance de entidades (%)',
                description: 'Percentual do alcance padrão de envio de entidades.',
                type: 'number',
                min: 10,
                max: 1000,
            },
            {
                key: 'max-tick-time',
                label: 'Tempo máximo de tick',
                description: 'Watchdog em milissegundos. -1 desativa a verificação.',
                type: 'number',
                min: -1,
            },
            {
                key: 'sync-chunk-writes',
                label: 'Gravação síncrona de chunks',
                description: 'Mais segurança nos dados, com possível custo de desempenho.',
                type: 'toggle',
                fallback: true,
            },
            {
                key: 'use-native-transport',
                label: 'Transporte nativo',
                description: 'Usa otimizações de rede nativas disponíveis no Linux.',
                type: 'toggle',
                fallback: true,
            },
        ],
    },
];

const PropertiesPanel = ({ serverIdentifier, canRead, canUpdate }: PropertiesPanelProps) => {
    const [content, setContent] = useState('');
    const [savedContent, setSavedContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [advanced, setAdvanced] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const dirty = content !== savedContent;

    const load = useCallback(async () => {
        if (!canRead) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { data } = await http.get(`/api/client/servers/${serverIdentifier}/files/contents`, {
                params: { file: '/server.properties' },
                responseType: 'text',
                transformResponse: [(response) => response],
            });
            const value = String(data);
            setContent(value);
            setSavedContent(value);
        } catch (requestError) {
            setError(httpErrorToHuman(requestError));
        } finally {
            setLoading(false);
        }
    }, [canRead, serverIdentifier]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        if (!dirty) return;

        const warnBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', warnBeforeUnload);

        return () => window.removeEventListener('beforeunload', warnBeforeUnload);
    }, [dirty]);

    const save = async () => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await http.post(`/api/client/servers/${serverIdentifier}/files/write`, content, {
                params: { file: '/server.properties' },
                headers: { 'Content-Type': 'text/plain' },
            });
            setSavedContent(content);
            setSuccess('Configurações salvas. Reinicie o servidor para aplicar todas as alterações.');
        } catch (requestError) {
            setError(httpErrorToHuman(requestError));
        } finally {
            setSaving(false);
        }
    };

    const update = (key: string, value: string) => {
        setContent((current) => setProperty(current, key, value));
        setSuccess('');
    };

    const configuredCount = useMemo(
        () =>
            groups.reduce(
                (count, group) =>
                    count +
                    group.fields.filter((field) => getProperty(content, field.key, '') !== '').length,
                0
            ),
        [content]
    );

    const renderField = (field: FieldDefinition) => {
        const id = `minehub-property-${field.key}`;

        if (field.type === 'toggle') {
            const checked = propertyAsBoolean(content, field.key, field.fallback);

            return (
                <PropertyCard key={field.key}>
                    <ToggleRow>
                        <div>
                            <Field as="span" id={`${id}-label`}>
                                {field.label}
                            </Field>
                            <p>{field.description}</p>
                        </div>
                        <Toggle
                            type="button"
                            role="switch"
                            aria-checked={checked}
                            aria-labelledby={`${id}-label`}
                            $checked={checked}
                            onClick={() => update(field.key, checked ? 'false' : 'true')}
                        />
                    </ToggleRow>
                </PropertyCard>
            );
        }

        if (field.type === 'select') {
            const fallback = field.options[0]?.value ?? '';
            return (
                <PropertyCard key={field.key}>
                    <Field htmlFor={id}>
                        {field.label}
                        <Select
                            id={id}
                            value={getProperty(content, field.key, fallback)}
                            onChange={(event) => update(field.key, event.currentTarget.value)}
                        >
                            {field.options.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                    </Field>
                    <p>{field.description}</p>
                </PropertyCard>
            );
        }

        return (
            <PropertyCard key={field.key}>
                <Field htmlFor={id}>
                    {field.label}
                    <Input
                        id={id}
                        type={field.type}
                        value={getProperty(content, field.key, '')}
                        placeholder={field.placeholder}
                        min={field.type === 'number' ? field.min : undefined}
                        max={field.type === 'number' ? field.max : undefined}
                        onChange={(event) => update(field.key, event.currentTarget.value)}
                    />
                </Field>
                <p>{field.description}</p>
            </PropertyCard>
        );
    };

    return (
        <Panel>
            <PanelHeader>
                <Heading>
                    <h2>Editor do server.properties</h2>
                    <p>
                        {configuredCount} opções detectadas · comentários e propriedades desconhecidas são
                        preservados.
                    </p>
                </Heading>
                <Toolbar>
                    <Button
                        type="button"
                        $variant="secondary"
                        onClick={() => {
                            if (!dirty || window.confirm('Descartar as alterações que ainda não foram salvas?')) {
                                void load();
                            }
                        }}
                        disabled={loading || saving || !canRead}
                    >
                        Recarregar
                    </Button>
                    <Button
                        type="button"
                        $variant="secondary"
                        onClick={() => setAdvanced((value) => !value)}
                        disabled={loading}
                    >
                        {advanced ? 'Editor visual' : 'Modo avançado'}
                    </Button>
                    <Button type="button" onClick={() => void save()} disabled={!dirty || saving || !canUpdate}>
                        {saving ? <Spinner /> : 'Salvar alterações'}
                    </Button>
                </Toolbar>
            </PanelHeader>

            <Content>
                {!canRead ? (
                    <Notice $tone="warning">
                        Você precisa da permissão <code>file.read-content</code> para abrir este arquivo.
                    </Notice>
                ) : null}
                {!canUpdate ? (
                    <Notice $tone="warning">
                        O modo é somente leitura. A permissão <code>file.update</code> é necessária para salvar.
                    </Notice>
                ) : null}
                {error ? <Notice $tone="danger">{error}</Notice> : null}
                {success ? <Notice $tone="success">{success}</Notice> : null}
                {dirty ? (
                    <Notice $tone="info">
                        Existem alterações não salvas. O arquivo só será modificado ao clicar em salvar.
                    </Notice>
                ) : null}

                {loading ? (
                    <LoadingState>
                        <Spinner aria-label="Carregando server.properties" />
                    </LoadingState>
                ) : !canRead || (!content && error) ? (
                    <EmptyState>
                        <div>
                            <strong>Arquivo indisponível</strong>
                            <p>
                                Inicie o servidor pelo menos uma vez para gerar o server.properties e confira
                                suas permissões de arquivos.
                            </p>
                        </div>
                    </EmptyState>
                ) : advanced ? (
                    <>
                        <Notice $tone="warning">
                            O modo avançado edita o arquivo completo. Uma linha inválida pode impedir o servidor
                            de iniciar corretamente.
                        </Notice>
                        <Field htmlFor="minehub-raw-properties">
                            Conteúdo bruto
                            <Textarea
                                id="minehub-raw-properties"
                                value={content}
                                spellCheck={false}
                                onChange={(event) => {
                                    setContent(event.currentTarget.value);
                                    setSuccess('');
                                }}
                            />
                        </Field>
                    </>
                ) : (
                    groups.map((group) => (
                        <Group key={group.title}>
                            <GroupHeading>
                                <h3>{group.title}</h3>
                                <p>{group.description}</p>
                            </GroupHeading>
                            <PropertiesGrid>{group.fields.map(renderField)}</PropertiesGrid>
                        </Group>
                    ))
                )}
            </Content>
        </Panel>
    );
};

export default PropertiesPanel;
