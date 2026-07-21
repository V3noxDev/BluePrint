<?php

use Pterodactyl\BlueprintFramework\Extensions\bedrockversions\BedrockVersionService;
use Pterodactyl\BlueprintFramework\Libraries\ExtensionLibrary\Console\BlueprintConsoleLibrary as BlueprintExtensionLibrary;

/** @var BedrockVersionService $service */
$service = app(BedrockVersionService::class);
/** @var BlueprintExtensionLibrary $blueprint */
$blueprint = app(BlueprintExtensionLibrary::class);

$catalog = $service->syncFromApi(true);
$blueprint->dbSet('bedrockversions', 'last_sync', now()->toDateTimeString());

echo sprintf(
    "Catálogo Bedrock sincronizado — Stable: %d grupos | Preview: %d grupos | Latest Stable: %s | Latest Preview: %s\n",
    count($catalog['release'] ?? []),
    count($catalog['preview'] ?? []),
    $catalog['latest_stable'] ?? '-',
    $catalog['latest_preview'] ?? '-'
);
