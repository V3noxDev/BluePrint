<style>
  .mcprops-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }

  .mcprops-card {
    border: 1px solid #dce1e8;
    border-radius: 10px;
    background: #ffffff;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
  }

  .mcprops-card h3 {
    margin-top: 0;
    margin-bottom: 8px;
    font-size: 16px;
    font-weight: 600;
  }

  .mcprops-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 12px;
    margin-right: 6px;
    margin-bottom: 6px;
    background: #eff6ff;
    color: #1d4ed8;
  }

  .mcprops-code {
    background: #0f172a;
    color: #e2e8f0;
    padding: 12px;
    border-radius: 8px;
    overflow-x: auto;
    font-family: monospace;
    font-size: 12px;
  }

  .mcprops-note {
    border-left: 4px solid #f59e0b;
    padding: 12px;
    background: #fff7ed;
    border-radius: 6px;
    margin-top: 14px;
  }
</style>

<div class="row">
  <div class="col-xs-12">
    <div class="box box-primary">
      <div class="box-header with-border">
        <h3 class="box-title">Minecraft Server Properties Manager</h3>
      </div>
      <div class="box-body">
        <p>
          Extensao Blueprint para fluxos de instalacao e manutencao de
          <code>server.properties</code> em servidores Minecraft Java.
        </p>

        <span class="mcprops-badge">Blueprint target: stable-2025-04</span>
        <span class="mcprops-badge">Identifier: mcserverprops</span>
        <span class="mcprops-badge">Version: 1.0.0</span>

        <div class="mcprops-grid" style="margin-top: 16px;">
          <div class="mcprops-card">
            <h3>1) Build do pacote</h3>
            <p>No host do painel, gere seu pacote .blueprint:</p>
            <pre class="mcprops-code">./scripts/build-blueprint-package.sh</pre>
          </div>

          <div class="mcprops-card">
            <h3>2) Instalacao automatica</h3>
            <p>Abra o menu visual para instalar/remover addon e gerenciar arquivos:</p>
            <pre class="mcprops-code">./scripts/auto-installer.sh</pre>
          </div>

          <div class="mcprops-card">
            <h3>3) Presets prontos</h3>
            <p>
              Presets inclusos:
              <code>survival</code>,
              <code>minigames</code>,
              <code>hardcore</code>.
            </p>
            <p>Aplicacao direta:</p>
            <pre class="mcprops-code">./scripts/mc-server-properties-manager.sh profile --file /caminho/server.properties --name survival</pre>
          </div>
        </div>

        <div class="mcprops-note">
          <strong>Importante:</strong>
          se o Egg do Pterodactyl tiver chaves no bloco
          <code>config.files.server.properties.find</code>,
          o painel pode sobrescrever valores no startup.
          Ajuste o Egg para combinar com a estrategia do addon.
        </div>
      </div>
    </div>
  </div>
</div>
