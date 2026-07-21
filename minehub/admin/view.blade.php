@extends('layouts.admin')

@section('title')
    MineHub
@endsection

@section('content-header')
    <h1>MineHub <small>Minecraft Properties</small></h1>
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
                Editor visual de <code>server.properties</code> no estilo Configs —
                grid de cards, busca e salvamento rápido.
            </p>
            <div class="minehub-hero__stats">
                <div class="minehub-stat">
                    <span class="minehub-stat__value">/minecraft/properties</span>
                    <span class="minehub-stat__label">Rota do servidor</span>
                </div>
                <div class="minehub-stat">
                    <span class="minehub-stat__value">v1.1.0</span>
                    <span class="minehub-stat__label">Versão</span>
                </div>
            </div>
        </div>
    </div>

    <form id="minehub-config-form" action="{{ $root }}" method="POST">
        @csrf
        @method('PATCH')

        <div class="row">
            <div class="col-md-6">
                <div class="minehub-card">
                    <div class="minehub-card__header">
                        <span class="minehub-card__icon">⚙️</span>
                        <h3>Configuração</h3>
                    </div>
                    <div class="minehub-card__body">
                        <label class="minehub-toggle">
                            <input type="checkbox" name="enabled" value="1" {{ $enabled ? 'checked' : '' }}>
                            <span class="minehub-toggle__slider"></span>
                            <span class="minehub-toggle__label">
                                <strong>Extensão ativa</strong>
                                <small>Mostra a página Properties nos servidores Minecraft</small>
                            </span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    </form>

    <div id="save-overlay" class="minehub-save-overlay">
        <button type="submit" form="minehub-config-form" class="btn minehub-btn-primary minehub-btn-lg">
            Salvar alterações
        </button>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('minehub-config-form');
    const overlay = document.getElementById('save-overlay');

    form.addEventListener('change', function () {
        overlay.style.display = 'flex';
        setTimeout(() => overlay.classList.add('visible'), 50);
    });
});
</script>
@endsection
