export type PropertyLine =
    | {
          type: 'property';
          raw: string;
          key: string;
          value: string;
      }
    | {
          type: 'other';
          raw: string;
      };

export interface PropertiesDocument {
    lines: PropertyLine[];
    newline: '\n' | '\r\n';
    trailingNewline: boolean;
}

const hasOwn = (value: Record<string, string>, key: string): boolean =>
    Object.prototype.hasOwnProperty.call(value, key);

const findSeparator = (line: string): number => {
    let escaped = false;

    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];

        if (escaped) {
            escaped = false;
            continue;
        }

        if (character === '\\') {
            escaped = true;
            continue;
        }

        if (character === '=' || character === ':') {
            return index;
        }
    }

    return -1;
};

export const parseProperties = (source: string): PropertiesDocument => {
    const newline: '\n' | '\r\n' = source.includes('\r\n') ? '\r\n' : '\n';
    const trailingNewline = /(?:\r\n|\n|\r)$/.test(source);
    const rawLines = source.length === 0 ? [] : source.split(/\r\n|\n|\r/);

    if (trailingNewline) {
        rawLines.pop();
    }

    const lines = rawLines.map<PropertyLine>((raw) => {
        const trimmed = raw.trimStart();

        if (trimmed.length === 0 || trimmed.startsWith('#') || trimmed.startsWith('!')) {
            return { type: 'other', raw };
        }

        const separator = findSeparator(raw);
        if (separator < 0) {
            return { type: 'other', raw };
        }

        const key = raw.slice(0, separator).trim();
        if (key.length === 0) {
            return { type: 'other', raw };
        }

        return {
            type: 'property',
            raw,
            key,
            value: raw.slice(separator + 1).replace(/^\s+/, ''),
        };
    });

    return { lines, newline, trailingNewline };
};

export const propertiesToRecord = (document: PropertiesDocument): Record<string, string> =>
    document.lines.reduce<Record<string, string>>((values, line) => {
        if (line.type === 'property') {
            values[line.key] = line.value;
        }

        return values;
    }, {});

export const sanitizePropertyValue = (value: string): string =>
    value.replace(/\0/g, '').replace(/\r\n|\r|\n/g, '\\n');

export const serializeProperties = (
    document: PropertiesDocument,
    values: Record<string, string>,
    appendOrder: string[] = Object.keys(values)
): string => {
    const seen = new Set<string>();
    const output = document.lines.map((line) => {
        if (line.type === 'other' || !hasOwn(values, line.key)) {
            return line.raw;
        }

        seen.add(line.key);
        const nextValue = sanitizePropertyValue(values[line.key]);
        return nextValue === line.value ? line.raw : `${line.key}=${nextValue}`;
    });

    appendOrder.forEach((key) => {
        if (!seen.has(key) && hasOwn(values, key)) {
            output.push(`${key}=${sanitizePropertyValue(values[key])}`);
            seen.add(key);
        }
    });

    const serialized = output.join(document.newline);
    return document.trailingNewline && output.length > 0 ? `${serialized}${document.newline}` : serialized;
};

export const updateProperty = (source: string, key: string, value: string): string => {
    const document = parseProperties(source);
    const values = propertiesToRecord(document);
    values[key] = sanitizePropertyValue(value);

    return serializeProperties(document, values, [key]);
};

export const removeProperty = (source: string, key: string): string => {
    const document = parseProperties(source);
    const output = document.lines
        .filter((line) => line.type !== 'property' || line.key !== key)
        .map((line) => line.raw)
        .join(document.newline);

    return document.trailingNewline && output.length > 0 ? `${output}${document.newline}` : output;
};

export const applyPropertyValues = (source: string, patch: Record<string, string>): string => {
    const document = parseProperties(source);
    const values = { ...propertiesToRecord(document), ...patch };

    return serializeProperties(document, values, Object.keys(patch));
};

export const getChangedPropertyKeys = (before: string, after: string): string[] => {
    const previous = propertiesToRecord(parseProperties(before));
    const current = propertiesToRecord(parseProperties(after));
    const keys = new Set([...Object.keys(previous), ...Object.keys(current)]);

    return Array.from(keys).filter((key) => previous[key] !== current[key]);
};

export const isValidPropertyKey = (key: string): boolean => /^[A-Za-z0-9_.-]+$/.test(key);
