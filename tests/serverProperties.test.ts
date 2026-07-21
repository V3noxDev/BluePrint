import assert from 'node:assert/strict';
import test from 'node:test';
import {
    getProperty,
    parsePropertyLine,
    propertyAsBoolean,
    setProperty,
} from '../minehub/components/lib/serverProperties.ts';

test('reads properties while ignoring comments and blanks', () => {
    const source = '# generated file\n\nmotd=Hello=World\n! disabled=true\npvp=true\n';

    assert.equal(getProperty(source, 'motd'), 'Hello=World');
    assert.equal(getProperty(source, 'pvp'), 'true');
    assert.equal(getProperty(source, 'missing', 'fallback'), 'fallback');
});

test('updates only the last duplicate and preserves comments and line endings', () => {
    const source = '# Minecraft\r\nmotd=Old\r\nunknown=value\r\nmotd = Current\r\n';
    const updated = setProperty(source, 'motd', 'New server');

    assert.equal(updated, '# Minecraft\r\nmotd=Old\r\nunknown=value\r\nmotd = New server\r\n');
});

test('appends missing properties without rewriting existing content', () => {
    assert.equal(setProperty('motd=Hello', 'max-players', '40'), 'motd=Hello\nmax-players=40');
    assert.equal(setProperty('motd=Hello\n', 'max-players', '40'), 'motd=Hello\nmax-players=40\n');
    assert.equal(setProperty('', 'online-mode', 'true'), 'online-mode=true\n');
});

test('prevents values from injecting additional property lines', () => {
    assert.equal(setProperty('motd=Hello\n', 'motd', 'Safe\nonline-mode=false'), 'motd=Safe online-mode=false\n');
});

test('supports colon separators, separator-free values, and booleans', () => {
    assert.deepEqual(parsePropertyLine(' difficulty : hard'), {
        key: 'difficulty',
        value: 'hard',
        valueStart: 14,
        hasSeparator: true,
    });
    assert.equal(setProperty('hardcore', 'hardcore', 'true'), 'hardcore=true');
    assert.equal(propertyAsBoolean('pvp=TRUE\n', 'pvp'), true);
    assert.equal(propertyAsBoolean('', 'online-mode', true), true);
});
