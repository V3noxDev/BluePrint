<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcplugins;

class MarkdownRenderer
{
    public static function toHtml(string $input, string $wrapperClass = 'plugin-md'): string
    {
        $input = trim(str_replace(["\r\n", "\r"], "\n", $input));
        if ($input === '') {
            return '<p>Sem descrição.</p>';
        }

        $html = self::parse($input);

        return '<div class="' . htmlspecialchars($wrapperClass, ENT_QUOTES, 'UTF-8') . '">'
            . self::sanitizeHtml($html)
            . '</div>';
    }

    public static function fromHtml(string $html, string $wrapperClass = 'plugin-md'): string
    {
        $html = trim($html);
        if ($html === '') {
            return '<p>Sem descrição.</p>';
        }

        return '<div class="' . htmlspecialchars($wrapperClass, ENT_QUOTES, 'UTF-8') . '">'
            . self::sanitizeHtml($html)
            . '</div>';
    }

    private static function parse(string $input): string
    {
        $placeholders = [];
        $i = 0;

        $input = preg_replace_callback('/```([\w-]*)\n([\s\S]*?)```/', function ($m) use (&$placeholders, &$i) {
            $key = '%%CODEBLOCK' . ($i++) . '%%';
            $lang = htmlspecialchars($m[1], ENT_QUOTES, 'UTF-8');
            $code = htmlspecialchars($m[2], ENT_QUOTES, 'UTF-8');
            $placeholders[$key] = '<pre><code'
                . ($lang !== '' ? ' class="language-' . $lang . '"' : '')
                . '>' . $code . '</code></pre>';

            return $key;
        }, $input) ?? $input;

        $blocks = preg_split('/\n{2,}/', $input) ?: [];
        $html = [];

        foreach ($blocks as $block) {
            $block = trim($block);
            if ($block === '') {
                continue;
            }

            if (isset($placeholders[$block])) {
                $html[] = $placeholders[$block];
                continue;
            }

            if (preg_match('/^<([a-z][\w-]*)\b/i', $block)) {
                $html[] = $block;
                continue;
            }

            if (preg_match('/^#{1,6}\s+/m', $block)) {
                $html[] = self::renderHeaders($block);
                continue;
            }

            if (preg_match('/^>\s+/m', $block)) {
                $html[] = self::renderBlockquote($block);
                continue;
            }

            if (preg_match('/^[-*+]\s+/m', $block)) {
                $html[] = self::renderList($block, 'ul');
                continue;
            }

            if (preg_match('/^\d+\.\s+/m', $block)) {
                $html[] = self::renderList($block, 'ol');
                continue;
            }

            if (str_contains($block, '|') && preg_match('/^\|.+\|$/m', $block)) {
                $html[] = self::renderTable($block);
                continue;
            }

            if (preg_match('/^(-{3,}|\*{3,}|_{3,})$/', $block)) {
                $html[] = '<hr />';
                continue;
            }

            $html[] = '<p>' . self::renderInline($block, true) . '</p>';
        }

        $output = implode("\n", $html);

        foreach ($placeholders as $key => $value) {
            $output = str_replace($key, $value, $output);
        }

        return $output;
    }

    private static function renderHeaders(string $block): string
    {
        $lines = explode("\n", $block);
        $out = [];

        foreach ($lines as $line) {
            if (preg_match('/^(#{1,6})\s+(.+)$/', $line, $m)) {
                $level = strlen($m[1]);
                $out[] = '<h' . $level . '>' . self::renderInline($m[2]) . '</h' . $level . '>';
            } else {
                $out[] = '<p>' . self::renderInline($line, true) . '</p>';
            }
        }

        return implode("\n", $out);
    }

    private static function renderBlockquote(string $block): string
    {
        $lines = array_map(
            fn ($line) => self::renderInline(preg_replace('/^>\s?/', '', $line) ?? ''),
            explode("\n", $block)
        );

        return '<blockquote><p>' . implode('<br />', $lines) . '</p></blockquote>';
    }

    private static function renderList(string $block, string $tag): string
    {
        $pattern = $tag === 'ol' ? '/^\d+\.\s+(.+)$/' : '/^[-*+]\s+(.+)$/';
        $items = [];

        foreach (explode("\n", $block) as $line) {
            if (preg_match($pattern, $line, $m)) {
                $items[] = '<li>' . self::renderInline($m[1]) . '</li>';
            }
        }

        return $items === [] ? '' : ('<' . $tag . '>' . implode('', $items) . '</' . $tag . '>');
    }

    private static function renderTable(string $block): string
    {
        $rows = array_values(array_filter(array_map('trim', explode("\n", $block))));
        if ($rows === []) {
            return '';
        }

        $html = '<table><tbody>';
        $seenSeparator = false;

        foreach ($rows as $row) {
            if (!str_starts_with($row, '|')) {
                continue;
            }

            if (preg_match('/^\|[-:\s|]+\|$/', $row)) {
                $seenSeparator = true;
                continue;
            }

            $cells = array_map('trim', explode('|', trim($row, '|')));
            $tag = $seenSeparator ? 'td' : 'th';

            $html .= '<tr>';
            foreach ($cells as $cell) {
                $html .= '<' . $tag . '>' . self::renderInline($cell) . '</' . $tag . '>';
            }
            $html .= '</tr>';
        }

        return $html . '</tbody></table>';
    }

    private static function renderInline(string $text, bool $allowBreaks = false): string
    {
        $text = htmlspecialchars($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        $text = preg_replace('/!\[([^\]]*)\]\(([^)]+)\)/', '<img src="$2" alt="$1" loading="lazy" />', $text) ?? $text;
        $text = preg_replace('/\[([^\]]+)\]\(([^)]+)\)/', '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>', $text) ?? $text;
        $text = preg_replace('/\*\*(.+?)\*\*/s', '<strong>$1</strong>', $text) ?? $text;
        $text = preg_replace('/__(.+?)__/s', '<strong>$1</strong>', $text) ?? $text;
        $text = preg_replace('/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/s', '<em>$1</em>', $text) ?? $text;
        $text = preg_replace('/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/s', '<em>$1</em>', $text) ?? $text;
        $text = preg_replace('/`([^`]+)`/', '<code>$1</code>', $text) ?? $text;

        if ($allowBreaks) {
            $text = nl2br($text);
        }

        return $text;
    }

    private static function sanitizeHtml(string $html): string
    {
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
                    return htmlspecialchars($m[2], ENT_QUOTES, 'UTF-8');
                }

                return '<a href="' . htmlspecialchars($href[2], ENT_QUOTES, 'UTF-8')
                    . '" target="_blank" rel="noopener noreferrer">'
                    . $m[2]
                    . '</a>';
            },
            $html
        ) ?? $html;

        $allowed = '<p><br><hr><h1><h2><h3><h4><h5><h6><strong><em><b><i><u><code><pre><blockquote>'
            . '<ul><ol><li><table><thead><tbody><tr><th><td><div><span><img><a>';

        return strip_tags($html, $allowed);
    }
}
