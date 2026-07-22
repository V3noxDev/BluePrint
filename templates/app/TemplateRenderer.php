<?php

namespace Pterodactyl\BlueprintFramework\Extensions\templates;

use Illuminate\Support\Facades\Http;

class TemplateRenderer
{
    public function __construct(private TemplateContextBuilder $contextBuilder) {}

    public function render(string $template, array $context): string
    {
        return preg_replace_callback('/\{\{\s*(.+?)\s*\}\}/s', function (array $matches) use ($context) {
            $expr = trim($matches[1]);

            return (string) $this->evaluate($expr, $context);
        }, $template);
    }

    private function evaluate(string $expr, array $context): mixed
    {
        if (preg_match('/^\$request\s*\(\s*[\'"](\w+)[\'"]\s*,\s*[\'"]([^\'"]+)[\'"]\s*(?:,\s*(\[.*\]))?\s*\)$/s', $expr, $m)) {
            return $this->httpRequest($m[1], $m[2], isset($m[3]) ? json_decode($m[3], true) ?? [] : []);
        }

        if (preg_match('/^\$follow_redirects\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)$/', $expr, $m)) {
            return $this->followRedirects($m[1]);
        }

        if (preg_match('/^map\(\$([a-zA-Z_][\w]*),\s*\'([^\']+)\'\)$/', $expr, $m)) {
            $value = (string) ($context[$m[1]] ?? '');

            foreach (explode(',', $m[2]) as $pair) {
                $parts = explode(':', trim($pair), 2);
                if (count($parts) === 2 && $parts[0] === $value) {
                    return $parts[1];
                }
            }

            return $value;
        }

        if (preg_match('/^\$([a-zA-Z_][\w]*)$/', $expr, $m)) {
            return $context[$m[1]] ?? '';
        }

        if (preg_match('/^\$([a-zA-Z_][\w]*)\[\'([^\']+)\'\]$/', $expr, $m)) {
            $root = $context[$m[1]] ?? null;
            if (is_array($root)) {
                return $root[$m[2]] ?? '';
            }

            return '';
        }

        if (preg_match('/^\$([a-zA-Z_][\w]*)\[\'([^\']+)\'\]\[\'([^\']+)\'\]$/', $expr, $m)) {
            $root = $context[$m[1]][$m[2]] ?? null;
            if (is_array($root)) {
                return $root[$m[3]] ?? '';
            }

            return '';
        }

        return $expr;
    }

    private function httpRequest(string $method, string $url, array $options = []): string
    {
        try {
            $response = Http::timeout(30)->send(strtoupper($method), $url, $options);

            return $response->body();
        } catch (\Throwable) {
            return '';
        }
    }

    private function followRedirects(string $url): string
    {
        try {
            $response = Http::withOptions(['allow_redirects' => true])->head($url);

            return (string) ($response->effectiveUri() ?? $url);
        } catch (\Throwable) {
            return $url;
        }
    }
}
