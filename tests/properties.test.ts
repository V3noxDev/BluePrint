import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDefaultProperties, propertyDefinitionByKey, validateProperty } from '../components/lib/catalog.ts';
import {
    applyPropertyValues,
    getChangedPropertyKeys,
    isValidPropertyKey,
    parseProperties,
    propertiesToRecord,
    removeProperty,
    updateProperty,
} from '../components/lib/properties.ts';

test('parses properties while preserving comments and unknown lines', () => {
    const source = '# Header\r\nmotd=Meu servidor\r\n\r\n! note\r\nlinha desconhecida\r\n';
    const document = parseProperties(source);

    assert.equal(document.newline, '\r\n');
    assert.equal(document.trailingNewline, true);
    assert.deepEqual(propertiesToRecord(document), { motd: 'Meu servidor' });
    assert.equal(document.lines[0].type, 'other');
    assert.equal(document.lines[4].type, 'other');
});

test('updates one property without rewriting unchanged content', () => {
    const source = '#Minecraft server properties\nmotd=Original\nview-distance=10\ncustom.key = untouched\n';
    const result = updateProperty(source, 'view-distance', '8');

    assert.equal(result, '#Minecraft server properties\nmotd=Original\nview-distance=8\ncustom.key = untouched\n');
});

test('appends missing properties and preserves the existing newline style', () => {
    const source = '# Header\r\nmotd=Teste\r\n';
    const result = updateProperty(source, 'online-mode', 'true');

    assert.equal(result, '# Header\r\nmotd=Teste\r\nonline-mode=true\r\n');
});

test('applies presets without deleting custom properties', () => {
    const source = 'motd=Teste\nplugin.custom=true\nview-distance=12\n';
    const result = applyPropertyValues(source, {
        'view-distance': '8',
        'simulation-distance': '6',
    });

    assert.deepEqual(propertiesToRecord(parseProperties(result)), {
        motd: 'Teste',
        'plugin.custom': 'true',
        'view-distance': '8',
        'simulation-distance': '6',
    });
});

test('removes every occurrence of a selected property only', () => {
    const source = 'motd=Primeiro\ncustom=true\nmotd=Segundo\n';
    const result = removeProperty(source, 'motd');

    assert.equal(result, 'custom=true\n');
});

test('sanitizes line breaks in values to avoid injecting properties', () => {
    const result = updateProperty('motd=Seguro\n', 'motd', 'Linha 1\nonline-mode=false');

    assert.equal(result, 'motd=Linha 1\\nonline-mode=false\n');
    assert.deepEqual(Object.keys(propertiesToRecord(parseProperties(result))), ['motd']);
});

test('reports changed property keys independently from comments', () => {
    assert.deepEqual(getChangedPropertyKeys('# old\nmotd=A\n', '# new\nmotd=A\n'), []);
    assert.deepEqual(getChangedPropertyKeys('motd=A\nview-distance=10\n', 'motd=B\nview-distance=8\n').sort(), [
        'motd',
        'view-distance',
    ]);
});

test('validates custom property names', () => {
    assert.equal(isValidPropertyKey('paper.feature-enabled'), true);
    assert.equal(isValidPropertyKey('query.port'), true);
    assert.equal(isValidPropertyKey('bad key=value'), false);
    assert.equal(isValidPropertyKey('../server.properties'), false);
});

test('builds a current default file with security-sensitive defaults', () => {
    const defaults = propertiesToRecord(parseProperties(buildDefaultProperties()));

    assert.equal(defaults['online-mode'], 'true');
    assert.equal(defaults['enable-rcon'], 'false');
    assert.equal(defaults['management-server-enabled'], 'false');
    assert.equal(defaults['server-port'], '25565');
});

test('validates catalog ranges and structured values', () => {
    assert.equal(validateProperty(propertyDefinitionByKey['server-port'], '65536'), 'O valor máximo é 65535.');
    assert.equal(validateProperty(propertyDefinitionByKey['server-port'], '25565'), null);
    assert.equal(validateProperty(propertyDefinitionByKey['generator-settings'], '{invalid'), 'Informe um JSON válido.');
    assert.equal(validateProperty(propertyDefinitionByKey['resource-pack-sha1'], 'abcd'), 'O SHA-1 deve ter 40 caracteres hexadecimais.');
});
