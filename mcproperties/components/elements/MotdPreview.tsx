import React from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { parseMinecraftText, TextSegment } from '../lib/minecraftText';
import Obfuscated from './Obfuscated';

// Preview do MOTD imitando a lista de servidores do Minecraft Java.

const PreviewShell = styled.div`
    ${tw`rounded border border-black flex items-center p-2`};
    background: #181818 url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='16' height='16' fill='%23181818'/%3E%3Crect width='8' height='8' fill='%231d1d1d'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%231d1d1d'/%3E%3C/svg%3E");
    font-family: 'Lucida Console', Monaco, 'Courier New', monospace;
`;

const ServerIcon = styled.div`
    ${tw`flex-none rounded-sm mr-3 flex items-center justify-center text-2xl`};
    width: 48px;
    height: 48px;
    background: linear-gradient(180deg, #3fab3f 0%, #3fab3f 32%, #79553a 32%, #5d4028 100%);
    image-rendering: pixelated;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.6);
`;

const PingBars = styled.div`
    ${tw`flex-none flex items-end ml-3`};
    & > span {
        width: 3px;
        margin-right: 2px;
        background: #00e676;
        display: inline-block;
    }
`;

const renderSegment = (segment: TextSegment, index: number) => (
    <span
        key={index}
        style={{
            color: segment.color,
            fontWeight: segment.bold ? 'bold' : 'normal',
            fontStyle: segment.italic ? 'italic' : 'normal',
            textDecoration:
                [segment.underline ? 'underline' : '', segment.strikethrough ? 'line-through' : '']
                    .filter(Boolean)
                    .join(' ') || 'none',
            textShadow: '1px 1px 0 rgba(0, 0, 0, 0.7)',
        }}
    >
        {segment.obfuscated ? <Obfuscated text={segment.text} /> : segment.text}
    </span>
);

const MotdPreview = ({ motd, serverName }: { motd: string; serverName: string }) => {
    const lines = parseMinecraftText(motd);

    return (
        <PreviewShell>
            <ServerIcon aria-hidden>⛏️</ServerIcon>
            <div css={tw`flex-1 min-w-0 overflow-hidden`}>
                <div css={tw`flex items-baseline justify-between`}>
                    <p css={tw`text-white text-sm truncate`} style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.7)' }}>
                        {serverName}
                    </p>
                    <span css={tw`text-xs flex-none ml-2`} style={{ color: '#AAAAAA' }}>
                        0/20
                    </span>
                </div>
                {lines.map((segments, i) => (
                    <p key={i} css={tw`text-sm leading-snug truncate`} style={{ color: '#AAAAAA' }}>
                        {segments.length ? (
                            segments.map(renderSegment)
                        ) : (
                            <span style={{ color: '#555555' }}>{i === 0 ? 'Um servidor de Minecraft' : ''}</span>
                        )}
                    </p>
                ))}
            </div>
            <PingBars aria-hidden>
                <span style={{ height: 4 }} />
                <span style={{ height: 7 }} />
                <span style={{ height: 10 }} />
                <span style={{ height: 13 }} />
                <span style={{ height: 16 }} />
            </PingBars>
        </PreviewShell>
    );
};

export default MotdPreview;
