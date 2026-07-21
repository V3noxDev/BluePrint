import React, { useState } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import Input from '@/components/elements/Input';
import Select from '@/components/elements/Select';
import { PropertyDefinition } from '../lib/catalog';

// Card individual de uma propriedade do server.properties, com o controle
// adequado ao tipo (toggle, select, número ou texto).

const Card = styled.div<{ $modified: boolean }>`
    ${tw`rounded shadow-md bg-neutral-700 p-4 flex flex-col transition-all duration-150 border border-transparent`};
    ${(props) => props.$modified && tw`border-primary-400`};
`;

const Toggle = styled.button<{ $active: boolean }>`
    ${tw`relative inline-flex flex-none items-center h-6 rounded-full cursor-pointer transition-colors duration-150 border`};
    width: 3rem;
    ${(props) => (props.$active ? tw`bg-primary-500 border-primary-600` : tw`bg-neutral-500 border-neutral-600`)};
`;

const Knob = styled.span<{ $active: boolean }>`
    ${tw`inline-block bg-white rounded-full shadow`};
    width: 1.125rem;
    height: 1.125rem;
    transition: transform 150ms ease;
    transform: translateX(${(props) => (props.$active ? '1.625rem' : '0.2rem')});
`;

const Badge = styled.span`
    ${tw`text-xs px-2 py-1 rounded-full bg-primary-500 text-primary-50 flex-none`};
    font-size: 0.65rem;
`;

interface Props {
    definition: PropertyDefinition;
    value: string;
    modified: boolean;
    onChange: (value: string) => void;
    onReset: () => void;
}

const PropertyField = ({ definition, value, modified, onChange, onReset }: Props) => {
    const [revealed, setRevealed] = useState(false);

    const renderControl = () => {
        switch (definition.type) {
            case 'boolean': {
                const active = value === 'true';
                return (
                    <div css={tw`flex items-center justify-between`}>
                        <span css={active ? tw`text-sm text-primary-200` : tw`text-sm text-neutral-400`}>
                            {active ? 'Ativado' : 'Desativado'}
                        </span>
                        <Toggle
                            type={'button'}
                            role={'switch'}
                            aria-checked={active}
                            aria-label={definition.label}
                            $active={active}
                            onClick={() => onChange(active ? 'false' : 'true')}
                        >
                            <Knob $active={active} />
                        </Toggle>
                    </div>
                );
            }
            case 'enum': {
                const known = (definition.choices || []).some((choice) => choice.value === value);
                return (
                    <Select
                        value={value}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.currentTarget.value)}
                    >
                        {!known && value !== '' && <option value={value}>{value} (valor atual)</option>}
                        {(definition.choices || []).map((choice) => (
                            <option key={choice.value} value={choice.value}>
                                {choice.label}
                            </option>
                        ))}
                    </Select>
                );
            }
            case 'integer':
                return (
                    <Input
                        type={'number'}
                        value={value}
                        min={definition.min}
                        max={definition.max}
                        placeholder={definition.placeholder}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.currentTarget.value)}
                    />
                );
            default:
                return (
                    <div css={tw`relative`}>
                        <Input
                            type={definition.secret && !revealed ? 'password' : 'text'}
                            value={value}
                            spellCheck={false}
                            placeholder={definition.placeholder}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.currentTarget.value)}
                        />
                        {definition.secret && (
                            <button
                                type={'button'}
                                onClick={() => setRevealed(!revealed)}
                                css={tw`absolute right-0 top-0 h-full px-3 text-xs text-neutral-400 hover:text-neutral-200`}
                            >
                                {revealed ? 'ocultar' : 'mostrar'}
                            </button>
                        )}
                    </div>
                );
        }
    };

    return (
        <Card $modified={modified}>
            <div css={tw`flex items-start justify-between mb-1`}>
                <label css={tw`text-sm text-neutral-100 font-medium truncate`} title={definition.key}>
                    {definition.label}
                </label>
                {modified && <Badge>alterado</Badge>}
            </div>
            <p css={tw`text-xs text-neutral-400 mb-3 flex-1`}>{definition.description}</p>
            {renderControl()}
            <div css={tw`flex items-center justify-between mt-2`}>
                <code css={tw`text-xs text-neutral-500 truncate`} title={definition.key}>
                    {definition.key}
                </code>
                {modified && (
                    <button
                        type={'button'}
                        onClick={onReset}
                        css={tw`text-xs text-neutral-400 hover:text-white underline flex-none ml-2`}
                    >
                        desfazer
                    </button>
                )}
            </div>
        </Card>
    );
};

export default PropertyField;
