<?php

namespace Pterodactyl\BlueprintFramework\Extensions\loginmaster;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

class VerifyLoginMasterTurnstile
{
    public function __construct(
        private LoginMasterService $service,
        private TurnstileValidator $validator,
    ) {}

    public function handle(Request $request, Closure $next): mixed
    {
        if (!$this->service->shouldProtectRequest($request)) {
            return $next($request);
        }

        if ($this->service->getSettings()['honeypot_enabled']) {
            $honeypot = trim((string) $request->input('lm_hp_field', ''));
            if ($honeypot !== '') {
                throw new HttpException(Response::HTTP_BAD_REQUEST, 'Falha na verificação de segurança.');
            }
        }

        $token = (string) ($request->input('cf-turnstile-response')
            ?: $request->input('g-recaptcha-response')
            ?: '');

        if ($token === '') {
            throw new HttpException(Response::HTTP_BAD_REQUEST, 'Verificação Turnstile obrigatória.');
        }

        if (!$this->validator->verify($token, $request->ip())) {
            throw new HttpException(Response::HTTP_BAD_REQUEST, 'Falha na verificação Turnstile.');
        }

        return $next($request);
    }
}
