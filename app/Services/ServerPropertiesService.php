<?php

namespace {appcontext}\Services;

use Illuminate\Validation\ValidationException;

final class ServerPropertiesService
{
    private const KEY_PATTERN = '/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/';
    private const BOOLEAN_KEYS = [
        'allow-flight',
        'enable-command-block',
        'enforce-whitelist',
        'hardcore',
        'online-mode',
        'pvp',
        'white-list',
    ];
    private const ENUM_KEYS = [
        'difficulty' => ['peaceful', 'easy', 'normal', 'hard'],
        'gamemode' => ['survival', 'creative', 'adventure', 'spectator'],
    ];
    private const INTEGER_RANGES = [
        'max-players' => [1, 100000],
        'simulation-distance' => [2, 32],
        'spawn-protection' => [0, 10000],
        'view-distance' => [2, 32],
    ];

    public function parse(string $content): array
    {
        $properties = [];

        foreach (preg_split('/\r\n|\r|\n/', $content) ?: [] as $line) {
            $trimmed = ltrim($line);
            if ($trimmed === '' || str_starts_with($trimmed, '#') || str_starts_with($trimmed, '!')) {
                continue;
            }

            $separator = strpos($line, '=');
            if ($separator === false) {
                $separator = strpos($line, ':');
            }

            if ($separator === false) {
                continue;
            }

            $key = trim(substr($line, 0, $separator));
            if ($key !== '') {
                $properties[$key] = trim(substr($line, $separator + 1));
            }
        }

        ksort($properties, SORT_NATURAL | SORT_FLAG_CASE);

        return $properties;
    }

    public function update(string $content, array $updates, array $removals = []): string
    {
        $updates = $this->validateUpdates($updates);
        $removals = $this->validateRemovals($removals);
        $newline = str_contains($content, "\r\n") ? "\r\n" : "\n";
        $hadTrailingNewline = $content === '' || str_ends_with($content, "\n") || str_ends_with($content, "\r");
        $seen = [];
        $lines = preg_split('/\r\n|\r|\n/', $content) ?: [];

        if ($hadTrailingNewline && end($lines) === '') {
            array_pop($lines);
        }

        foreach ($lines as $index => $line) {
            $key = $this->lineKey($line);
            if ($key === null) {
                continue;
            }

            if (in_array($key, $removals, true)) {
                unset($lines[$index]);
                continue;
            }

            if (array_key_exists($key, $updates)) {
                $lines[$index] = $key . '=' . $updates[$key];
                $seen[$key] = true;
            }
        }

        foreach ($updates as $key => $value) {
            if (!isset($seen[$key]) && !in_array($key, $removals, true)) {
                $lines[] = $key . '=' . $value;
            }
        }

        $result = implode($newline, array_values($lines));

        return $hadTrailingNewline || $result === '' ? $result . $newline : $result;
    }

    private function validateUpdates(array $updates): array
    {
        $validated = [];

        foreach ($updates as $key => $value) {
            if (!is_string($key) || !preg_match(self::KEY_PATTERN, $key)) {
                throw ValidationException::withMessages([
                    'properties' => sprintf('A chave "%s" não é válida.', (string) $key),
                ]);
            }

            if (!is_string($value) || mb_strlen($value) > 2048 || preg_match('/[\r\n\0]/', $value)) {
                throw ValidationException::withMessages([
                    "properties.$key" => 'O valor deve ser texto de uma linha com no máximo 2048 caracteres.',
                ]);
            }

            if (in_array($key, self::BOOLEAN_KEYS, true) && !in_array($value, ['true', 'false'], true)) {
                throw ValidationException::withMessages([
                    "properties.$key" => 'O valor deve ser true ou false.',
                ]);
            }

            if (isset(self::ENUM_KEYS[$key]) && !in_array($value, self::ENUM_KEYS[$key], true)) {
                throw ValidationException::withMessages([
                    "properties.$key" => 'O valor selecionado não é permitido.',
                ]);
            }

            if (isset(self::INTEGER_RANGES[$key])) {
                [$minimum, $maximum] = self::INTEGER_RANGES[$key];
                if (!preg_match('/^-?\d+$/', $value) || (int) $value < $minimum || (int) $value > $maximum) {
                    throw ValidationException::withMessages([
                        "properties.$key" => sprintf('Use um número inteiro entre %d e %d.', $minimum, $maximum),
                    ]);
                }
            }

            $validated[$key] = $value;
        }

        return $validated;
    }

    private function validateRemovals(array $removals): array
    {
        $validated = [];

        foreach ($removals as $key) {
            if (!is_string($key) || !preg_match(self::KEY_PATTERN, $key)) {
                throw ValidationException::withMessages([
                    'remove' => 'Uma das chaves solicitadas para remoção não é válida.',
                ]);
            }

            $validated[] = $key;
        }

        return array_values(array_unique($validated));
    }

    private function lineKey(string $line): ?string
    {
        $trimmed = ltrim($line);
        if ($trimmed === '' || str_starts_with($trimmed, '#') || str_starts_with($trimmed, '!')) {
            return null;
        }

        $equals = strpos($line, '=');
        $colon = strpos($line, ':');
        $positions = array_filter([$equals, $colon], static fn ($position): bool => $position !== false);

        if ($positions === []) {
            return null;
        }

        $key = trim(substr($line, 0, min($positions)));

        return $key === '' ? null : $key;
    }
}
