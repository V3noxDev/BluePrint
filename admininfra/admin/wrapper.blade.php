@php
    $blueprint = app(\Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Admin\BlueprintAdminLibrary::class);
    $accent = (string) ($blueprint->dbGet('admininfra', 'accent_color', '#3b82f6') ?: '#3b82f6');
    $compact = ((string) ($blueprint->dbGet('admininfra', 'compact_mode', '1') ?: '1')) === '1';
@endphp
<style>
    :root {
        --ap-accent: {{ $accent }};
        --ap-accent-soft: {{ $accent }}2e;
        --ap-accent-hover: {{ $accent }};
        --ap-bg: #09090b;
        --ap-bg-elevated: #111114;
        --ap-surface: #18181b;
        --ap-surface-2: #1f1f23;
        --ap-border: #2e2e33;
        --ap-border-strong: #3f3f46;
        --ap-text: #f4f4f5;
        --ap-muted: #a1a1aa;
        --ap-white: #ffffff;
        --ap-black: #000000;
        --ap-success: #22c55e;
        --ap-warning: #f59e0b;
        --ap-danger: #ef4444;
        --ap-info: #38bdf8;
        --ap-radius: 10px;
        --ap-radius-sm: 8px;
        --ap-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
        --ap-font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        --ap-compact: {{ $compact ? '1' : '0' }};
        --ai-accent: var(--ap-accent);
        --ai-accent-soft: var(--ap-accent-soft);
        --ai-bg: var(--ap-bg);
        --ai-surface: var(--ap-bg-elevated);
        --ai-surface-2: var(--ap-surface);
        --ai-surface-3: var(--ap-surface-2);
        --ai-border: color-mix(in srgb, var(--ap-border) 70%, transparent);
        --ai-border-strong: var(--ap-border-strong);
        --ai-text: var(--ap-text);
        --ai-muted: var(--ap-muted);
        --ai-success: var(--ap-success);
        --ai-warning: var(--ap-warning);
        --ai-danger: var(--ap-danger);
        --ai-radius: var(--ap-radius);
        --ai-radius-sm: var(--ap-radius-sm);
        --ai-shadow: var(--ap-shadow);
    }
</style>
@if($compact)
<script>document.documentElement.classList.add('ai-compact');</script>
@endif
{!! $blueprint->importScript('/extensions/admininfra/node-view.js') !!}
<script>
    (function () {
        if (new URLSearchParams(location.search).get('ai_embed') === '1' || window.self !== window.top) {
            document.documentElement.classList.add('ai-embed');
        }
    })();
</script>
