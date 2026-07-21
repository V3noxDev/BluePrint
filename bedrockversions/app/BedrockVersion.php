<?php

namespace Pterodactyl\BlueprintFramework\Extensions\bedrockversions;

use Illuminate\Database\Eloquent\Model;

class BedrockVersion extends Model
{
    protected $table = 'bedrock_versions';

    protected $fillable = [
        'channel',
        'version',
        'download_url',
        'download_type',
        'is_latest',
        'first_seen_at',
        'last_seen_at',
    ];

    protected $casts = [
        'is_latest' => 'boolean',
        'first_seen_at' => 'datetime',
        'last_seen_at' => 'datetime',
    ];
}
