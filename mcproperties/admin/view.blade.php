{{-- Página administrativa do MC Properties --}}

<style>
  .mcp-hero {
    position: relative;
    overflow: hidden;
    border-radius: 10px;
    padding: 34px 30px;
    margin-bottom: 22px;
    color: #fff;
    background: linear-gradient(135deg, #0f172a 0%, #14532d 55%, #16a34a 100%);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  }
  .mcp-hero::after {
    content: "";
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
    background-size: 26px 26px;
    pointer-events: none;
  }
  .mcp-hero h1 {
    margin: 0 0 6px 0;
    font-size: 30px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .mcp-hero p {
    margin: 0;
    max-width: 720px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
  }
  .mcp-hero .mcp-badges { margin-top: 14px; }
  .mcp-badge {
    display: inline-block;
    padding: 4px 12px;
    margin-right: 6px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: #fff;
  }
  .mcp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
    margin-bottom: 22px;
  }
  .mcp-card {
    background: #fff;
    border-radius: 10px;
    padding: 20px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
  }
  .skin-blue-light .mcp-card, .skin-blue .mcp-card { background: #fff; }
  .mcp-card .mcp-icon {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 19px;
    margin-bottom: 12px;
    color: #fff;
  }
  .mcp-card h4 { margin: 0 0 6px 0; font-size: 15px; font-weight: 700; color: #111827; }
  .mcp-card p { margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5; }
  .mcp-steps { counter-reset: step; }
  .mcp-step {
    display: flex;
    align-items: flex-start;
    padding: 12px 0;
    border-bottom: 1px dashed #e5e7eb;
  }
  .mcp-step:last-child { border-bottom: none; }
  .mcp-step::before {
    counter-increment: step;
    content: counter(step);
    flex: none;
    width: 26px;
    height: 26px;
    margin-right: 12px;
    border-radius: 999px;
    background: #16a34a;
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .mcp-step div { font-size: 13px; color: #374151; }
  .mcp-step code {
    background: #f3f4f6;
    color: #16a34a;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 12px;
  }
  .mcp-footer {
    text-align: center;
    font-size: 12px;
    color: #9ca3af;
    padding: 6px 0 14px 0;
  }
</style>

<div class="mcp-hero">
  <h1>⛏️ MC Properties <small style="font-size: 14px; opacity: .8;">v{version}</small></h1>
  <p>
    Editor visual completo do <strong>server.properties</strong> para servidores Minecraft Java.
    Seus usuários editam MOTD (com preview em tempo real), modo de jogo, dificuldade, whitelist,
    view-distance e dezenas de outras opções direto do painel — sem abrir o editor de arquivos.
  </p>
  <div class="mcp-badges">
    <span class="mcp-badge">Blueprint {target}</span>
    <span class="mcp-badge">+60 propriedades</span>
    <span class="mcp-badge">Preview de MOTD</span>
    <span class="mcp-badge">PT-BR</span>
  </div>
</div>

<div class="mcp-grid">
  <div class="mcp-card">
    <div class="mcp-icon" style="background: linear-gradient(135deg, #16a34a, #4ade80);">🎨</div>
    <h4>MOTD com preview ao vivo</h4>
    <p>Editor de MOTD com paleta de cores (§), negrito, itálico, texto embaralhado e preview idêntico à lista de servidores do jogo.</p>
  </div>
  <div class="mcp-card">
    <div class="mcp-icon" style="background: linear-gradient(135deg, #0ea5e9, #38bdf8);">🗂️</div>
    <h4>Organizado por categorias</h4>
    <p>Propriedades agrupadas em Geral, Mundo, Jogadores, Rede, Desempenho, Resource Pack, RCON e Avançado, com busca instantânea.</p>
  </div>
  <div class="mcp-card">
    <div class="mcp-icon" style="background: linear-gradient(135deg, #f59e0b, #fbbf24);">🔒</div>
    <h4>Permissões nativas</h4>
    <p>Usa a API de arquivos do próprio Pterodactyl: quem não tem permissão de escrita em arquivos não consegue salvar. Nada de rotas inseguras.</p>
  </div>
  <div class="mcp-card">
    <div class="mcp-icon" style="background: linear-gradient(135deg, #8b5cf6, #a78bfa);">⚡</div>
    <h4>Salvar &amp; Reiniciar</h4>
    <p>Barra flutuante mostra as alterações pendentes e permite salvar (com reinício opcional do servidor) em um clique.</p>
  </div>
</div>

<div class="row">
  <div class="col-md-6">
    <div class="box box-success">
      <div class="box-header with-border"><h3 class="box-title">Como os usuários acessam</h3></div>
      <div class="box-body mcp-steps">
        <div class="mcp-step"><div>Abra qualquer servidor <strong>Minecraft Java</strong> no painel.</div></div>
        <div class="mcp-step"><div>Clique na aba <code>Propriedades</code> na navegação do servidor.</div></div>
        <div class="mcp-step"><div>Edite os valores desejados e clique em <code>Salvar</code> ou <code>Salvar &amp; Reiniciar</code>.</div></div>
      </div>
    </div>
  </div>
  <div class="col-md-6">
    <div class="box box-info">
      <div class="box-header with-border"><h3 class="box-title">Dicas de administração</h3></div>
      <div class="box-body mcp-steps">
        <div class="mcp-step"><div><strong>Limite por egg:</strong> em <code>Admin &rarr; Extensions &rarr; Manage</code> você pode escolher em quais eggs a aba "Propriedades" aparece (recomendado: apenas eggs de Minecraft Java).</div></div>
        <div class="mcp-step"><div><strong>Arquivo inexistente:</strong> se o servidor nunca foi iniciado, o <code>server.properties</code> ainda não existe — a página avisa o usuário automaticamente.</div></div>
        <div class="mcp-step"><div><strong>Remoção:</strong> use <code>blueprint -remove mcproperties</code> ou o auto-instalador incluído no pacote.</div></div>
      </div>
    </div>
  </div>
</div>

<div class="mcp-footer">
  MC Properties v{version} &bull; feito para Blueprint &bull; por {author}
</div>
