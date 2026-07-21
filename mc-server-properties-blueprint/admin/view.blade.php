@extends('layouts.admin')

@section('title')
    Minecraft Properties Studio
@endsection

@section('content-header')
    <h1>Minecraft Properties Studio<small>Blueprint Extension</small></h1>
@endsection

@section('content')
    <div class="mcps-admin-grid">
        <div class="mcps-card">
            <h2>Resumo</h2>
            <p>
                Esta extensão adiciona uma interface visual para editar o arquivo
                <code>server.properties</code> de servidores Minecraft Java dentro do painel do cliente.
            </p>
            <ul>
                <li>Editor com busca instantânea</li>
                <li>Validação de linhas no formato <code>chave=valor</code></li>
                <li>Backup local em memória durante a sessão</li>
            </ul>
        </div>

        <div class="mcps-card">
            <h2>Como usar</h2>
            <ol>
                <li>Abra um servidor Minecraft Java.</li>
                <li>Clique na aba <strong>Properties Studio</strong>.</li>
                <li>Edite os campos e clique em <strong>Salvar no servidor</strong>.</li>
            </ol>
            <p class="mcps-muted">
                Dica: para aplicar todas as mudanças no jogo, reinicie o servidor após salvar.
            </p>
        </div>
    </div>
@endsection
