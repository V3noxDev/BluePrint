<?php

namespace Pterodactyl\BlueprintFramework\Extensions\templates;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InstallerTemplate extends Model
{
    protected $table = 'template_installer_templates';

    protected $fillable = [
        'sort_order',
        'name',
        'icon_url',
        'category',
        'description',
        'full_description',
        'password',
        'password_description',
        'version',
        'author',
        'enabled',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $hidden = [
        'password',
    ];

    public function variables(): HasMany
    {
        return $this->hasMany(InstallerTemplateVariable::class, 'template_id')->orderBy('sort_order');
    }

    public function steps(): HasMany
    {
        return $this->hasMany(InstallerTemplateStep::class, 'template_id')->orderBy('sort_order');
    }
}
