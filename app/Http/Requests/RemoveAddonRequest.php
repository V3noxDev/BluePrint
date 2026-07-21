<?php

namespace {appcontext}\Http\Requests;

use Illuminate\Validation\Rule;
use Pterodactyl\Models\Permission;
use Pterodactyl\Contracts\Http\ClientPermissionsRequest;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

final class RemoveAddonRequest extends ClientApiRequest implements ClientPermissionsRequest
{
    public function permission(): string
    {
        return Permission::ACTION_FILE_DELETE;
    }

    public function rules(): array
    {
        return [
            'kind' => ['required', Rule::in(['plugin', 'mod'])],
            'filename' => ['required', 'string', 'max:180', 'regex:/^[^\/\\\\\x00]+\.jar$/i'],
        ];
    }
}
