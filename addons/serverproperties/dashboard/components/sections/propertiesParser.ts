/**
 * Parser/serializer do formato server.properties (Java Properties).
 *
 * O objetivo é preservar rigorosamente:
 *   - ordem das linhas
 *   - comentários (# e !)
 *   - linhas em branco
 *   - chaves que não estão no schema (para não perder configurações
 *     de plugins/mods como Paper/Spigot/Purpur)
 *
 * Não implementamos escapes completos do formato Properties (unicode etc.)
 * porque o server.properties do Minecraft não usa esses recursos na prática.
 */

export type LineKind = 'kv' | 'comment' | 'blank';

export interface ParsedLine {
    kind: LineKind;
    raw: string;
    key?: string;
    value?: string;
    separator?: string;
}

export interface ParsedFile {
    lines: ParsedLine[];
    order: string[];
    values: Record<string, string>;
}

export function parseProperties(text: string): ParsedFile {
    const lines: ParsedLine[] = [];
    const values: Record<string, string> = {};
    const order: string[] = [];

    const rawLines = text.replace(/\r\n?/g, '\n').split('\n');
    for (const raw of rawLines) {
        if (raw.trim() === '') {
            lines.push({ kind: 'blank', raw });
            continue;
        }
        const firstNonWs = raw.match(/\S/);
        const first = firstNonWs ? firstNonWs[0] : '';
        if (first === '#' || first === '!') {
            lines.push({ kind: 'comment', raw });
            continue;
        }

        const eq = raw.indexOf('=');
        const colon = raw.indexOf(':');
        let sepIdx = -1;
        let sep = '=';
        if (eq >= 0 && (colon < 0 || eq < colon)) {
            sepIdx = eq;
            sep = '=';
        } else if (colon >= 0) {
            sepIdx = colon;
            sep = ':';
        }

        if (sepIdx < 0) {
            const key = raw.trim();
            lines.push({ kind: 'kv', raw, key, value: '', separator: '=' });
            values[key] = '';
            order.push(key);
            continue;
        }

        const key = raw.slice(0, sepIdx).trim();
        const value = raw.slice(sepIdx + 1);
        lines.push({ kind: 'kv', raw, key, value, separator: sep });
        values[key] = value;
        order.push(key);
    }

    return { lines, order, values };
}

export function serializeProperties(parsed: ParsedFile, updated: Record<string, string>): string {
    const touched = new Set<string>();
    const out: string[] = [];

    for (const line of parsed.lines) {
        if (line.kind !== 'kv' || !line.key) {
            out.push(line.raw);
            continue;
        }
        if (Object.prototype.hasOwnProperty.call(updated, line.key)) {
            touched.add(line.key);
            const sep = line.separator ?? '=';
            out.push(`${line.key}${sep}${updated[line.key]}`);
        } else {
            out.push(line.raw);
        }
    }

    const newKeys = Object.keys(updated).filter((k) => !touched.has(k) && !parsed.values.hasOwnProperty(k));
    if (newKeys.length > 0) {
        if (out.length > 0 && out[out.length - 1].trim() !== '') out.push('');
        for (const k of newKeys) out.push(`${k}=${updated[k]}`);
    }

    return out.join('\n');
}
