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
        'mojang_build_id',
        'released_at',
        'is_latest',
        'first_seen_at',
        'last_seen_at',
    ];

    protected $casts = [
        'is_latest' => 'boolean',
        'released_at' => 'datetime',
        'first_seen_at' => 'datetime',
        'last_seen_at' => 'datetime',
    ];
}
