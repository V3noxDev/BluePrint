<?php

namespace Pterodactyl\BlueprintFramework\Extensions\mcmodpack;

class ModpackInstallCancelledException extends \RuntimeException
{
    public function __construct()
    {
        parent::__construct('Instalação cancelada pelo usuário.');
    }
}
