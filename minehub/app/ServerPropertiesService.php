<?php

namespace Pterodactyl\BlueprintFramework\Extensions\minehub;

class ServerPropertiesService
{
    private const PROPERTIES_FILE = '/server.properties';

    public static function parse(string $content): array
    {
        $properties = [];
        $lines = preg_split('/\r\n|\r|\n/', $content);

        foreach ($lines as $line) {
            $line = trim($line);

            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            $parts = explode('=', $line, 2);
            if (count($parts) === 2) {
                $properties[trim($parts[0])] = trim($parts[1]);
            }
        }

        return $properties;
    }

    public static function serialize(array $properties, ?string $original = null): string
    {
        $comments = [];
        $order = [];

        if ($original !== null) {
            foreach (preg_split('/\r\n|\r|\n/', $original) as $line) {
                $trimmed = trim($line);

                if ($trimmed === '' || str_starts_with($trimmed, '#')) {
                    $comments[] = $line;
                    continue;
                }

                $parts = explode('=', $trimmed, 2);
                if (count($parts) === 2) {
                    $key = trim($parts[0]);
                    if (!in_array($key, $order, true)) {
                        $order[] = $key;
                    }
                }
            }
        }

        foreach (array_keys($properties) as $key) {
            if (!in_array($key, $order, true)) {
                $order[] = $key;
            }
        }

        $lines = $comments;
        if (!empty($comments)) {
            $lines[] = '';
        }

        foreach ($order as $key) {
            if (array_key_exists($key, $properties)) {
                $lines[] = $key . '=' . $properties[$key];
            }
        }

        return implode("\n", $lines) . "\n";
    }

    public static function getFilePath(): string
    {
        return self::PROPERTIES_FILE;
    }
}
