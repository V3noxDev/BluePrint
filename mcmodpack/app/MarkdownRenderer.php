<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcmodpack;

class MarkdownRenderer
{
    public static function fromHtml(string $html, string $wrapperClass = 'modpack-md'): string
    {
        $html = trim($html);
        if ($html === '') {
            return '<p>Sem descrição.</p>';
        }

        return '<div class="' . htmlspecialchars($wrapperClass, ENT_QUOTES, 'UTF-8') . '">'
            . self::sanitizeHtml(self::normalizeHtml($html))
            . '</div>';
    }

    private static function normalizeHtml(string $html): string
    {
        $html = preg_replace('/<p\s+align=["\']center["\']/i', '<p class="modpack-md__center"', $html) ?? $html;
        $html = preg_replace('/<center>/i', '<p class="modpack-md__center">', $html) ?? $html;
        $html = preg_replace('/<\/center>/i', '</p>', $html) ?? $html;

        return $html;
    }

    private static function normalizeUrl(string $url): ?string
    {
        if ($url === '') {
            return null;
        }

        if (str_starts_with($url, '//')) {
            $url = 'https:' . $url;
        }

        if (!preg_match('#^https?://#i', $url)) {
            return null;
        }

        if (preg_match('/^\s*javascript:/i', $url)) {
            return null;
        }

        return $url;
    }

    private static function extractAttribute(string $attrs, string $name): ?string
    {
        if (preg_match('/\b' . preg_quote($name, '/') . '\s*=\s*"([^"]*)"/i', $attrs, $m)) {
            return $m[1];
        }
        if (preg_match('/\b' . preg_quote($name, '/') . "\s*=\s*'([^']*)'/i", $attrs, $m)) {
            return $m[1];
        }
        if (preg_match('/\b' . preg_quote($name, '/') . '\s*=\s*([^\s>]+)/i', $attrs, $m)) {
            return $m[1];
        }

        return null;
    }

    private static function sanitizeHtml(string $html): string
    {
        $html = self::normalizeHtml($html);
        $html = preg_replace('/<script\b[^>]*>[\s\S]*?<\/script>/i', '', $html) ?? $html;
        $html = preg_replace('/\bon\w+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', $html) ?? $html;
        $html = preg_replace('/\b(href|src)\s*=\s*["\']?\s*javascript:[^"\'>\s]*/i', '$1="#"', $html) ?? $html;

        $html = preg_replace_callback(
            '/<a\b([^>]*?)>([\s\S]*?)<\/a>/i',
            function ($m) {
                $href = self::extractAttribute($m[1], 'href');
                $href = $href !== null ? self::normalizeUrl($href) : null;
                if ($href === null) {
                    return $m[2];
                }

                return '<a href="' . htmlspecialchars($href, ENT_QUOTES, 'UTF-8')
                    . '" target="_blank" rel="noopener noreferrer">' . $m[2] . '</a>';
            },
            $html
        ) ?? $html;

        $html = preg_replace_callback(
            '/<img\b([^>]*?)\/?>/i',
            function ($m) {
                $src = self::extractAttribute($m[1], 'src');
                $src = $src !== null ? self::normalizeUrl($src) : null;
                if ($src === null) {
                    return '';
                }

                $alt = self::extractAttribute($m[1], 'alt') ?? '';

                return '<img src="' . htmlspecialchars($src, ENT_QUOTES, 'UTF-8') . '" alt="'
                    . htmlspecialchars($alt, ENT_QUOTES, 'UTF-8') . '" loading="lazy" />';
            },
            $html
        ) ?? $html;

        $html = preg_replace_callback(
            '/<p\b([^>]*)>/i',
            function ($m) {
                $class = '';
                if (preg_match('/\bclass\s*=\s*(["\'])(modpack-md__center)\1/i', $m[1])) {
                    $class = ' class="modpack-md__center"';
                }

                return '<p' . $class . '>';
            },
            $html
        ) ?? $html;

        $allowed = '<p><br><hr><h1><h2><h3><h4><h5><h6><strong><em><b><i><u><del><code><pre><blockquote>'
            . '<ul><ol><li><table><thead><tbody><tr><th><td><div><span><img><a>';

        return strip_tags($html, $allowed);
    }
}
