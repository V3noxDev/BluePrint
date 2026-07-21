{{--
  Conteúdo da página admin do MineHub.
  NÃO usar @extends — o Blueprint envolve esta view e inclui a engrenagem
  de permissões/eggs automaticamente.
--}}

<div class="minehub-admin">
    <div class="minehub-admin__header">
        <div>
            <h3 class="minehub-admin__title">MineHub</h3>
            <p class="minehub-admin__subtitle">
                Editor visual de <code>server.properties</code> para servidores Minecraft Java.
            </p>
        </div>
        <span class="minehub-admin__version">v1.2.0</span>
    </div>

    <div class="minehub-admin__grid">
        <div class="minehub-admin__card">
            <div class="minehub-admin__card-title">Como usar</div>
            <ol class="minehub-admin__steps">
                <li>Clique na <strong>engrenagem</strong> no canto desta página (configurações do Blueprint).</li>
                <li>Selecione os <strong>eggs</strong> em que a aba Properties deve aparecer.</li>
                <li>No servidor, acesse <code>/server/{id}/minecraft/properties</code>.</li>
            </ol>
        </div>

        <div class="minehub-admin__card">
            <div class="minehub-admin__card-title">Recursos</div>
            <ul class="minehub-admin__list">
                <li>Mostra apenas propriedades existentes no arquivo</li>
                <li>Detecta automaticamente true/false vs texto</li>
                <li>Interface em português</li>
                <li>Busca e salvamento com confirmação</li>
                <li>Restrito aos eggs escolhidos na engrenagem</li>
            </ul>
        </div>

        <div class="minehub-admin__card minehub-admin__card--wide">
            <div class="minehub-admin__card-title">Rota do painel</div>
            <div class="minehub-admin__route">
                <code>/server/{id}/minecraft/properties</code>
            </div>
            <p class="minehub-admin__hint">
                Para limitar a eggs específicos (Paper, Spigot, Vanilla, etc.), use a
                <strong>engrenagem do Blueprint</strong> nesta página — igual às outras extensões.
            </p>
        </div>
    </div>
</div>
