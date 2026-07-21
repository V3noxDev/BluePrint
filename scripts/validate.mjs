#!/usr/bin/env node

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const requiredFiles = [
    'conf.yml',
    'admin/view.blade.php',
    'assets/icon.svg',
    'components/Components.yml',
    'components/sections/PropertiesManager.tsx',
    'components/lib/properties.ts',
    'components/lib/schema.ts',
];

const failures = [];

for (const file of requiredFiles) {
    if (!existsSync(resolve(root, file))) {
        failures.push(`Arquivo obrigatório ausente: ${file}`);
    }
}

const manifest = readFileSync(resolve(root, 'conf.yml'), 'utf8');
const schema = readFileSync(resolve(root, 'components/lib/schema.ts'), 'utf8');
const components = readFileSync(resolve(root, 'components/Components.yml'), 'utf8');

if (!/identifier:\s*['"]serverproperties['"]/.test(manifest)) {
    failures.push('O identificador do conf.yml deve ser serverproperties.');
}

if (!/target:\s*['"]beta-2026-06['"]/.test(manifest)) {
    failures.push('O alvo do Blueprint deve ser beta-2026-06.');
}

if (!/Component:\s*['"]sections\/PropertiesManager['"]/.test(components)) {
    failures.push('A rota do Components.yml não aponta para PropertiesManager.');
}

const definitionSection = schema.slice(
    schema.indexOf('export const propertyDefinitions'),
    schema.indexOf('export const propertyPresets')
);
const keys = Array.from(definitionSection.matchAll(/\bkey:\s*'([^']+)'/g), (match) => match[1]);
const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);

if (duplicates.length) {
    failures.push(`Chaves duplicadas no schema: ${Array.from(new Set(duplicates)).join(', ')}`);
}

if (keys.length < 35) {
    failures.push(`O schema possui somente ${keys.length} opções; eram esperadas pelo menos 35.`);
}

if (failures.length) {
    console.error('Validação falhou:\n');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
}

console.log(`Validação concluída: ${keys.length} propriedades e ${requiredFiles.length} arquivos obrigatórios.`);
