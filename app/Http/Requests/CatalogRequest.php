<?php

namespace {appcontext}\Http\Requests;

use Illuminate\Validation\Rule;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

final class CatalogRequest extends ClientApiRequest
{
    public function rules(): array
    {
        return [
            'query' => ['nullable', 'string', 'max:100'],
            'kind' => ['required', Rule::in(['plugin', 'mod'])],
            'game_version' => ['nullable', 'string', 'max:32', 'regex:/^[A-Za-z0-9.+_-]+$/'],
            'loader' => ['nullable', 'string', 'max:32', 'regex:/^[a-z0-9_-]+$/'],
            'index' => ['nullable', Rule::in(['relevance', 'downloads', 'follows', 'newest', 'updated'])],
            'offset' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:40'],
        ];
    }
}
