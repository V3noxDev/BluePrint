<?php

namespace {appcontext}\Http\Requests;

use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

final class VersionsRequest extends ClientApiRequest
{
    public function rules(): array
    {
        return [
            'game_version' => ['nullable', 'string', 'max:32', 'regex:/^[A-Za-z0-9.+_-]+$/'],
            'loader' => ['nullable', 'string', 'max:32', 'regex:/^[a-z0-9_-]+$/'],
        ];
    }
}
