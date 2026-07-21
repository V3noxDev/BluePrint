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
    "Synced Bedrock versions — Stable: %d | Preview: %d | Latest Stable: %s | Latest Preview: %s\n",
    count($catalog['stable'] ?? []),
    count($catalog['preview'] ?? []),
    $catalog['latest_stable'] ?? '-',
    $catalog['latest_preview'] ?? '-'
);
