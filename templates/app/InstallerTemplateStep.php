<?php

namespace Pterodactyl\BlueprintFramework\Extensions\templates;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstallerTemplateStep extends Model
{
    public const ACTIONS = [
        'write' => 'Write to File',
        'replace' => 'Replace in File',
        'append' => 'Append to File',
        'prepend' => 'Prepend to File',
        'mkdir' => 'Create Folder',
        'pull' => 'Pull File',
        'unzip' => 'Unzip File',
        'move' => 'Move File/Folder',
        'move_folder' => 'Move Files from Folder',
        'delete' => 'Delete File/Folder',
        'power' => 'Power Action',
    ];

    protected $table = 'template_installer_steps';

    protected $fillable = [
        'template_id',
        'sort_order',
        'action',
        'file_path',
        'content',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(InstallerTemplate::class, 'template_id');
    }
}
