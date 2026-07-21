export interface PropertyEntry {
    key: string;
    value: string;
    valueStart: number;
    hasSeparator: boolean;
}

const lineBreakPattern = /\r\n|\n|\r/;
const trailingLineBreakPattern = /(?:\r\n|\n|\r)$/;

const isEscaped = (value: string, index: number): boolean => {
    let slashes = 0;

    for (let cursor = index - 1; cursor >= 0 && value[cursor] === '\\'; cursor -= 1) {
        slashes += 1;
    }

    return slashes % 2 === 1;
};

export const parsePropertyLine = (line: string): PropertyEntry | null => {
    const firstContent = line.search(/\S/);

    if (firstContent === -1 || line[firstContent] === '#' || line[firstContent] === '!') {
        return null;
    }

    let separator = -1;

    for (let index = firstContent; index < line.length; index += 1) {
        const character = line[index];

        if (!isEscaped(line, index) && (character === '=' || character === ':')) {
            separator = index;
            break;
        }
    }

    if (separator === -1) {
        return {
            key: line.slice(firstContent).trim(),
            value: '',
            valueStart: line.length,
            hasSeparator: false,
        };
    }

    let valueStart = separator + 1;
    while (valueStart < line.length && /\s/.test(line[valueStart])) {
        valueStart += 1;
    }

    return {
        key: line.slice(firstContent, separator).trim(),
        value: line.slice(valueStart),
        valueStart,
        hasSeparator: true,
    };
};

export const getProperty = (content: string, key: string, fallback = ''): string => {
    const lines = content.split(lineBreakPattern);
    let result = fallback;

    lines.forEach((line) => {
        const entry = parsePropertyLine(line);

        if (entry?.key === key) {
            result = entry.value;
        }
    });

    return result;
};

export const setProperty = (content: string, key: string, value: string): string => {
    const safeValue = String(value).replace(/[\r\n]+/g, ' ');
    const eol = content.includes('\r\n') ? '\r\n' : content.includes('\r') ? '\r' : '\n';
    const hasTrailingBreak = trailingLineBreakPattern.test(content);
    const lines = content === '' ? [] : content.split(lineBreakPattern);

    if (hasTrailingBreak) {
        lines.pop();
    }

    let matchingLine = -1;

    lines.forEach((line, index) => {
        if (parsePropertyLine(line)?.key === key) {
            matchingLine = index;
        }
    });

    if (matchingLine >= 0) {
        const entry = parsePropertyLine(lines[matchingLine]);

        if (entry) {
            lines[matchingLine] = entry.hasSeparator
                ? lines[matchingLine].slice(0, entry.valueStart) + safeValue
                : `${lines[matchingLine]}=${safeValue}`;
        }
    } else {
        lines.push(`${key}=${safeValue}`);
    }

    return lines.join(eol) + (hasTrailingBreak || content === '' ? eol : '');
};

export const propertyAsBoolean = (content: string, key: string, fallback = false): boolean => {
    const value = getProperty(content, key, fallback ? 'true' : 'false').toLowerCase();

    return value === 'true';
};
