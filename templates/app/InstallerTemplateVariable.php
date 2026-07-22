<?php

namespace Pterodactyl\BlueprintFramework\Extensions\templates;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstallerTemplateVariable extends Model
{
    protected $table = 'template_installer_variables';

    protected $fillable = [
        'template_id',
        'sort_order',
        'name',
        'env_variable',
        'description',
        'default_value',
        'rules',
        'selectable',
    ];

    protected $casts = [
        'selectable' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(InstallerTemplate::class, 'template_id');
    }
}
