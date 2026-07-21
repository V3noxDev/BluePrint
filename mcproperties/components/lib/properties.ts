// Parser e serializador do formato .properties (Java), preservando
// comentários e a ordem original das linhas ao salvar.

export interface PropertiesLine {
    kind: 'comment' | 'blank' | 'entry';
    raw: string;
    key?: string;
}

export interface PropertiesDocument {
    lines: PropertiesLine[];
    values: Record<string, string>;
    order: string[];
}

// Java .properties escapa caracteres não-ASCII como \uXXXX (ex.: § vira \u00a7).
export const decodePropertiesValue = (value: string): string =>
    value
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/\\([:=!#\\])/g, '$1')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t');

export const encodePropertiesValue = (value: string): string => {
    let out = '';
    // Itera por unidade UTF-16 (como o Java): pares substitutos (emojis etc.)
    // viram dois escapes \uXXXX consecutivos.
    for (let i = 0; i < value.length; i++) {
        const ch = value[i];
        if (ch === '\n') {
            out += '\\n';
        } else if (ch === '\t') {
            out += '\\t';
        } else if (ch === '\\') {
            out += '\\\\';
        } else {
            const code = value.charCodeAt(i);
            if (code < 0x20 || code > 0x7e) {
                out += '\\u' + code.toString(16).padStart(4, '0');
            } else {
                out += ch;
            }
        }
    }
    return out;
};

export const parseProperties = (content: string): PropertiesDocument => {
    const lines = content.split(/\r?\n/);
    const doc: PropertiesDocument = { lines: [], values: {}, order: [] };

    for (const raw of lines) {
        const trimmed = raw.trim();
        if (trimmed === '') {
            doc.lines.push({ kind: 'blank', raw });
            continue;
        }
        if (trimmed.startsWith('#') || trimmed.startsWith('!')) {
            doc.lines.push({ kind: 'comment', raw });
            continue;
        }
        const eq = raw.indexOf('=');
        if (eq === -1) {
            // Linha sem '=' — trata como chave com valor vazio.
            const key = trimmed;
            doc.lines.push({ kind: 'entry', raw, key });
            if (!(key in doc.values)) {
                doc.values[key] = '';
                doc.order.push(key);
            }
            continue;
        }
        const key = raw.slice(0, eq).trim();
        const value = raw.slice(eq + 1);
        doc.lines.push({ kind: 'entry', raw, key });
        if (!(key in doc.values)) {
            doc.values[key] = decodePropertiesValue(value);
            doc.order.push(key);
        } else {
            // Chave duplicada: o último valor vence, como no Java.
            doc.values[key] = decodePropertiesValue(value);
        }
    }

    return doc;
};

export const serializeProperties = (doc: PropertiesDocument, values: Record<string, string>): string => {
    const written = new Set<string>();
    const output: string[] = [];

    for (const line of doc.lines) {
        if (line.kind !== 'entry' || !line.key) {
            output.push(line.raw);
            continue;
        }
        if (written.has(line.key)) {
            // Remove entradas duplicadas mantendo apenas a primeira.
            continue;
        }
        written.add(line.key);
        const value = line.key in values ? values[line.key] : doc.values[line.key] || '';
        output.push(`${line.key}=${encodePropertiesValue(value)}`);
    }

    // Chaves novas que não existiam no arquivo original.
    for (const key of Object.keys(values)) {
        if (!written.has(key)) {
            output.push(`${key}=${encodePropertiesValue(values[key])}`);
        }
    }

    // Garante newline final, igual ao vanilla.
    let result = output.join('\n');
    if (!result.endsWith('\n')) {
        result += '\n';
    }
    return result;
};
