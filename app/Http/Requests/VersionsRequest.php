<?php

namespace {appcontext}\Http\Requests;

use Pterodactyl\Models\Permission;
use Pterodactyl\Contracts\Http\ClientPermissionsRequest;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

final class VersionsRequest extends ClientApiRequest implements ClientPermissionsRequest
{
    public function permission(): string
    {
        return Permission::ACTION_FILE_READ;
    }

    public function rules(): array
    {
        return [
            'game_version' => ['nullable', 'string', 'max:32', 'regex:/^[A-Za-z0-9.+_-]+$/'],
            'loader' => ['nullable', 'string', 'max:32', 'regex:/^[a-z0-9_-]+$/'],
        ];
    }
}
