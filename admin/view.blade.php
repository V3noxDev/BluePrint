<div class="cp-admin">
    <section class="cp-admin__hero">
        <div class="cp-admin__brand">
            <div class="cp-admin__logo" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6"></path>
                    <circle cx="14" cy="7" r="2"></circle>
                    <circle cx="6" cy="17" r="2"></circle>
                </svg>
            </div>
            <div>
                <span class="cp-admin__eyebrow">CraftProperties 1.0.0</span>
                <h2>Seu server.properties, agora visual.</h2>
                <p>Uma experiência segura e moderna para configurar servidores Minecraft Java diretamente no Pterodactyl.</p>
            </div>
        </div>
        <span class="cp-admin__status"><i></i> Extensão ativa</span>
    </section>

    <div class="cp-admin__stats">
        <article>
            <strong>70+</strong>
            <span>propriedades catalogadas</span>
        </article>
        <article>
            <strong>5</strong>
            <span>presets prontos</span>
        </article>
        <article>
            <strong>1 clique</strong>
            <span>para restaurar backup</span>
        </article>
        <article>
            <strong>Zero</strong>
            <span>serviços externos</span>
        </article>
    </div>

    <div class="cp-admin__grid">
        <section class="cp-admin__card">
            <div class="cp-admin__card-heading">
                <span class="cp-admin__step">01</span>
                <div>
                    <h3>Disponibilize a página</h3>
                    <p>Controle em quais eggs o editor aparece.</p>
                </div>
            </div>
            <p>Abra as configurações da extensão pelo botão do Blueprint e associe a rota <code>/properties</code> aos eggs de Minecraft Java.</p>
        </section>

        <section class="cp-admin__card">
            <div class="cp-admin__card-heading">
                <span class="cp-admin__step">02</span>
                <div>
                    <h3>Revise as permissões</h3>
                    <p>O acesso segue as regras nativas do painel.</p>
                </div>
            </div>
            <ul class="cp-admin__permissions">
                <li><code>file.read</code><span>visualizar e restaurar</span></li>
                <li><code>file.update</code><span>editar e salvar</span></li>
            </ul>
        </section>
    </div>

    <section class="cp-admin__card cp-admin__card--wide">
        <div class="cp-admin__card-heading">
            <span class="cp-admin__step">✓</span>
            <div>
                <h3>Proteção incluída</h3>
                <p>Projetado para alterar somente o que o usuário pediu.</p>
            </div>
        </div>
        <div class="cp-admin__features">
            <div><i></i> Preserva comentários e propriedades desconhecidas</div>
            <div><i></i> Valida números, seleções, UUID, SHA-1 e JSON</div>
            <div><i></i> Cria <code>/server.properties.craftproperties.bak</code> antes de salvar</div>
            <div><i></i> Respeita permissões de subusuários e a API de arquivos</div>
        </div>
    </section>

    <div class="cp-admin__note">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 3 2.5 20h19L12 3Zm0 6v5m0 3v.1"></path>
        </svg>
        <p><strong>Importante:</strong> a maioria das propriedades é carregada pelo Minecraft apenas durante a inicialização. Oriente os usuários a reiniciar o servidor depois de salvar.</p>
    </div>
</div>
