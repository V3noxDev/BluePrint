<?php

namespace Pterodactyl\BlueprintFramework\Extensions\{identifier}\Services;

class ServerPropertiesEditor
{
    /**
     * @return array<string, array<string, mixed>>
     */
    public function fieldDefinitions(): array
    {
        return [
            'motd' => [
                'label' => 'MOTD',
                'type' => 'text',
                'group' => 'Identidade',
                'description' => 'Mensagem principal mostrada na lista de servidores.',
                'placeholder' => 'Servidor Minecraft Java premium',
            ],
            'level-name' => [
                'label' => 'Level name',
                'type' => 'text',
                'group' => 'Identidade',
                'description' => 'Nome da pasta do mundo principal.',
                'placeholder' => 'world',
            ],
            'level-seed' => [
                'label' => 'Level seed',
                'type' => 'text',
                'group' => 'Identidade',
                'description' => 'Seed opcional para novos mundos.',
                'placeholder' => 'minha-seed',
            ],
            'gamemode' => [
                'label' => 'Gamemode',
                'type' => 'select',
                'group' => 'Gameplay',
                'description' => 'Modo de jogo padrao.',
                'options' => [
                    'survival' => 'Survival',
                    'creative' => 'Creative',
                    'adventure' => 'Adventure',
                    'spectator' => 'Spectator',
                ],
            ],
            'difficulty' => [
                'label' => 'Difficulty',
                'type' => 'select',
                'group' => 'Gameplay',
                'description' => 'Dificuldade base do servidor.',
                'options' => [
                    'peaceful' => 'Peaceful',
                    'easy' => 'Easy',
                    'normal' => 'Normal',
                    'hard' => 'Hard',
                ],
            ],
            'pvp' => [
                'label' => 'PVP',
                'type' => 'toggle',
                'group' => 'Gameplay',
                'description' => 'Ativa ou desativa dano entre jogadores.',
            ],
            'hardcore' => [
                'label' => 'Hardcore',
                'type' => 'toggle',
                'group' => 'Gameplay',
                'description' => 'Modo hardcore com banimento logico em mortes.',
            ],
            'allow-flight' => [
                'label' => 'Allow flight',
                'type' => 'toggle',
                'group' => 'Gameplay',
                'description' => 'Permite voo no mundo sem kick automatico.',
            ],
            'enable-command-block' => [
                'label' => 'Command blocks',
                'type' => 'toggle',
                'group' => 'Gameplay',
                'description' => 'Controla o uso de command blocks.',
            ],
            'online-mode' => [
                'label' => 'Online mode',
                'type' => 'toggle',
                'group' => 'Seguranca',
                'description' => 'Valida contas com os servidores da Mojang.',
            ],
            'white-list' => [
                'label' => 'Whitelist',
                'type' => 'toggle',
                'group' => 'Seguranca',
                'description' => 'Permite entrada apenas de usuarios listados.',
            ],
            'enforce-whitelist' => [
                'label' => 'Enforce whitelist',
                'type' => 'toggle',
                'group' => 'Seguranca',
                'description' => 'Expulsa quem perder acesso a whitelist.',
            ],
            'server-port' => [
                'label' => 'Server port',
                'type' => 'number',
                'group' => 'Rede',
                'description' => 'Porta principal do servidor Java.',
                'placeholder' => '25565',
            ],
            'max-players' => [
                'label' => 'Max players',
                'type' => 'number',
                'group' => 'Rede',
                'description' => 'Quantidade maxima de slots.',
                'placeholder' => '20',
            ],
            'view-distance' => [
                'label' => 'View distance',
                'type' => 'number',
                'group' => 'Mundo',
                'description' => 'Quantidade de chunks enviados ao jogador.',
                'placeholder' => '10',
            ],
            'simulation-distance' => [
                'label' => 'Simulation distance',
                'type' => 'number',
                'group' => 'Mundo',
                'description' => 'Quantidade de chunks simulados no servidor.',
                'placeholder' => '10',
            ],
            'spawn-protection' => [
                'label' => 'Spawn protection',
                'type' => 'number',
                'group' => 'Mundo',
                'description' => 'Raio de protecao da area inicial.',
                'placeholder' => '16',
            ],
            'max-world-size' => [
                'label' => 'Max world size',
                'type' => 'number',
                'group' => 'Mundo',
                'description' => 'Limite maximo do tamanho do mundo.',
                'placeholder' => '29999984',
            ],
            'allow-nether' => [
                'label' => 'Allow nether',
                'type' => 'toggle',
                'group' => 'Mundo',
                'description' => 'Ativa o Nether.',
            ],
        ];
    }

    public function defaultContent(): string
    {
        return implode("\n", [
            '# MC Server Properties Pro',
            '# Arquivo base gerado para facilitar a edicao no Blueprint.',
            'motd=Servidor Minecraft Java premium',
            'level-name=world',
            'gamemode=survival',
            'difficulty=normal',
            'pvp=true',
            'hardcore=false',
            'allow-flight=false',
            'enable-command-block=false',
            'online-mode=true',
            'white-list=false',
            'enforce-whitelist=false',
            'server-port=25565',
            'max-players=20',
            'view-distance=10',
            'simulation-distance=10',
            'spawn-protection=16',
            'max-world-size=29999984',
            'allow-nether=true',
            '',
        ]);
    }

    /**
     * @return array<string, string>
     */
    public function parse(string $content): array
    {
        $properties = [];

        foreach (preg_split('/\R/', $content) ?: [] as $line) {
            $trimmed = trim($line);

            if ($trimmed === '' || str_starts_with($trimmed, '#') || str_starts_with($trimmed, '!')) {
                continue;
            }

            $separatorPosition = strpos($line, '=');
            if ($separatorPosition === false) {
                continue;
            }

            $key = trim(substr($line, 0, $separatorPosition));
            $value = trim(substr($line, $separatorPosition + 1));

            if ($key !== '') {
                $properties[$key] = $value;
            }
        }

        return $properties;
    }

    /**
     * @return array<string, string>
     */
    public function extractEditableFields(string $content): array
    {
        $fields = $this->blankFieldValues();
        $parsed = $this->parse($content);

        foreach (array_keys($this->fieldDefinitions()) as $key) {
            if (array_key_exists($key, $parsed)) {
                $fields[$key] = $parsed[$key];
            }
        }

        return $fields;
    }

    /**
     * @param array<string, mixed> $fields
     */
    public function mergeEditableFields(string $content, array $fields): string
    {
        $normalizedFields = [];

        foreach ($fields as $key => $value) {
            $normalized = $this->normalizeValue($value);
            if ($normalized !== null && array_key_exists($key, $this->fieldDefinitions())) {
                $normalizedFields[$key] = $normalized;
            }
        }

        if ($normalizedFields === []) {
            return rtrim($content) . "\n";
        }

        $lines = preg_split('/\R/', $content) ?: [];
        $applied = [];

        foreach ($lines as $index => $line) {
            $separatorPosition = strpos($line, '=');
            if ($separatorPosition === false) {
                continue;
            }

            $key = trim(substr($line, 0, $separatorPosition));
            if (!array_key_exists($key, $normalizedFields)) {
                continue;
            }

            $lines[$index] = $key . '=' . $normalizedFields[$key];
            $applied[$key] = true;
        }

        $missing = array_diff_key($normalizedFields, $applied);
        if ($missing !== []) {
            if ($lines !== [] && trim((string) end($lines)) !== '') {
                $lines[] = '';
            }

            $lines[] = '# Managed by MC Server Properties Pro';
            foreach ($missing as $key => $value) {
                $lines[] = $key . '=' . $value;
            }
        }

        return rtrim(implode("\n", $lines)) . "\n";
    }

    /**
     * @return array<string, string>
     */
    private function blankFieldValues(): array
    {
        return [
            'motd' => '',
            'level-name' => 'world',
            'level-seed' => '',
            'gamemode' => 'survival',
            'difficulty' => 'normal',
            'pvp' => 'true',
            'hardcore' => 'false',
            'allow-flight' => 'false',
            'enable-command-block' => 'false',
            'online-mode' => 'true',
            'white-list' => 'false',
            'enforce-whitelist' => 'false',
            'server-port' => '25565',
            'max-players' => '20',
            'view-distance' => '10',
            'simulation-distance' => '10',
            'spawn-protection' => '16',
            'max-world-size' => '29999984',
            'allow-nether' => 'true',
        ];
    }

    private function normalizeValue(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }

        $stringValue = trim((string) $value);

        return $stringValue === '' ? null : $stringValue;
    }
}
