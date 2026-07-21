@extends('layouts.admin')

@section('title')
    MineHub
@endsection

@section('content-header')
    <h1>MineHub <small>Gerenciador Minecraft</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.extensions') }}">Extensions</a></li>
        <li class="active">MineHub</li>
    </ol>
@endsection

@section('content')
<div class="minehub-admin">
    <div class="minehub-hero">
        <div class="minehub-hero__content">
            <div class="minehub-hero__badge">Blueprint Extension</div>
            <h2 class="minehub-hero__title">MineHub</h2>
            <p class="minehub-hero__desc">
                Painel completo para gerenciar servidores Minecraft Java — editor visual de
                <code>server.properties</code> e instalador automático de addons com seleção e remoção.
            </p>
            <div class="minehub-hero__stats">
                <div class="minehub-stat">
                    <span class="minehub-stat__value">{{ count($catalog) }}</span>
                    <span class="minehub-stat__label">Addons no catálogo</span>
                </div>
                <div class="minehub-stat">
                    <span class="minehub-stat__value">{{ count($enabled_modules) }}</span>
                    <span class="minehub-stat__label">Módulos ativos</span>
                </div>
                <div class="minehub-stat">
                    <span class="minehub-stat__value">v1.0.0</span>
                    <span class="minehub-stat__label">Versão</span>
                </div>
            </div>
        </div>
        <div class="minehub-hero__visual">
            <div class="minehub-cube">
                <div class="minehub-cube__face minehub-cube__face--top"></div>
                <div class="minehub-cube__face minehub-cube__face--front"></div>
                <div class="minehub-cube__face minehub-cube__face--right"></div>
            </div>
        </div>
    </div>

    <form id="minehub-config-form" action="{{ $root }}" method="POST">
        @csrf
        @method('PATCH')

        <div class="row">
            <div class="col-md-4">
                <div class="minehub-card">
                    <div class="minehub-card__header">
                        <span class="minehub-card__icon">🧩</span>
                        <h3>Módulos</h3>
                    </div>
                    <div class="minehub-card__body">
                        <label class="minehub-toggle">
                            <input type="checkbox" name="modules[]" value="properties"
                                {{ in_array('properties', $enabled_modules) ? 'checked' : '' }}>
                            <span class="minehub-toggle__slider"></span>
                            <span class="minehub-toggle__label">
                                <strong>Server Properties</strong>
                                <small>Editor visual do server.properties</small>
                            </span>
                        </label>
                        <label class="minehub-toggle">
                            <input type="checkbox" name="modules[]" value="addons"
                                {{ in_array('addons', $enabled_modules) ? 'checked' : '' }}>
                            <span class="minehub-toggle__slider"></span>
                            <span class="minehub-toggle__label">
                                <strong>Addon Manager</strong>
                                <small>Instalar e remover plugins/mods</small>
                            </span>
                        </label>
                    </div>
                </div>

                <div class="minehub-card">
                    <div class="minehub-card__header">
                        <span class="minehub-card__icon">⚡</span>
                        <h3>Configurações</h3>
                    </div>
                    <div class="minehub-card__body">
                        <div class="form-group">
                            <label>Diretório de addons</label>
                            <input type="text" name="addon_path" class="form-control"
                                value="{{ $addon_path }}" placeholder="/plugins">
                            <p class="help-block">Pasta onde os addons serão instalados no servidor.</p>
                        </div>
                        <label class="minehub-toggle">
                            <input type="checkbox" name="auto_install" value="1"
                                {{ $auto_install ? 'checked' : '' }}>
                            <span class="minehub-toggle__slider"></span>
                            <span class="minehub-toggle__label">
                                <strong>Auto-instalação</strong>
                                <small>Permitir instalação com um clique</small>
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            <div class="col-md-8">
                <div class="minehub-card">
                    <div class="minehub-card__header">
                        <span class="minehub-card__icon">📦</span>
                        <h3>Catálogo de Addons</h3>
                        <button type="button" class="btn btn-sm minehub-btn-primary" id="minehub-add-addon">
                            + Adicionar Addon
                        </button>
                    </div>
                    <div class="minehub-card__body">
                        <input type="hidden" name="catalog_json" id="catalog-json"
                            value="{{ json_encode($catalog) }}">
                        <div id="catalog-list" class="minehub-catalog"></div>
                    </div>
                </div>
            </div>
        </div>
    </form>

    <div id="save-overlay" class="minehub-save-overlay">
        <button type="submit" form="minehub-config-form" class="btn minehub-btn-primary minehub-btn-lg">
            💾 Salvar alterações
        </button>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('minehub-config-form');
    const overlay = document.getElementById('save-overlay');
    const catalogList = document.getElementById('catalog-list');
    const catalogInput = document.getElementById('catalog-json');
    let catalog = JSON.parse(catalogInput.value || '[]');

    function renderCatalog() {
        catalogList.innerHTML = '';
        if (catalog.length === 0) {
            catalogList.innerHTML = '<p class="minehub-empty">Nenhum addon no catálogo. Clique em "+ Adicionar Addon".</p>';
            return;
        }

        catalog.forEach((addon, index) => {
            const card = document.createElement('div');
            card.className = 'minehub-catalog-item';
            card.innerHTML = `
                <div class="minehub-catalog-item__icon">${addon.icon || '📦'}</div>
                <div class="minehub-catalog-item__info">
                    <input type="text" class="form-control input-sm" data-field="name" data-index="${index}"
                        value="${addon.name || ''}" placeholder="Nome">
                    <input type="text" class="form-control input-sm" data-field="description" data-index="${index}"
                        value="${addon.description || ''}" placeholder="Descrição">
                    <div class="minehub-catalog-item__row">
                        <input type="text" class="form-control input-sm" data-field="version" data-index="${index}"
                            value="${addon.version || ''}" placeholder="Versão">
                        <input type="text" class="form-control input-sm" data-field="filename" data-index="${index}"
                            value="${addon.filename || ''}" placeholder="Arquivo.jar">
                    </div>
                    <input type="text" class="form-control input-sm" data-field="download_url" data-index="${index}"
                        value="${addon.download_url || ''}" placeholder="URL de download">
                </div>
                <button type="button" class="btn btn-danger btn-sm minehub-remove-btn" data-index="${index}">✕</button>
            `;
            catalogList.appendChild(card);
        });

        catalogList.querySelectorAll('[data-field]').forEach(input => {
            input.addEventListener('change', function () {
                const idx = parseInt(this.dataset.index);
                catalog[idx][this.dataset.field] = this.value;
                syncCatalog();
                showSave();
            });
        });

        catalogList.querySelectorAll('.minehub-remove-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                catalog.splice(parseInt(this.dataset.index), 1);
                syncCatalog();
                renderCatalog();
                showSave();
            });
        });
    }

    function syncCatalog() {
        catalogInput.value = JSON.stringify(catalog);
    }

    function showSave() {
        overlay.style.display = 'flex';
        setTimeout(() => overlay.classList.add('visible'), 50);
    }

    form.addEventListener('change', showSave);

    document.getElementById('minehub-add-addon').addEventListener('click', function () {
        catalog.push({
            id: 'addon_' + Date.now(),
            name: 'Novo Addon',
            description: '',
            version: '1.0.0',
            type: 'plugin',
            loader: 'paper',
            download_url: '',
            filename: 'addon.jar',
            icon: '📦',
            featured: false,
        });
        syncCatalog();
        renderCatalog();
        showSave();
    });

    renderCatalog();
});
</script>
@endsection
