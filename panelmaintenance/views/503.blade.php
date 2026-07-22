@php
    $configPath = storage_path('framework/panelmaintenance.json');
    $config = is_file($configPath)
        ? (json_decode((string) file_get_contents($configPath), true) ?: [])
        : [];

    $title = $config['title'] ?? 'Painel em manutenção';
    $message = $config['message'] ?? 'Estamos realizando melhorias no painel. Voltaremos em breve!';
    $retry_minutes = (int) ($config['retry_minutes'] ?? 60);
    $site_url = $config['site_url'] ?? 'https://blackhosting.com.br';
    $store_url = $config['store_url'] ?? 'https://financeiro.blackhosting.com.br';
    $discord_url = $config['discord_url'] ?? 'https://discord.gg/blackhosting';
    $brand_name = $config['brand_name'] ?? 'BlackHosting';
@endphp
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }}</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            min-height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: radial-gradient(ellipse 120% 80% at 50% -20%, #1e3a5f 0%, #0b0f17 45%, #06080c 100%);
            color: #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }
        .pm-wrap { width: 100%; max-width: 520px; text-align: center; }
        .pm-brand {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 28px;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: #94a3b8;
        }
        .pm-brand__dot {
            width: 8px; height: 8px;
            border-radius: 50%;
            background: #f59e0b;
            box-shadow: 0 0 12px #f59e0b;
            animation: pm-pulse 2s ease-in-out infinite;
        }
        @keyframes pm-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.85); }
        }
        .pm-card {
            background: rgba(15, 23, 42, 0.85);
            border: 1px solid rgba(148, 163, 184, 0.12);
            border-radius: 20px;
            padding: 40px 32px 32px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.04);
            backdrop-filter: blur(12px);
        }
        .pm-icon {
            width: 72px; height: 72px;
            margin: 0 auto 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.15));
            border: 1px solid rgba(59,130,246,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .pm-icon svg {
            width: 36px; height: 36px; color: #60a5fa;
            animation: pm-wobble 3s ease-in-out infinite;
        }
        @keyframes pm-wobble {
            0%, 100% { transform: rotate(-8deg); }
            50% { transform: rotate(8deg); }
        }
        .pm-title {
            font-size: 1.65rem;
            font-weight: 700;
            color: #f8fafc;
            margin-bottom: 12px;
            line-height: 1.25;
        }
        .pm-message {
            font-size: 1rem;
            color: #94a3b8;
            line-height: 1.65;
            margin-bottom: 28px;
        }
        .pm-retry {
            font-size: 0.8rem;
            color: #64748b;
            margin-bottom: 28px;
        }
        .pm-links {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 24px;
        }
        @media (max-width: 480px) {
            .pm-links { grid-template-columns: 1fr; }
        }
        .pm-link {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            padding: 14px 10px;
            border-radius: 12px;
            background: rgba(30, 41, 59, 0.6);
            border: 1px solid rgba(148, 163, 184, 0.1);
            color: #cbd5e1;
            text-decoration: none;
            font-size: 0.8rem;
            font-weight: 500;
            transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.15s;
        }
        .pm-link:hover {
            background: rgba(59, 130, 246, 0.15);
            border-color: rgba(59, 130, 246, 0.35);
            color: #f1f5f9;
            transform: translateY(-2px);
        }
        .pm-link__icon { font-size: 1.25rem; }
        .pm-footer {
            font-size: 0.75rem;
            color: #475569;
        }
        .pm-footer a { color: #64748b; text-decoration: none; }
        .pm-footer a:hover { color: #94a3b8; }
    </style>
</head>
<body>
    <div class="pm-wrap">
        <div class="pm-brand">
            <span class="pm-brand__dot"></span>
            <span>{{ $brand_name }}</span>
        </div>

        <div class="pm-card">
            <div class="pm-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                </svg>
            </div>

            <h1 class="pm-title">{{ $title }}</h1>
            <p class="pm-message">{{ $message }}</p>

            @if(!empty($retryAfter))
                <p class="pm-retry">Tente novamente em aproximadamente {{ (int) ceil($retryAfter / 60) }} minutos.</p>
            @else
                <p class="pm-retry">Tente novamente em aproximadamente {{ $retry_minutes }} minutos.</p>
            @endif

            <div class="pm-links">
                <a class="pm-link" href="{{ $site_url }}" target="_blank" rel="noopener">
                    <span class="pm-link__icon">🌐</span>
                    <span>Site</span>
                </a>
                <a class="pm-link" href="{{ $store_url }}" target="_blank" rel="noopener">
                    <span class="pm-link__icon">🛒</span>
                    <span>Loja</span>
                </a>
                <a class="pm-link" href="{{ $discord_url }}" target="_blank" rel="noopener">
                    <span class="pm-link__icon">💬</span>
                    <span>Discord</span>
                </a>
            </div>

            <p class="pm-footer">
                &copy; {{ date('Y') }}
                <a href="{{ $site_url }}">{{ $brand_name }}</a>
            </p>
        </div>
    </div>
</body>
</html>
