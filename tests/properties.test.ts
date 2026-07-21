import assert from 'node:assert/strict';
import { parseProperties, setProperties } from '../components/lib/properties.ts';

const original = [
    '#Minecraft server properties',
    '#Tue Jul 21 04:13:00 UTC 2026',
    'motd=Meu servidor',
    'max-players=20',
    'custom-plugin-setting=keep-me',
    '',
].join('\n');

const updated = setProperties(original, {
    motd: 'Rede \\ Principal = Survival',
    'max-players': '50',
    'view-distance': '10',
});

assert.match(updated, /^#Minecraft server properties/m);
assert.match(updated, /^custom-plugin-setting=keep-me$/m);
assert.match(updated, /^motd=Rede \\\\ Principal = Survival$/m);
assert.match(updated, /^max-players=50$/m);
assert.match(updated, /^view-distance=10$/m);
assert.equal(updated.endsWith('\n'), true);

const parsed = parseProperties(updated);
assert.equal(parsed.values.motd, 'Rede \\ Principal = Survival');
assert.equal(parsed.values['max-players'], '50');
assert.equal(parsed.values['custom-plugin-setting'], 'keep-me');
assert.equal(parsed.values['view-distance'], '10');

const windows = 'motd=Teste\r\nmax-players=10\r\n';
const windowsUpdated = setProperties(windows, { 'max-players': '25' });
assert.equal(windowsUpdated, 'motd=Teste\r\nmax-players=25\r\n');

const duplicates = parseProperties('pvp=false\npvp=true\n');
assert.deepEqual(duplicates.duplicateKeys, ['pvp']);
assert.equal(duplicates.values.pvp, 'true');

const duplicateUpdated = setProperties('pvp=false\npvp=true\n', { pvp: 'false' });
assert.equal(duplicateUpdated, 'pvp=false\npvp=false\n');

const escaped = parseProperties('resource-pack-prompt=Primeira\\nSegunda\\u0021\n');
assert.equal(escaped.values['resource-pack-prompt'], 'Primeira\nSegunda!');

const continuation = setProperties('motd=linha\\\n  continuada\n', { motd: 'novo' });
assert.equal(continuation, 'motd=linha\\\n  continuada\nmotd=novo\n');

console.log('Todos os testes do codec server.properties passaram.');
