import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { PropertyDefinition } from './catalog';
import {
    Badge,
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
    StyledInput,
    StyledSelect,
    ToggleRow,
    ToggleWrapper,
} from './styles';

interface Props {
    definition: PropertyDefinition;
    value: string;
    modified: boolean;
    locked: boolean;
    onChange: (key: string, value: string) => void;
}

const PropertyCard = ({ definition, value, modified, locked, onChange }: Props) => {
    const renderControl = () => {
        switch (definition.type) {
            case 'boolean': {
                const checked = value.trim().toLowerCase() === 'true';
                return (
                    <ToggleRow>
                        <span>{checked ? 'Ativado' : 'Desativado'}</span>
                        <ToggleWrapper
                            type={'button'}
                            $checked={checked}
                            disabled={locked}
                            aria-label={definition.label}
                            onClick={() => onChange(definition.key, checked ? 'false' : 'true')}
                        />
                    </ToggleRow>
                );
            }
            case 'enum':
                return (
                    <StyledSelect value={value} disabled={locked} onChange={(e) => onChange(definition.key, e.target.value)}>
                        {(definition.options || []).map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                        {!(definition.options || []).some((o) => o.value === value) && (
                            <option value={value}>{value || '(vazio)'}</option>
                        )}
                    </StyledSelect>
                );
            case 'integer':
                return (
                    <StyledInput
                        type={'number'}
                        value={value}
                        min={definition.min}
                        max={definition.max}
                        disabled={locked}
                        onChange={(e) => onChange(definition.key, e.target.value)}
                    />
                );
            default:
                return (
                    <StyledInput
                        type={'text'}
                        value={value}
                        placeholder={definition.placeholder}
                        disabled={locked}
                        onChange={(e) => onChange(definition.key, e.target.value)}
                    />
                );
        }
    };

    return (
        <Card $modified={modified} $locked={locked}>
            <CardHeader>
                <CardTitle>
                    <h3>
                        {definition.label}
                        {locked && <FontAwesomeIcon icon={faLock} size={'xs'} style={{ color: '#f87171' }} />}
                    </h3>
                    <code>{definition.key}</code>
                </CardTitle>
                {modified ? (
                    <Badge>Alterado</Badge>
                ) : definition.dangerous ? (
                    <Badge $color={'red'}>Crítico</Badge>
                ) : null}
            </CardHeader>
            <CardDescription>{definition.description}</CardDescription>
            {renderControl()}
        </Card>
    );
};

export default PropertyCard;
