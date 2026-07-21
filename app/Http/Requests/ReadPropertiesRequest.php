<?php

namespace {appcontext}\Http\Requests;

use Pterodactyl\Models\Permission;
use Pterodactyl\Contracts\Http\ClientPermissionsRequest;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

final class ReadPropertiesRequest extends ClientApiRequest implements ClientPermissionsRequest
{
    public function permission(): string
    {
        return Permission::ACTION_FILE_READ_CONTENT;
    }

    public function rules(): array
    {
        return [];
    }
}
