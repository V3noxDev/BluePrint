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
            . self::sanitizeHtml(self::normalizeHtml($html))
            . '</div>';
    }

    private static function normalizeHtml(string $html): string
    {
        $html = preg_replace('/<p\s+align=["\']center["\']/i', '<p class="plugin-md__center"', $html) ?? $html;
        $html = preg_replace('/<center>/i', '<p class="plugin-md__center">', $html) ?? $html;
        $html = preg_replace('/<\/center>/i', '</p>', $html) ?? $html;

        return $html;
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

        $lines = explode("\n", $input);
        $html = [];
        $count = count($lines);
        $index = 0;

        while ($index < $count) {
            $line = $lines[$index];
            $trimmed = trim($line);

            if ($trimmed === '') {
                $index++;
                continue;
            }

            if (isset($placeholders[$trimmed])) {
                $html[] = $placeholders[$trimmed];
                $index++;
                continue;
            }

            if (preg_match('/^<([a-z][\w-]*)\b/i', $trimmed)) {
                [$block, $index] = self::collectHtmlBlock($lines, $index);
                $html[] = self::normalizeHtml($block);
                continue;
            }

            if (preg_match('/^(#{1,6})\s+(.+)$/', $trimmed, $m)) {
                $level = strlen($m[1]);
                $html[] = '<h' . $level . '>' . self::renderInline($m[2]) . '</h' . $level . '>';
                $index++;
                continue;
            }

            if (preg_match('/^(-{3,}|\*{3,}|_{3,})$/', $trimmed)) {
                $html[] = '<hr />';
                $index++;
                continue;
            }

            if (str_starts_with($trimmed, '>')) {
                [$block, $index] = self::collectBlockquote($lines, $index);
                $html[] = $block;
                continue;
            }

            if (preg_match('/^[-*+]\s+/', $trimmed)) {
                [$block, $index] = self::collectList($lines, $index, 'ul');
                $html[] = $block;
                continue;
            }

            if (preg_match('/^\d+\.\s+/', $trimmed)) {
                [$block, $index] = self::collectList($lines, $index, 'ol');
                $html[] = $block;
                continue;
            }

            if (str_starts_with($trimmed, '|')) {
                [$block, $index] = self::collectTable($lines, $index);
                if ($block !== '') {
                    $html[] = $block;
                }
                continue;
            }

            if (preg_match('/^!\[([^\]]*)\]\(([^)]+)\)\s*$/', $trimmed, $m)) {
                $html[] = '<p class="plugin-md__center">' . self::renderImage($m[1], $m[2]) . '</p>';
                $index++;
                continue;
            }

            [$paragraph, $index] = self::collectParagraph($lines, $index);
            if ($paragraph !== '') {
                $html[] = '<p>' . self::renderInline($paragraph, true) . '</p>';
            }
        }

        $output = implode("\n", $html);

        foreach ($placeholders as $key => $value) {
            $output = str_replace($key, $value, $output);
        }

        return $output;
    }

    /**
     * @return array{0: string, 1: int}
     */
    private static function collectHtmlBlock(array $lines, int $index): array
    {
        $first = trim($lines[$index]);
        if (!preg_match('/^<(\w+)/i', $first, $m)) {
            return [$first, $index + 1];
        }

        $tag = strtolower($m[1]);
        $selfClosing = in_array($tag, ['img', 'br', 'hr', 'input', 'meta', 'link'], true);
        $block = [$lines[$index]];

        if ($selfClosing || preg_match('/\/>$/', $first) || preg_match('/<\/' . preg_quote($tag, '/') . '>/i', $first)) {
            return [trim(implode("\n", $block)), $index + 1];
        }

        $index++;
        while ($index < count($lines)) {
            $block[] = $lines[$index];
            if (preg_match('/<\/' . preg_quote($tag, '/') . '\s*>/i', $lines[$index])) {
                $index++;
                break;
            }
            $index++;
        }

        return [trim(implode("\n", $block)), $index];
    }

    /**
     * @return array{0: string, 1: int}
     */
    private static function collectBlockquote(array $lines, int $index): array
    {
        $parts = [];

        while ($index < count($lines) && str_starts_with(trim($lines[$index]), '>')) {
            $parts[] = self::renderInline(preg_replace('/^>\s?/', '', trim($lines[$index])) ?? '');
            $index++;
        }

        return ['<blockquote><p>' . implode('<br />', $parts) . '</p></blockquote>', $index];
    }

    /**
     * @return array{0: string, 1: int}
     */
    private static function collectList(array $lines, int $index, string $tag): array
    {
        $pattern = $tag === 'ol' ? '/^\d+\.\s+(.+)$/' : '/^[-*+]\s+(.+)$/';
        $items = [];

        while ($index < count($lines)) {
            $trimmed = trim($lines[$index]);
            if ($trimmed === '' || !preg_match($pattern, $trimmed, $m)) {
                break;
            }
            $items[] = '<li>' . self::renderInline($m[1]) . '</li>';
            $index++;
        }

        return [$items === [] ? '' : ('<' . $tag . '>' . implode('', $items) . '</' . $tag . '>'), $index];
    }

    /**
     * @return array{0: string, 1: int}
     */
    private static function collectTable(array $lines, int $index): array
    {
        $rows = [];

        while ($index < count($lines) && str_starts_with(trim($lines[$index]), '|')) {
            $rows[] = trim($lines[$index]);
            $index++;
        }

        if ($rows === []) {
            return ['', $index];
        }

        $html = '<table><tbody>';
        $seenSeparator = false;

        foreach ($rows as $row) {
            if (preg_match('/^\|[-:\s|]+\|$/', $row)) {
                $seenSeparator = true;
                continue;
            }

            $cells = array_map('trim', explode('|', trim($row, '|')));
            $cellTag = $seenSeparator ? 'td' : 'th';

            $html .= '<tr>';
            foreach ($cells as $cell) {
                $html .= '<' . $cellTag . '>' . self::renderInline($cell) . '</' . $cellTag . '>';
            }
            $html .= '</tr>';
        }

        return [$html . '</tbody></table>', $index];
    }

    /**
     * @return array{0: string, 1: int}
     */
    private static function collectParagraph(array $lines, int $index): array
    {
        $parts = [];

        while ($index < count($lines)) {
            $trimmed = trim($lines[$index]);
            if ($trimmed === '' || self::isSpecialLine($trimmed)) {
                break;
            }
            $parts[] = $trimmed;
            $index++;
        }

        return [implode("\n", $parts), $index];
    }

    private static function isSpecialLine(string $line): bool
    {
        return preg_match('/^<([a-z][\w-]*)\b/i', $line) === 1
            || preg_match('/^(#{1,6})\s+/', $line) === 1
            || preg_match('/^[-*+]\s+/', $line) === 1
            || preg_match('/^\d+\.\s+/', $line) === 1
            || str_starts_with($line, '|')
            || str_starts_with($line, '>')
            || preg_match('/^!\[([^\]]*)\]\(([^)]+)\)\s*$/', $line) === 1
            || preg_match('/^(-{3,}|\*{3,}|_{3,})$/', $line) === 1
            || str_starts_with($line, '```');
    }

    private static function renderImage(string $alt, string $src): string
    {
        $src = htmlspecialchars(trim($src), ENT_QUOTES, 'UTF-8');
        $alt = htmlspecialchars($alt, ENT_QUOTES, 'UTF-8');

        if (!preg_match('/^https?:\/\//i', $src)) {
            return '';
        }

        return '<img src="' . $src . '" alt="' . $alt . '" loading="lazy" />';
    }

    private static function renderInline(string $text, bool $allowBreaks = false): string
    {
        $text = htmlspecialchars($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        $text = preg_replace_callback(
            '/!\[([^\]]*)\]\(([^)]+)\)/',
            fn ($m) => self::renderImage($m[1], $m[2]),
            $text
        ) ?? $text;

        $text = preg_replace_callback(
            '/\[([^\]]+)\]\(([^)]+)\)/',
            function ($m) {
                $href = htmlspecialchars(trim($m[2]), ENT_QUOTES, 'UTF-8');
                if (!preg_match('/^https?:\/\//i', $href)) {
                    return $m[1];
                }

                return '<a href="' . $href . '" target="_blank" rel="noopener noreferrer">' . $m[1] . '</a>';
            },
            $text
        ) ?? $text;

        $text = preg_replace('/~~(.+?)~~/s', '<del>$1</del>', $text) ?? $text;
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
                if (preg_match('/\bclass\s*=\s*(["\'])(plugin-md__center)\1/i', $m[1])) {
                    $class = ' class="plugin-md__center"';
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
