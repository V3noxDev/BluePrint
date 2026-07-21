<?php

namespace {appcontext}\Http\Requests;

use Pterodactyl\Models\Server;
use Pterodactyl\Models\Permission;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

final class UpdatePropertiesRequest extends ClientApiRequest
{
    public function authorize(): bool
    {
        $server = $this->route()->parameter('server');

        return $server instanceof Server
            && $this->user()->can(Permission::ACTION_FILE_READ_CONTENT, $server)
            && $this->user()->can(Permission::ACTION_FILE_CREATE, $server);
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
