<?php

namespace Pterodactyl\BlueprintFramework\Extensions\loginmaster;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

class TurnstileValidator
{
    private const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    public function __construct(
        private LoginMasterService $service,
        private Client $client,
    ) {}

    public function verify(string $token, ?string $remoteIp = null): bool
    {
        $token = trim($token);
        if ($token === '') {
            return false;
        }

        $secret = $this->service->getSecretKey();
        if ($secret === '') {
            return false;
        }

        $payload = [
            'secret' => $secret,
            'response' => $token,
        ];

        if ($remoteIp !== null && filter_var($remoteIp, FILTER_VALIDATE_IP)) {
            $payload['remoteip'] = $remoteIp;
        }

        try {
            $response = $this->client->post(self::VERIFY_URL, [
                'form_params' => $payload,
                'timeout' => 8,
                'connect_timeout' => 4,
                'headers' => [
                    'Accept' => 'application/json',
                ],
            ]);
        } catch (GuzzleException $e) {
            Log::warning('[loginmaster] Falha ao contactar Cloudflare Turnstile: ' . $e->getMessage());

            return false;
        }

        if ($response->getStatusCode() !== 200) {
            return false;
        }

        $body = json_decode((string) $response->getBody(), true);
        if (!is_array($body)) {
            return false;
        }

        if (!($body['success'] ?? false)) {
            $errors = $body['error-codes'] ?? [];
            if (is_array($errors) && $errors !== []) {
                Log::info('[loginmaster] Turnstile rejeitado: ' . implode(', ', $errors));
            }

            return false;
        }

        return true;
    }
}
