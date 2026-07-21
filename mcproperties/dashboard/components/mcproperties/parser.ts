export interface PropertyLine {
    raw: string;
    key?: string;
    value?: string;
}

export interface ParsedFile {
    lines: PropertyLine[];
}

export const parseProperties = (content: string): ParsedFile => {
    const lines: PropertyLine[] = content.split(/\r?\n/).map((raw) => {
        const trimmed = raw.trim();
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) {
            return { raw };
        }
        const idx = raw.indexOf('=');
        if (idx === -1) {
            return { raw };
        }
        const key = raw.slice(0, idx).trim();
        const value = raw.slice(idx + 1);
        if (!key) {
            return { raw };
        }
        return { raw, key, value };
    });
    return { lines };
};

export const extractValues = (file: ParsedFile): Record<string, string> => {
    const values: Record<string, string> = {};
    for (const line of file.lines) {
        if (line.key !== undefined) {
            values[line.key] = line.value ?? '';
        }
    }
    return values;
};

export const serializeProperties = (file: ParsedFile, values: Record<string, string>): string => {
    const seen = new Set<string>();
    const out: string[] = [];

    for (const line of file.lines) {
        if (line.key !== undefined && Object.prototype.hasOwnProperty.call(values, line.key)) {
            seen.add(line.key);
            out.push(`${line.key}=${values[line.key]}`);
        } else {
            out.push(line.raw);
        }
    }

    // Drop trailing blank lines so appended keys stay grouped with the rest.
    while (out.length > 0 && out[out.length - 1].trim() === '') {
        out.pop();
    }

    for (const key of Object.keys(values)) {
        if (!seen.has(key)) {
            out.push(`${key}=${values[key]}`);
        }
    }

    return out.join('\n') + '\n';
};
