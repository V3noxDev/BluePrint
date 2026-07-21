// Conversor de texto com códigos de formatação do Minecraft (§) em segmentos
// estilizados, usado no preview ao vivo do MOTD.

export interface TextSegment {
    text: string;
    color: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    obfuscated: boolean;
}

export const MINECRAFT_COLORS: Record<string, { hex: string; name: string }> = {
    '0': { hex: '#000000', name: 'Preto' },
    '1': { hex: '#0000AA', name: 'Azul escuro' },
    '2': { hex: '#00AA00', name: 'Verde escuro' },
    '3': { hex: '#00AAAA', name: 'Ciano escuro' },
    '4': { hex: '#AA0000', name: 'Vermelho escuro' },
    '5': { hex: '#AA00AA', name: 'Roxo' },
    '6': { hex: '#FFAA00', name: 'Dourado' },
    '7': { hex: '#AAAAAA', name: 'Cinza' },
    '8': { hex: '#555555', name: 'Cinza escuro' },
    '9': { hex: '#5555FF', name: 'Azul' },
    a: { hex: '#55FF55', name: 'Verde' },
    b: { hex: '#55FFFF', name: 'Ciano' },
    c: { hex: '#FF5555', name: 'Vermelho' },
    d: { hex: '#FF55FF', name: 'Rosa' },
    e: { hex: '#FFFF55', name: 'Amarelo' },
    f: { hex: '#FFFFFF', name: 'Branco' },
};

export const MINECRAFT_FORMATS: Record<string, { name: string }> = {
    k: { name: 'Embaralhado' },
    l: { name: 'Negrito' },
    m: { name: 'Riscado' },
    n: { name: 'Sublinhado' },
    o: { name: 'Itálico' },
    r: { name: 'Resetar' },
};

const DEFAULT_COLOR = '#AAAAAA';

export const parseMinecraftLine = (line: string): TextSegment[] => {
    const segments: TextSegment[] = [];
    let color = DEFAULT_COLOR;
    let bold = false;
    let italic = false;
    let underline = false;
    let strikethrough = false;
    let obfuscated = false;
    let buffer = '';

    const flush = () => {
        if (buffer !== '') {
            segments.push({ text: buffer, color, bold, italic, underline, strikethrough, obfuscated });
            buffer = '';
        }
    };

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '\u00a7' && i + 1 < line.length) {
            const code = line[i + 1].toLowerCase();
            if (MINECRAFT_COLORS[code]) {
                flush();
                color = MINECRAFT_COLORS[code].hex;
                // No Java Edition, um código de cor reseta a formatação anterior.
                bold = italic = underline = strikethrough = obfuscated = false;
                i++;
                continue;
            }
            switch (code) {
                case 'l':
                    flush();
                    bold = true;
                    i++;
                    continue;
                case 'o':
                    flush();
                    italic = true;
                    i++;
                    continue;
                case 'n':
                    flush();
                    underline = true;
                    i++;
                    continue;
                case 'm':
                    flush();
                    strikethrough = true;
                    i++;
                    continue;
                case 'k':
                    flush();
                    obfuscated = true;
                    i++;
                    continue;
                case 'r':
                    flush();
                    color = DEFAULT_COLOR;
                    bold = italic = underline = strikethrough = obfuscated = false;
                    i++;
                    continue;
                default:
                    break;
            }
        }
        buffer += ch;
    }
    flush();

    return segments;
};

export const parseMinecraftText = (text: string): TextSegment[][] =>
    text.split('\\n').join('\n').split('\n').slice(0, 2).map(parseMinecraftLine);
