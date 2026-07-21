import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCode,
    faFloppyDisk,
    faGaugeHigh,
    faGlobe,
    faPlus,
    faRotate,
    faServer,
    faShieldHalved,
    faTrash,
} from '@fortawesome/free-solid-svg-icons';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import Select from '@/components/elements/Select';
import Spinner from '@/components/elements/Spinner';
import Can from '@/components/elements/Can';
import { Button } from '@/components/elements/button';
import { UiAlert } from '@blueprint/ui';
import { httpErrorToHuman } from '@/api/http';
import { Panel, SettingCard, SettingGrid } from './styles';
import { getServerProperties, updateServerProperties } from './api';

interface Props {
    uuid: string;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

interface SettingDefinition {
    key: string;
    label: string;
    description: string;
    type: 'text' | 'number' | 'boolean' | 'select';
    defaultValue: string;
    options?: Array<{ value: string; label: string }>;
    min?: number;
    max?: number;
}

const settings: SettingDefinition[] = [
    {
        key: 'motd',
        label: 'Mensagem do servidor',
        description: 'Texto exibido na lista de servidores.',
        type: 'text',
        defaultValue: 'A Minecraft Server',
    },
    {
        key: 'gamemode',
        label: 'Modo de jogo',
        description: 'Modo aplicado aos novos jogadores.',
        type: 'select',
        defaultValue: 'survival',
        options: ['survival', 'creative', 'adventure', 'spectator'].map((value) => ({ value, label: value })),
    },
    {
        key: 'difficulty',
        label: 'Dificuldade',
        description: 'Define o nível de dificuldade do mundo.',
        type: 'select',
        defaultValue: 'easy',
        options: ['peaceful', 'easy', 'normal', 'hard'].map((value) => ({ value, label: value })),
    },
    {
        key: 'max-players',
        label: 'Máximo de jogadores',
        description: 'Quantidade máxima de conexões simultâneas.',
        type: 'number',
        defaultValue: '20',
        min: 1,
        max: 100000,
    },
    {
        key: 'view-distance',
        label: 'Distância de visão',
        description: 'Quantidade de chunks enviados ao jogador.',
        type: 'number',
        defaultValue: '10',
        min: 2,
        max: 32,
    },
    {
        key: 'simulation-distance',
        label: 'Distância de simulação',
        description: 'Quantidade de chunks com entidades ativas.',
        type: 'number',
        defaultValue: '10',
        min: 2,
        max: 32,
    },
    {
        key: 'online-mode',
        label: 'Modo online',
        description: 'Valida as contas dos jogadores com a Mojang.',
        type: 'boolean',
        defaultValue: 'true',
    },
    {
        key: 'pvp',
        label: 'PvP',
        description: 'Permite combate entre jogadores.',
        type: 'boolean',
        defaultValue: 'true',
    },
    {
        key: 'allow-flight',
        label: 'Permitir voo',
        description: 'Evita expulsar jogadores detectados voando.',
        type: 'boolean',
        defaultValue: 'false',
    },
    {
        key: 'hardcore',
        label: 'Hardcore',
        description: 'Morte coloca o jogador como espectador.',
        type: 'boolean',
        defaultValue: 'false',
    },
    {
        key: 'white-list',
        label: 'Whitelist',
        description: 'Restringe a entrada aos jogadores autorizados.',
        type: 'boolean',
        defaultValue: 'false',
    },
    {
        key: 'enforce-whitelist',
        label: 'Forçar whitelist',
        description: 'Expulsa jogadores removidos da whitelist.',
        type: 'boolean',
        defaultValue: 'false',
    },
    {
        key: 'spawn-protection',
        label: 'Proteção do spawn',
        description: 'Raio protegido ao redor do spawn.',
        type: 'number',
        defaultValue: '16',
        min: 0,
        max: 10000,
    },
    {
        key: 'enable-command-block',
        label: 'Command blocks',
        description: 'Ativa blocos de comando no mundo.',
        type: 'boolean',
        defaultValue: 'false',
    },
    {
        key: 'level-name',
        label: 'Nome do mundo',
        description: 'Pasta usada para armazenar o mundo principal.',
        type: 'text',
        defaultValue: 'world',
    },
    {
        key: 'level-seed',
        label: 'Seed do mundo',
        description: 'Usada apenas ao gerar um mundo novo.',
        type: 'text',
        defaultValue: '',
    },
];

const quickKeys = new Set(settings.map((setting) => setting.key));

export default ({ uuid, onSuccess, onError }: Props) => {
    const [original, setOriginal] = useState<Record<string, string>>({});
    const [draft, setDraft] = useState<Record<string, string>>({});
    const [exists, setExists] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    const load = useCallback((): void => {
        setLoading(true);
        getServerProperties(uuid)
            .then((response) => {
                setOriginal(response.properties);
                setDraft(response.properties);
                setExists(response.exists);
            })
            .catch((error) => onError(httpErrorToHuman(error)))
            .then(() => setLoading(false));
    }, [uuid, onError]);

    useEffect(load, [load]);

    const dirty = useMemo(() => {
        const keys = new Set([...Object.keys(original), ...Object.keys(draft)]);

        return Array.from(keys).some((key) => original[key] !== draft[key]);
    }, [original, draft]);

    const advancedProperties = useMemo(
        () =>
            Object.entries(draft)
                .filter(([key]) => !quickKeys.has(key))
                .filter(([key, value]) => `${key} ${value}`.toLowerCase().includes(search.toLowerCase()))
                .sort(([left], [right]) => left.localeCompare(right)),
        [draft, search]
    );

    const change = (key: string, value: string): void => {
        setDraft((current) => ({ ...current, [key]: value }));
    };

    const remove = (key: string): void => {
        setDraft((current) => {
            const next = { ...current };
            delete next[key];
            return next;
        });
    };

    const addProperty = (): void => {
        const key = newKey.trim();
        if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(key)) {
            onError('Use uma chave válida: letras, números, ponto, hífen e sublinhado.');
            return;
        }

        change(key, newValue);
        setNewKey('');
        setNewValue('');
    };

    const save = (): void => {
        const updates = Object.entries(draft).reduce<Record<string, string>>((result, [key, value]) => {
            if (original[key] !== value) result[key] = value;
            return result;
        }, {});
        const removals = Object.keys(original).filter((key) => !(key in draft));

        setSaving(true);
        updateServerProperties(uuid, updates, removals)
            .then((properties) => {
                setOriginal(properties);
                setDraft(properties);
                setExists(true);
                onSuccess('server.properties salvo. Reinicie o servidor para aplicar todas as mudanças.');
            })
            .catch((error) => onError(httpErrorToHuman(error)))
            .then(() => setSaving(false));
    };

    const renderControl = (setting: SettingDefinition): React.ReactNode => {
        const value = draft[setting.key] ?? setting.defaultValue;
        const id = `mineflow-property-${setting.key}`;

        if (setting.type === 'boolean') {
            return (
                <Select id={id} value={value} onChange={(event) => change(setting.key, event.currentTarget.value)}>
                    <option value={'true'}>Ativado</option>
                    <option value={'false'}>Desativado</option>
                </Select>
            );
        }

        if (setting.type === 'select') {
            return (
                <Select id={id} value={value} onChange={(event) => change(setting.key, event.currentTarget.value)}>
                    {setting.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Select>
            );
        }

        return (
            <Input
                id={id}
                type={setting.type}
                min={setting.min}
                max={setting.max}
                value={value}
                onChange={(event) => change(setting.key, event.currentTarget.value)}
            />
        );
    };

    return (
        <Can
            action={'file.read-content'}
            renderOnError={
                <Panel>
                    <div className={'py-10 text-center'}>
                        <FontAwesomeIcon icon={faShieldHalved} className={'mb-4 text-4xl text-amber-400'} />
                        <h2 className={'text-lg font-bold text-neutral-100'}>Permissão necessária</h2>
                        <p className={'mt-2 text-sm text-neutral-400'}>
                            Você precisa da permissão <code>file.read-content</code> para abrir o server.properties.
                        </p>
                    </div>
                </Panel>
            }
        >
            <Panel>
                <div className={'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'}>
                    <div>
                        <h2 className={'text-xl font-bold text-neutral-100'}>Configuração do Minecraft</h2>
                        <p className={'mt-1 text-sm text-neutral-400'}>
                            Editor seguro para <code className={'text-indigo-300'}>/server.properties</code>.
                        </p>
                    </div>
                    <div className={'flex items-center gap-2'}>
                        <Button.Text
                            size={Button.Sizes.Small}
                            onClick={load}
                            disabled={loading || saving}
                            aria-label={'Recarregar propriedades'}
                        >
                            <FontAwesomeIcon icon={faRotate} spin={loading} />
                        </Button.Text>
                        <Can action={'file.create'}>
                            <Button disabled={!dirty || saving || loading} onClick={save}>
                                <FontAwesomeIcon icon={faFloppyDisk} className={'mr-2'} />
                                {saving ? 'Salvando...' : 'Salvar alterações'}
                            </Button>
                        </Can>
                    </div>
                </div>

                <div className={'mt-5'}>
                    <UiAlert type={exists ? 'info' : 'warning'}>
                        {exists
                            ? 'Algumas opções só entram em vigor depois que o servidor é reiniciado.'
                            : 'O arquivo ainda não existe. Ao salvar, o MineFlow criará um server.properties novo.'}
                    </UiAlert>
                </div>

                {loading ? (
                    <div className={'py-20'}>
                        <Spinner size={'large'} centered />
                    </div>
                ) : (
                    <>
                        <div className={'mb-4 mt-7 flex items-center gap-3'}>
                            <FontAwesomeIcon icon={faGaugeHigh} className={'text-indigo-300'} />
                            <div>
                                <h3 className={'font-bold text-neutral-100'}>Configurações principais</h3>
                                <p className={'text-xs text-neutral-400'}>Opções mais usadas, organizadas e explicadas.</p>
                            </div>
                        </div>
                        <SettingGrid>
                            {settings.map((setting) => (
                                <SettingCard key={setting.key}>
                                    <Label htmlFor={`mineflow-property-${setting.key}`}>{setting.label}</Label>
                                    <p className={'mb-3 mt-1 min-h-[2rem] text-xs leading-4 text-neutral-400'}>
                                        {setting.description}
                                    </p>
                                    <div>{renderControl(setting)}</div>
                                    <code className={'mt-2 block truncate text-[11px] text-neutral-500'}>{setting.key}</code>
                                </SettingCard>
                            ))}
                        </SettingGrid>

                        <div className={'mb-4 mt-8 flex items-center gap-3'}>
                            <FontAwesomeIcon icon={faCode} className={'text-violet-300'} />
                            <div>
                                <h3 className={'font-bold text-neutral-100'}>Propriedades avançadas</h3>
                                <p className={'text-xs text-neutral-400'}>
                                    Edite qualquer outra chave presente no arquivo ou adicione uma nova.
                                </p>
                            </div>
                        </div>

                        <div className={'rounded-xl border border-neutral-700 bg-neutral-800/50 p-4'}>
                            <div className={'grid gap-3 md:grid-cols-[1fr_1.4fr_auto]'}>
                                <div>
                                    <Label htmlFor={'mineflow-new-key'}>Nova chave</Label>
                                    <Input
                                        id={'mineflow-new-key'}
                                        value={newKey}
                                        onChange={(event) => setNewKey(event.currentTarget.value)}
                                        placeholder={'ex.: resource-pack'}
                                        className={'mt-1'}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor={'mineflow-new-value'}>Valor</Label>
                                    <Input
                                        id={'mineflow-new-value'}
                                        value={newValue}
                                        onChange={(event) => setNewValue(event.currentTarget.value)}
                                        placeholder={'Valor da propriedade'}
                                        className={'mt-1'}
                                    />
                                </div>
                                <div className={'flex items-end'}>
                                    <Button onClick={addProperty} disabled={!newKey.trim()}>
                                        <FontAwesomeIcon icon={faPlus} className={'mr-2'} />
                                        Adicionar
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className={'mt-4'}>
                            <div className={'relative'}>
                                <FontAwesomeIcon
                                    icon={faGlobe}
                                    className={'absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500'}
                                />
                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.currentTarget.value)}
                                    placeholder={'Filtrar propriedades avançadas...'}
                                    className={'pl-10'}
                                />
                            </div>
                        </div>

                        <div className={'mt-4 overflow-hidden rounded-xl border border-neutral-700'}>
                            {advancedProperties.length === 0 ? (
                                <div className={'px-5 py-10 text-center text-sm text-neutral-400'}>
                                    Nenhuma propriedade avançada encontrada.
                                </div>
                            ) : (
                                advancedProperties.map(([key, value], index) => (
                                    <div
                                        key={key}
                                        className={`grid gap-3 bg-neutral-800/55 p-4 md:grid-cols-[minmax(180px,0.8fr)_minmax(240px,1.4fr)_auto] md:items-center ${
                                            index > 0 ? 'border-t border-neutral-700' : ''
                                        }`}
                                    >
                                        <code className={'truncate text-sm font-semibold text-indigo-200'}>{key}</code>
                                        <Input value={value} onChange={(event) => change(key, event.currentTarget.value)} />
                                        <Button.Danger
                                            variant={Button.Variants.Secondary}
                                            size={Button.Sizes.Small}
                                            onClick={() => remove(key)}
                                            aria-label={`Remover ${key}`}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </Button.Danger>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className={'mt-6 flex flex-col gap-3 border-t border-neutral-700 pt-5 sm:flex-row sm:items-center sm:justify-between'}>
                            <p className={'text-xs text-neutral-400'}>
                                <FontAwesomeIcon icon={faServer} className={'mr-2'} />
                                A porta do servidor continua sendo controlada pelas alocações do Pterodactyl.
                            </p>
                            <Can action={'file.create'}>
                                <Button disabled={!dirty || saving} onClick={save}>
                                    <FontAwesomeIcon icon={faFloppyDisk} className={'mr-2'} />
                                    {saving ? 'Salvando...' : 'Salvar alterações'}
                                </Button>
                            </Can>
                        </div>
                    </>
                )}
            </Panel>
        </Can>
    );
};
