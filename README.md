# MC Hub — Addon Manager & Properties Editor

A modern **[Blueprint](https://blueprint.zip/)** extension for Pterodactyl Panel that turns every Minecraft: Java server into a self-service control-plane:

- **Server properties editor** — every setting in `server.properties` as a typed input with grouping, descriptions and validation. Backups on save.
- **Addon manager (auto-installer)** — browse a curated catalogue of the most popular plugins & mods, filter by category or branch, install / remove in one click.
- **Admin panel** — configure the catalogue, default install folder, accent color and enabled categories.

Built to feel and look like the commercial Blueprint addons you see on `blueprint.zip` and BuiltByBit — a full-bleed hero, gradient cards, chips, toggles, toasts and confirmation dialogs.

---

## Table of contents

1. [Screens](#screens)
2. [Requirements](#requirements)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Configuration](#configuration)
6. [Development](#development)
7. [Extending the catalogue](#extending-the-catalogue)
8. [How it works](#how-it-works)
9. [Uninstalling](#uninstalling)
10. [License](#license)

---

## Screens

The extension exposes three routes on the client dashboard for every server:

| Route                                   | Description                                           |
| --------------------------------------- | ----------------------------------------------------- |
| `/server/{id}/mchub`                    | Landing page with two feature cards                   |
| `/server/{id}/mchub/properties`        | Full `server.properties` editor                        |
| `/server/{id}/mchub/addons`            | Addon manager (auto-installer & remover)              |

Plus the admin page at `/admin/extensions/mchub`.

---

## Requirements

- Pterodactyl Panel `v1.11.x` (recommended). The extension targets **Blueprint `beta-2025-09`** but Blueprint only surfaces a warning on target mismatch — it will still install on adjacent versions.
- [Blueprint Framework](https://blueprint.zip/) installed on the panel — see the [official install guide](https://blueprint.zip/guides/admin/install).
- Wings daemon reachable from the panel (used by the file endpoints).

---

## Installation

### From a `.blueprint` package (recommended)

```bash
# 1. build the package on your machine (or download a prebuilt release)
./build.sh
# -> produces mchub.blueprint

# 2. copy it to the Pterodactyl webserver directory
scp mchub.blueprint  root@panel:/var/www/pterodactyl/

# 3. install it with Blueprint
ssh root@panel
cd /var/www/pterodactyl
blueprint -install mchub
```

### From source (dev mode)

```bash
# On the panel, with Blueprint developer mode enabled:
cp -r /path/to/this/repo /var/www/pterodactyl/.blueprint/dev
cd /var/www/pterodactyl
blueprint -build
```

---

## Usage

### For server owners / players

1. Open your Minecraft server on the Pterodactyl dashboard.
2. Click the **MC Hub** entry in the server sub-navigation.
3. Choose either:
   - **Server properties** → tweak any setting, hit **Save changes**.
   - **Addon manager** → pick a branch (Paper/Spigot/Purpur/Forge/Fabric/NeoForge), filter, click **Install** or **Uninstall**.
4. Restart the server for changes to take effect (Minecraft only reads `server.properties` at boot).

### For administrators

1. Navigate to **Admin → Extensions → MC Hub**.
2. Configure defaults (install folder, default server branch, accent color).
3. Enable or disable catalogue categories globally.
4. Extend the built-in catalogue with your own addons via **Custom catalog entries**.

---

## Configuration

Admin settings persisted by Blueprint's `dbSet` API (namespaced under `mchub::*`):

| Key                    | Default                                                              | Description                                                 |
| ---------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `install_folder`       | `plugins`                                                            | Default folder used by the auto-installer                   |
| `default_branch`       | `paper`                                                              | Suggested Minecraft server flavour                          |
| `enabled_categories`   | `core,economy,worldmgmt,admin,fun,protection,performance`           | Which catalogue chips users can see                         |
| `accent_color`         | `#4ade80`                                                            | Accent color used throughout the UI                         |
| `custom_catalog`       | `[]`                                                                 | Extra catalogue entries (JSON array — same schema as built-in) |
| `require_confirm`      | `1`                                                                  | Ask for confirmation before install/remove                  |

---

## Extending the catalogue

Add extra entries from the admin page as a JSON array, each entry looking like:

```json
[
  {
    "id": "myplugin",
    "name": "My Awesome Plugin",
    "author": "Me",
    "category": "core",
    "branches": ["paper", "purpur"],
    "filename": "MyAwesomePlugin.jar",
    "url": "https://example.com/downloads/MyAwesomePlugin.jar",
    "description": "Does something amazing.",
    "website": "https://example.com"
  }
]
```

Fields:

| Field         | Required | Notes                                                                 |
| ------------- | -------- | --------------------------------------------------------------------- |
| `id`          | ✅        | Unique across the whole catalogue                                    |
| `name`        | ✅        | Display name                                                          |
| `filename`    | ✅        | Filename on disk (used for install/uninstall detection)               |
| `url`         | ✅        | Direct download URL — must be publicly reachable by the Wings daemon |
| `category`    |          | One of the seven built-in categories                                  |
| `branches`    |          | Array of `paper`, `spigot`, `purpur`, `forge`, `fabric`, `neoforge` |
| `author`      |          | Author label                                                          |
| `description` |          | Short description shown on the card                                   |
| `website`     |          | Adds an **Info** button linking out                                   |

---

## Development

The extension follows the standard Blueprint layout:

```
.
├── conf.yml                        # Blueprint extension manifest
├── icon.svg                        # Extension icon (info.icon)
├── admin/
│   ├── view.blade.php              # Admin panel view
│   ├── controller.php              # Admin controller + form request
│   └── admin.css                   # Admin-only styles
├── root.css                        # Shared dashboard styles (dashboard.css)
├── components/                     # React dashboard components
│   ├── Components.yml              # Route + nav bindings
│   ├── tsconfig.json
│   ├── lib/
│   │   ├── api.ts                  # Pterodactyl client-file API wrapper
│   │   ├── catalog.ts              # Built-in catalogue + types
│   │   └── properties.ts           # server.properties parser + schema
│   ├── elements/
│   │   ├── HubNavItem.tsx          # Sub-nav entry
│   │   ├── ConfirmDialog.tsx
│   │   └── Toasts.tsx
│   └── sections/
│       ├── McHubSection.tsx        # Landing page
│       ├── PropertiesEditor.tsx    # server.properties editor
│       └── AddonManager.tsx        # Auto-installer / catalogue
├── public/
│   └── catalog.json                # Catalog metadata snapshot (for external tooling)
├── private/                        # Blueprint's private storage
├── build.sh                        # Packaging helper
├── LICENSE
└── README.md
```

Iterate on the panel with:

```bash
cd /var/www/pterodactyl
blueprint -build   # rebuild extension from .blueprint/dev
```

---

## How it works

**Reading & writing `server.properties`** — the editor calls Pterodactyl's built-in client file API on the current server:

- `GET  /api/client/servers/{uuid}/files/contents?file=server.properties`
- `POST /api/client/servers/{uuid}/files/write?file=server.properties`

Both requests inherit the user's session and CSRF token, so no additional auth wiring is needed. Comments and blank lines are preserved verbatim, unknown keys are round-tripped, and a `server.properties.mchub.bak` copy is written before every save.

**Installing / removing addons** — the manager uses:

- `POST /api/client/servers/{uuid}/files/pull`   → asks Wings to fetch the addon URL directly into `/plugins` or `/mods`
- `POST /api/client/servers/{uuid}/files/delete` → removes the previously installed jar
- `GET  /api/client/servers/{uuid}/files/list`   → detects which catalogue entries are already installed

Because the daemon downloads the file (not the browser), install works for arbitrarily large files with none of the CORS pain of a client-side download.

---

## Uninstalling

```bash
cd /var/www/pterodactyl
blueprint -remove mchub
```

Blueprint tears down all extension routes, controllers, views and the admin settings. Files previously installed by the addon manager into `/plugins` or `/mods` stay untouched.

---

## License

[MIT](./LICENSE) — do whatever you want, just don't blame us if your world eats itself.
