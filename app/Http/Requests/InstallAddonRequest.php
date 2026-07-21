<?php

namespace {appcontext}\Http\Requests;

use Illuminate\Validation\Rule;
use Pterodactyl\Models\Permission;
use Pterodactyl\Contracts\Http\ClientPermissionsRequest;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

final class InstallAddonRequest extends ClientApiRequest implements ClientPermissionsRequest
{
    public function permission(): string
    {
        return Permission::ACTION_FILE_CREATE;
    }

    public function rules(): array
    {
        return [
            'kind' => ['required', Rule::in(['plugin', 'mod'])],
            'project_id' => ['required', 'string', 'min:3', 'max:64', 'regex:/^[A-Za-z0-9_-]+$/'],
            'version_id' => ['required', 'string', 'min:3', 'max:64', 'regex:/^[A-Za-z0-9_-]+$/'],
        ];
    }
}
