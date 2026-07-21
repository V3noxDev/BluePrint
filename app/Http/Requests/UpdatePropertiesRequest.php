<?php

namespace {appcontext}\Http\Requests;

use Pterodactyl\Models\Permission;
use Pterodactyl\Contracts\Http\ClientPermissionsRequest;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

final class UpdatePropertiesRequest extends ClientApiRequest implements ClientPermissionsRequest
{
    public function permission(): string
    {
        return Permission::ACTION_FILE_CREATE;
    }

    public function rules(): array
    {
        return [
            'properties' => ['required', 'array', 'max:250'],
            'properties.*' => ['nullable', 'string', 'max:2048'],
            'remove' => ['sometimes', 'array', 'max:250'],
            'remove.*' => ['string', 'max:128'],
        ];
    }
}
