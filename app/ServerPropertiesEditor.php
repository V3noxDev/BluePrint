<?php

namespace Pterodactyl\BlueprintFramework\Extensions\minecraftsuite;

class ServerPropertiesEditor
{
    /**
     * Parse a server.properties file into a flat key/value map.
     */
    public function parse(string $raw): array
    {
        $properties = [];

        foreach ($this->tokenize($raw) as $entry) {
            if ($entry['type'] !== 'property') {
                continue;
            }

            $properties[$entry['key']] = $entry['value'];
        }

        return $properties;
    }

    /**
     * Merge structured updates into the original file while preserving comments and order.
     */
    public function mergeAndSerialize(string $original, array $updates): string
    {
        $tokens = $this->tokenize($original);
        $normalized = $this->normalizeProperties($updates);
        $applied = [];
        $lines = [];

        foreach ($tokens as $entry) {
            if ($entry['type'] !== 'property') {
                $lines[] = $entry['raw'];
                continue;
            }

            $key = $entry['key'];

            if (!array_key_exists($key, $normalized)) {
                $lines[] = $entry['raw'];
                continue;
            }

            $applied[$key] = true;
            $lines[] = $key . '=' . $normalized[$key];
        }

        foreach ($normalized as $key => $value) {
            if (array_key_exists($key, $applied)) {
                continue;
            }

            $lines[] = $key . '=' . $value;
        }

        return $this->normalizeRaw(implode("\n", $lines));
    }

    /**
     * Serialize a raw text version with consistent line endings.
     */
    public function normalizeRaw(string $raw): string
    {
        $normalized = str_replace(["\r\n", "\r"], "\n", $raw);

        return rtrim($normalized, "\n") . "\n";
    }

    private function tokenize(string $raw): array
    {
        $tokens = [];
        $lines = preg_split('/\r\n|\r|\n/', $raw);

        foreach ($lines as $line) {
            if ($line === '') {
                $tokens[] = [
                    'type' => 'blank',
                    'raw' => '',
                ];
                continue;
            }

            if (str_starts_with(ltrim($line), '#')) {
                $tokens[] = [
                    'type' => 'comment',
                    'raw' => $line,
                ];
                continue;
            }

            if (preg_match('/^\s*([^:=\s][^:=]*?)\s*[:=]\s*(.*)$/', $line, $matches) === 1) {
                $tokens[] = [
                    'type' => 'property',
                    'raw' => $line,
                    'key' => trim($matches[1]),
                    'value' => $matches[2],
                ];
                continue;
            }

            $tokens[] = [
                'type' => 'comment',
                'raw' => $line,
            ];
        }

        return $tokens;
    }

    private function normalizeProperties(array $properties): array
    {
        $normalized = [];

        foreach ($properties as $key => $value) {
            if (!is_string($key) || trim($key) === '') {
                continue;
            }

            $normalized[trim($key)] = $this->stringify($value);
        }

        return $normalized;
    }

    private function stringify(mixed $value): string
    {
        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }

        if (is_null($value)) {
            return '';
        }

        if (is_scalar($value)) {
            return (string) $value;
        }

        return json_encode($value, JSON_UNESCAPED_SLASHES) ?: '';
    }
}
