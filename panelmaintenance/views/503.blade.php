@php
    $defaults = [
        'title' => 'Estaremos de volta em breve!',
        'headline_before' => 'Estaremos de volta em',
        'headline_highlight' => 'breve!',
        'message' => 'O painel está em manutenção no momento. Volte mais tarde ou fique conectado:',
        'retry_minutes' => 60,
        'site_url' => 'https://blackhosting.com.br',
        'store_url' => 'https://financeiro.blackhosting.com.br',
        'discord_url' => 'https://discord.gg/blackhosting',
        'brand_name' => 'BlackHosting',
        'image_url' => '',
    ];

    $config = $defaults;

    foreach ([
        storage_path('framework/panelmaintenance.json'),
        storage_path('framework/panelmaintenance-settings.json'),
    ] as $configPath) {
        if (!is_file($configPath)) {
            continue;
        }
        $data = json_decode((string) file_get_contents($configPath), true);
        if (is_array($data)) {
            $config = array_merge($config, $data);
        }
    }

    $headlineBefore = $config['headline_before'] ?? $defaults['headline_before'];
    $headlineHighlight = $config['headline_highlight'] ?? $defaults['headline_highlight'];
    $message = $config['message'] ?? $defaults['message'];
    $siteUrl = $config['site_url'] ?? $defaults['site_url'];
    $storeUrl = $config['store_url'] ?? $defaults['store_url'];
    $discordUrl = $config['discord_url'] ?? $defaults['discord_url'];
    $pageTitle = $config['title'] ?? $defaults['title'];
    $imageUrl = trim((string) ($config['image_url'] ?? ''));
@endphp
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>{{ $pageTitle }}</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            min-height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #1a1b1e;
            color: #e3e5e8;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 32px 20px;
        }

        .pm-screen {
            width: 100%;
            max-width: 720px;
            display: flex;
            align-items: center;
            gap: 28px;
        }

        @media (max-width: 640px) {
            .pm-screen {
                flex-direction: column;
                text-align: center;
                gap: 20px;
            }
        }

        .pm-cone {
            flex-shrink: 0;
            width: 88px;
            height: 88px;
            object-fit: contain;
            filter: drop-shadow(0 8px 24px rgba(249, 115, 22, 0.35));
            animation: pm-float 4s ease-in-out infinite;
        }

        .pm-cone--inline {
            display: block;
        }

        @keyframes pm-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
        }

        .pm-content {
            flex: 1;
            min-width: 0;
        }

        .pm-title {
            font-size: clamp(1.65rem, 4vw, 2.1rem);
            font-weight: 700;
            line-height: 1.2;
            color: #f2f3f5;
            margin-bottom: 10px;
            letter-spacing: -0.02em;
        }

        .pm-title span {
            color: #f97316;
        }

        .pm-message {
            font-size: 0.95rem;
            line-height: 1.55;
            color: #b5bac1;
            margin-bottom: 22px;
            max-width: 520px;
        }

        .pm-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }

        @media (max-width: 640px) {
            .pm-actions {
                justify-content: center;
            }
        }

        .pm-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            border-radius: 8px;
            background: #2b2d31;
            border: 1px solid #3f4147;
            color: #dbdee1;
            text-decoration: none;
            font-size: 0.875rem;
            font-weight: 500;
            transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.15s;
        }

        .pm-btn:hover {
            background: #313338;
            border-color: #4e5058;
            color: #fff;
            transform: translateY(-1px);
        }

        .pm-btn svg {
            width: 18px;
            height: 18px;
            flex-shrink: 0;
        }

        .pm-btn--discord:hover { border-color: #5865f2; }
        .pm-btn--site:hover { border-color: #22c55e; }
        .pm-btn--store:hover { border-color: #f59e0b; }
    </style>
</head>
<body>
    <main class="pm-screen">
        @if($imageUrl !== '')
            <img
                class="pm-cone"
                src="{{ $imageUrl }}"
                alt=""
                width="88"
                height="88"
                aria-hidden="true"
            />
        @else
            <svg class="pm-cone pm-cone--inline" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M60 8L22 98h76L60 8z" fill="#f97316" stroke="#ea580c" stroke-width="3" stroke-linejoin="round"/>
                <path d="M34 78h52" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity="0.95"/>
                <path d="M38 58h44" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity="0.95"/>
                <ellipse cx="60" cy="98" rx="34" ry="8" fill="#0f172a" opacity="0.35"/>
            </svg>
        @endif

        <div class="pm-content">
            <h1 class="pm-title">
                {{ $headlineBefore }} <span>{{ $headlineHighlight }}</span>
            </h1>
            <p class="pm-message">{{ $message }}</p>

            <div class="pm-actions">
                <a class="pm-btn pm-btn--discord" href="{{ $discordUrl }}" target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157 1.085-2.157 2.419 0 1.333.956 2.419 2.157 2.419 1.21 0 2.176-1.096 2.157-2.42 0-1.333-.956-2.418-2.157-2.418zm7.975 0c-1.183 0-2.157 1.085-2.157 2.419 0 1.333.955 2.419 2.157 2.419 1.21 0 2.176-1.096 2.157-2.42 0-1.333-.946-2.418-2.157-2.418z"/>
                    </svg>
                    Discord
                </a>
                <a class="pm-btn pm-btn--site" href="{{ $siteUrl }}" target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    Site
                </a>
                <a class="pm-btn pm-btn--store" href="{{ $storeUrl }}" target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    Loja
                </a>
            </div>
        </div>
    </main>
</body>
</html>
