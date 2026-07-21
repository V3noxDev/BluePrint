# MineControl

**Blueprint extension for Pterodactyl** — install/remove Minecraft Java addons with multi-select, and edit `server.properties` from a polished client UI.

Target: Blueprint `beta-2026-01` · Panel route: `/server/<id>/minecontrol`

## Features

### Addon installer
- Search Modrinth plugins or mods from the panel
- Filter by loader (Paper, Purpur, Fabric, Forge, …) and sort
- Version picker with one-click install into `/plugins` or `/mods`
- Installed jar list with **multi-select remove**
- Enable / disable jars via `.jar.disabled` rename (no delete required)

### server.properties editor
- Categorized UI (General, Gameplay, World, Performance, Network, Security)
- Typed controls: toggles, selects, numbers, passwords
- Preserves unknown/extra keys
- Auto-backup to `server.properties.minecontrol.bak` on save
- Manual backup / restore actions

## Install

1. Copy `minecontrol.blueprint` into your Pterodactyl root (usually `/var/www/pterodactyl`).
2. Install:

```bash
cd /var/www/pterodactyl
blueprint -install minecontrol
```

3. Open **Admin → Extensions → MineControl** for default directory / backup settings.
4. Restrict the route to Minecraft eggs under Blueprint’s egg permissions if desired.

## Remove

```bash
blueprint -remove minecontrol
```

## Permissions

| Action | Required permission |
|--------|---------------------|
| List plugins / read properties | `file.read` |
| Install addon | `file.create` |
| Remove addon | `file.delete` |
| Toggle / save properties | `file.update` |

## Develop

Source lives in `minecontrol/`. After editing on a Blueprint-enabled panel:

```bash
blueprint -upgrade minecontrol   # or reinstall during development
# optional watch mode (Blueprint beta-2025-09+)
blueprint -watch minecontrol
```

To rebuild the distributable archive from this repo:

```bash
./scripts/package-blueprint.sh
```

## Structure

```
minecontrol/
├── conf.yml
├── icon.svg
├── admin/           # Admin settings UI
├── app/             # Plugin + Properties controllers
├── routes/web.php   # /extensions/minecontrol/*
├── components/      # React pages + CSS + Components.yml
├── public/
└── private/
```

## Notes

- Wings must be reachable; file ops use `DaemonFileRepository`.
- `server-port` / bind IP are usually managed by Pterodactyl allocations — change carefully.
- Restart (or reload) the Minecraft process after property changes for many keys to apply.
