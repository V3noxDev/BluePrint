@extends('layouts.admin')

@section('title')
    Properties Editor
@endsection

@section('content-header')
    <div class="row">
        <div class="col-xs-12">
            <h1>Properties Editor <small>Minecraft: Java Edition server.properties, done right.</small></h1>
            <ol class="breadcrumb">
                <li><a href="/admin">Admin</a></li>
                <li><a href="/admin/extensions">Extensions</a></li>
                <li class="active">Properties Editor</li>
            </ol>
        </div>
    </div>
@endsection

@section('content')
    <div class="pe-admin">
        <div class="pe-admin__hero">
            <div class="pe-admin__badge">Blueprint Extension</div>
            <h2>server.properties, without the file manager</h2>
            <p>
                Properties Editor adds a polished <strong>Properties</strong> tab to every server page. Your users can flip
                gamerules, choose gamemodes and difficulty, tune performance and edit the raw file &mdash; all with a clean UI
                that respects Pterodactyl file permissions.
            </p>
            <div class="pe-admin__meta">
                <span><i class="fa fa-tag"></i> Version <b>1.0.0</b></span>
                <span><i class="fa fa-bullseye"></i> Target <b>stable-2025-04</b></span>
                <span><i class="fa fa-user"></i> Cursor Cloud Agent</span>
            </div>
        </div>

        <div class="pe-admin__grid">
            <div class="pe-admin__feature">
                <div class="pe-admin__icon">&#9881;&#65039;</div>
                <h3>Guided editor</h3>
                <p>Grouped sections for Gameplay, World, Players and Performance with toggles, dropdowns and validated numbers.</p>
            </div>
            <div class="pe-admin__feature">
                <div class="pe-admin__icon">&#128221;</div>
                <h3>Raw mode</h3>
                <p>Switch to a monospaced raw editor at any time. Comments and unknown keys are always preserved on save.</p>
            </div>
            <div class="pe-admin__feature">
                <div class="pe-admin__icon">&#128274;</div>
                <h3>Permission aware</h3>
                <p>Reads and writes through Pterodactyl's client API, so it honours each user's file read/write permissions.</p>
            </div>
            <div class="pe-admin__feature">
                <div class="pe-admin__icon">&#129513;</div>
                <h3>Any file</h3>
                <p>Defaults to <code>/server.properties</code> but can point at any properties-style file the server owns.</p>
            </div>
        </div>

        <div class="pe-admin__note">
            <h4>How to use</h4>
            <ol>
                <li>Open any Minecraft server in the client area.</li>
                <li>Click the new <b>Properties</b> tab in the server navigation (or the button inside the File Manager).</li>
                <li>Adjust settings, hit <b>Save changes</b> and restart the server to apply them.</li>
            </ol>
        </div>
    </div>
@endsection
