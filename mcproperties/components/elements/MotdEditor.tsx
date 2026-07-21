import React, { useRef } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { Textarea } from '@/components/elements/Input';
import { MINECRAFT_COLORS } from '../lib/minecraftText';
import MotdPreview from './MotdPreview';

// Editor do MOTD com barra de cores/formatos e preview em tempo real.

const SECTION_SIGN = '\u00a7';

const ColorButton = styled.button<{ $hex: string }>`
    ${tw`w-6 h-6 rounded-sm flex-none cursor-pointer border border-black transition-all duration-100`};
    background: ${(props) => props.$hex};
    &:hover {
        transform: scale(1.2);
        z-index: 10;
    }
`;

const FormatButton = styled.button`
    ${tw`px-2 h-6 rounded-sm flex-none cursor-pointer text-xs font-bold border border-neutral-500 bg-neutral-600 text-neutral-200 transition-colors duration-100`};
    &:hover {
        ${tw`bg-neutral-500 text-white`};
    }
`;

interface Props {
    value: string;
    modified: boolean;
    serverName: string;
    onChange: (value: string) => void;
    onReset: () => void;
}

const MotdEditor = ({ value, modified, serverName, onChange, onReset }: Props) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertAtCursor = (code: string) => {
        const el = textareaRef.current;
        if (!el) {
            onChange(value + code);
            return;
        }
        const start = el.selectionStart ?? value.length;
        const end = el.selectionEnd ?? value.length;
        const next = value.slice(0, start) + code + value.slice(end);
        onChange(next);
        requestAnimationFrame(() => {
            el.focus();
            el.selectionStart = el.selectionEnd = start + code.length;
        });
    };

    const lines = value.split('\n');
    const tooManyLines = lines.length > 2;
    const longLine = lines.some((line) => line.replace(new RegExp(SECTION_SIGN + '.', 'g'), '').length > 45);

    return (
        <div css={tw`rounded shadow-md bg-neutral-700 overflow-hidden`}>
            <div css={tw`bg-neutral-900 p-3 border-b border-black flex items-center justify-between`}>
                <div>
                    <p css={tw`text-sm uppercase text-neutral-100`}>MOTD — Mensagem do servidor</p>
                    <p css={tw`text-xs text-neutral-400 mt-1`}>
                        Aparece na lista de servidores do jogo. Use os botões para inserir cores e formatos.
                    </p>
                </div>
                {modified && (
                    <button
                        type={'button'}
                        onClick={onReset}
                        css={tw`text-xs text-neutral-300 hover:text-white underline flex-none ml-4`}
                    >
                        Desfazer alteração
                    </button>
                )}
            </div>
            <div css={tw`p-4`}>
                <div css={tw`flex flex-wrap items-center gap-1 mb-3`} style={{ gap: '0.25rem' }}>
                    {Object.keys(MINECRAFT_COLORS).map((code) => (
                        <ColorButton
                            key={code}
                            type={'button'}
                            title={`${MINECRAFT_COLORS[code].name} (${SECTION_SIGN}${code})`}
                            $hex={MINECRAFT_COLORS[code].hex}
                            onClick={() => insertAtCursor(SECTION_SIGN + code)}
                        />
                    ))}
                    <span css={tw`mx-1 text-neutral-500`}>|</span>
                    <FormatButton type={'button'} title={'Negrito (§l)'} onClick={() => insertAtCursor(SECTION_SIGN + 'l')}>
                        B
                    </FormatButton>
                    <FormatButton
                        type={'button'}
                        title={'Itálico (§o)'}
                        css={tw`italic`}
                        onClick={() => insertAtCursor(SECTION_SIGN + 'o')}
                    >
                        I
                    </FormatButton>
                    <FormatButton
                        type={'button'}
                        title={'Sublinhado (§n)'}
                        css={tw`underline`}
                        onClick={() => insertAtCursor(SECTION_SIGN + 'n')}
                    >
                        S
                    </FormatButton>
                    <FormatButton
                        type={'button'}
                        title={'Riscado (§m)'}
                        css={tw`line-through`}
                        onClick={() => insertAtCursor(SECTION_SIGN + 'm')}
                    >
                        R
                    </FormatButton>
                    <FormatButton type={'button'} title={'Embaralhado (§k)'} onClick={() => insertAtCursor(SECTION_SIGN + 'k')}>
                        ?
                    </FormatButton>
                    <FormatButton type={'button'} title={'Resetar formatação (§r)'} onClick={() => insertAtCursor(SECTION_SIGN + 'r')}>
                        ✕
                    </FormatButton>
                    <FormatButton
                        type={'button'}
                        title={'Quebra de linha'}
                        onClick={() => insertAtCursor('\n')}
                        disabled={lines.length >= 2}
                        css={lines.length >= 2 ? tw`opacity-50 cursor-not-allowed` : undefined}
                    >
                        ↵ 2ª linha
                    </FormatButton>
                </div>
                <Textarea
                    ref={textareaRef}
                    rows={2}
                    spellCheck={false}
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.currentTarget.value)}
                    placeholder={'Um servidor de Minecraft'}
                />
                <div css={tw`flex items-center justify-between mt-1`}>
                    <p css={tw`text-xs text-neutral-400`}>
                        Dica: códigos <code css={tw`text-neutral-300`}>{SECTION_SIGN}</code> também podem ser digitados manualmente.
                    </p>
                    {tooManyLines ? (
                        <p css={tw`text-xs text-red-300`}>O MOTD suporta no máximo 2 linhas.</p>
                    ) : longLine ? (
                        <p css={tw`text-xs text-yellow-300`}>Linhas com mais de ~45 caracteres podem ser cortadas no jogo.</p>
                    ) : null}
                </div>
                <p css={tw`text-xs uppercase text-neutral-400 mt-4 mb-2`}>Preview ao vivo</p>
                <MotdPreview motd={value} serverName={serverName} />
            </div>
        </div>
    );
};

export default MotdEditor;
