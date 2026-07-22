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

    private static function sanitizeHtml(string $html): string
    {
        $html = self::normalizeHtml($html);
        $html = preg_replace('/<script\b[^>]*>[\s\S]*?<\/script>/i', '', $html) ?? $html;
        $html = preg_replace('/\s+on\w+\s*=\s*(["\']).*?\1/i', '', $html) ?? $html;
        $html = preg_replace('/\s+on\w+\s*=\s*[^\s>]+/i', '', $html) ?? $html;
        $html = preg_replace('/javascript:/i', '', $html) ?? $html;

        $html = preg_replace_callback(
            '/<img\b([^>]*)>/i',
            function ($m) {
                $attrs = $m[1];
                if (!preg_match('/\bsrc\s*=\s*(["\'])(https?:\/\/[^"\']+)\1/i', $attrs, $src)) {
                    return '';
                }
                $alt = '';
                if (preg_match('/\balt\s*=\s*(["\'])(.*?)\1/i', $attrs, $altMatch)) {
                    $alt = ' alt="' . htmlspecialchars($altMatch[2], ENT_QUOTES, 'UTF-8') . '"';
                }

                return '<img src="' . htmlspecialchars($src[2], ENT_QUOTES, 'UTF-8') . '"' . $alt . ' loading="lazy" />';
            },
            $html
        ) ?? $html;

        $html = preg_replace_callback(
            '/<a\b([^>]*)>(.*?)<\/a>/is',
            function ($m) {
                if (!preg_match('/\bhref\s*=\s*(["\'])(https?:\/\/[^"\']+)\1/i', $m[1], $href)) {
                    return htmlspecialchars(strip_tags($m[2]), ENT_QUOTES, 'UTF-8');
                }

                return '<a href="' . htmlspecialchars($href[2], ENT_QUOTES, 'UTF-8')
                    . '" target="_blank" rel="noopener noreferrer">'
                    . strip_tags($m[2], '<strong><em><b><i><code>')
                    . '</a>';
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
