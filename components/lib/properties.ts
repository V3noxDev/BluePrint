export interface ParsedProperty {
    key: string;
    value: string;
    lineIndex: number;
}

export interface ParsedProperties {
    lines: string[];
    newline: '\n' | '\r\n' | '\r';
    trailingNewline: boolean;
    properties: ParsedProperty[];
    values: Record<string, string>;
    duplicateKeys: string[];
}

const hasContinuation = (line: string): boolean => {
    let slashes = 0;

    for (let index = line.length - 1; index >= 0 && line[index] === '\\'; index--) {
        slashes++;
    }

    return slashes % 2 === 1;
};

const unescapeToken = (input: string): string => {
    let output = '';

    for (let index = 0; index < input.length; index++) {
        if (input[index] !== '\\' || index === input.length - 1) {
            output += input[index];
            continue;
        }

        const escaped = input[++index];
        const replacements: Record<string, string> = {
            t: '\t',
            n: '\n',
            r: '\r',
            f: '\f',
        };

        if (escaped === 'u' && /^[0-9a-fA-F]{4}$/.test(input.slice(index + 1, index + 5))) {
            output += String.fromCharCode(parseInt(input.slice(index + 1, index + 5), 16));
            index += 4;
            continue;
        }

        output += replacements[escaped] !== undefined ? replacements[escaped] : escaped;
    }

    return output;
};

const escapeKey = (input: string): string =>
    input
        .replace(/\\/g, '\\\\')
        .replace(/ /g, '\\ ')
        .replace(/([=:])/g, '\\$1');

const escapeValue = (input: string): string =>
    input
        .replace(/\\/g, '\\\\')
        .replace(/\t/g, '\\t')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\f/g, '\\f');

const parsePropertyLine = (line: string, lineIndex: number): ParsedProperty | null => {
    const firstContent = line.search(/\S/);

    if (firstContent === -1 || line[firstContent] === '#' || line[firstContent] === '!' || hasContinuation(line)) {
        return null;
    }

    let escaped = false;
    let keyEnd = line.length;
    let valueStart = line.length;

    for (let index = firstContent; index < line.length; index++) {
        const character = line[index];

        if (escaped) {
            escaped = false;
            continue;
        }

        if (character === '\\') {
            escaped = true;
            continue;
        }

        if (character === '=' || character === ':' || /\s/.test(character)) {
            keyEnd = index;
            valueStart = index;
            break;
        }
    }

    while (valueStart < line.length && /\s/.test(line[valueStart])) {
        valueStart++;
    }

    if (line[valueStart] === '=' || line[valueStart] === ':') {
        valueStart++;
    }

    while (valueStart < line.length && /\s/.test(line[valueStart])) {
        valueStart++;
    }

    const key = unescapeToken(line.slice(firstContent, keyEnd));

    if (!key) {
        return null;
    }

    return {
        key,
        value: unescapeToken(line.slice(valueStart)),
        lineIndex,
    };
};

export const parseProperties = (content: string): ParsedProperties => {
    const newlineMatch = content.match(/\r\n|\n|\r/);
    const newline = (newlineMatch?.[0] || '\n') as ParsedProperties['newline'];
    const trailingNewline = /(?:\r\n|\n|\r)$/.test(content);
    const lines = content ? content.split(/\r\n|\n|\r/) : [];

    if (trailingNewline) {
        lines.pop();
    }

    const properties = lines
        .map((line, lineIndex) => parsePropertyLine(line, lineIndex))
        .filter((property): property is ParsedProperty => property !== null);
    const values: Record<string, string> = {};
    const seen = new Set<string>();
    const duplicateKeys = new Set<string>();

    properties.forEach((property) => {
        if (seen.has(property.key)) {
            duplicateKeys.add(property.key);
        }

        seen.add(property.key);
        values[property.key] = property.value;
    });

    return {
        lines,
        newline,
        trailingNewline,
        properties,
        values,
        duplicateKeys: Array.from(duplicateKeys),
    };
};

const serializeDocument = (document: ParsedProperties): string => {
    const body = document.lines.join(document.newline);
    return document.trailingNewline && document.lines.length ? `${body}${document.newline}` : body;
};

export const setProperties = (content: string, updates: Record<string, string>): string => {
    const document = parseProperties(content);
    const lastLineByKey = document.properties.reduce<Record<string, number>>((map, property) => {
        map[property.key] = property.lineIndex;
        return map;
    }, {});

    Object.entries(updates).forEach(([key, value]) => {
        const replacement = `${escapeKey(key)}=${escapeValue(value)}`;
        const existingLine = lastLineByKey[key];

        if (existingLine !== undefined) {
            const indentation = document.lines[existingLine].match(/^\s*/)?.[0] || '';
            document.lines[existingLine] = `${indentation}${replacement}`;
            return;
        }

        document.lines.push(replacement);
        lastLineByKey[key] = document.lines.length - 1;
    });

    return serializeDocument(document);
};

export const getPropertyValue = (content: string, key: string, fallback: string): string => {
    const values = parseProperties(content).values;
    return values[key] !== undefined ? values[key] : fallback;
};
