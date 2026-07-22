{{--
  Template Installer — NÃO usar @extends (Blueprint envolve + engrenagem de eggs).
--}}

<div class="tpl-admin" id="tpl-admin" data-api="{{ $api_root }}">
    <div class="tpl-admin__header">
        <div>
            <h3 class="tpl-admin__title">Template Installer</h3>
            <p class="tpl-admin__subtitle">
                Crie templates com variáveis e steps de instalação — pull, write, unzip, power e mais.
            </p>
        </div>
        <span class="tpl-admin__version">v1.0.0</span>
    </div>

    <div id="tpl-admin-app">
        <div class="tpl-admin__loading">Carregando painel…</div>
    </div>
</div>

{!! $blueprint->importScript('/extensions/templates/admin.js') !!}
