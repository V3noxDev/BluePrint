{{--
  Conteúdo da página admin do Server Properties.
  NÃO usar @extends — o Blueprint envolve esta view e inclui a engrenagem
  de permissões/eggs automaticamente.
--}}

<div class="serverprops-admin">
    <div class="serverprops-admin__header">
        <div>
            <h3 class="serverprops-admin__title">Server Properties</h3>
            <p class="serverprops-admin__subtitle">
                Editor visual de <code>server.properties</code> para servidores Minecraft Java.
            </p>
        </div>
        <span class="serverprops-admin__version">v1.3.0</span>
    </div>

    <div class="serverprops-admin__grid">
        <div class="serverprops-admin__card">
            <div class="serverprops-admin__card-title">Como usar</div>
            <ol class="serverprops-admin__steps">
                <li>Clique na <strong>engrenagem</strong> no canto desta página (configurações do Blueprint).</li>
                <li>Selecione os <strong>eggs</strong> em que a aba Properties deve aparecer.</li>
                <li>No servidor, acesse <code>/server/{id}/minecraft/properties</code>.</li>
            </ol>
        </div>

        <div class="serverprops-admin__card">
            <div class="serverprops-admin__card-title">Recursos</div>
            <ul class="serverprops-admin__list">
                <li>Mostra apenas propriedades existentes no arquivo</li>
                <li>Detecta automaticamente true/false vs texto</li>
                <li>Interface em português</li>
                <li>Busca e salvamento com confirmação</li>
                <li>Restrito aos eggs escolhidos na engrenagem</li>
            </ul>
        </div>

        <div class="serverprops-admin__card serverprops-admin__card--wide">
            <div class="serverprops-admin__card-title">Rota do painel</div>
            <div class="serverprops-admin__route">
                <code>/server/{id}/minecraft/properties</code>
            </div>
            <p class="serverprops-admin__hint">
                Para limitar a eggs específicos (Paper, Spigot, Vanilla, etc.), use a
                <strong>engrenagem do Blueprint</strong> nesta página — igual às outras extensões.
            </p>
        </div>
    </div>
</div>
