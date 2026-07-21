# MC Properties Editor

A **Blueprint** extension for [Pterodactyl](https://pterodactyl.io) that adds a
beautiful, no-code **Properties** tab to every server panel — letting your users
edit their Minecraft: Java Edition `server.properties` file with toggle switches,
dropdowns and smart inputs instead of digging through a text file.

![Blueprint](https://img.shields.io/badge/Blueprint-extension-22c55e) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

- **Structured editor** covering every vanilla `server.properties` key, grouped into
  logical categories (General, World & Generation, Players & Spawning, Performance,
  Commands & RCON, Query & Network, Resource Pack & Security).
- **Toggle switches** for booleans, **dropdowns** for gamemode / difficulty /
  level-type / permission levels, and **smart inputs** for numbers and text.
- **Raw editor mode** for full manual control of the file.
- **Live search** across every property.
- **Plugin/mod keys preserved** — unknown properties in the file are shown in an
  "Other Properties" section and never lost on save.
- **Permission-aware** — respects Pterodactyl's `file.read-content` and
  `file.update` subuser permissions.
- **Clean, modern UI** built with React + styled-components, matching the quality
  of premium marketplace extensions.

---

## 📦 Installation

You need a Pterodactyl panel with [Blueprint](https://blueprint.zip) already
installed.

### Option A — Interactive installer (recommended)

Copy this folder onto your panel machine and run the guided installer:

```bash
sudo bash install.sh
```

You'll get a menu to **install**, **update**, **remove** or **re-package** the
extension. It auto-detects your panel at `/var/www/pterodactyl` (override with the
`PTERODACTYL_DIR` environment variable or from the menu).

### Option B — Manual install

Build the package and install it with the Blueprint CLI:

```bash
bash build.sh                              # creates mcproperties.blueprint
cp mcproperties.blueprint /var/www/pterodactyl/
cd /var/www/pterodactyl
blueprint -install mcproperties
```

To remove it later:

```bash
blueprint -remove mcproperties
```

---

## 🧭 Usage

Once installed, open any server in the client panel — a new **Properties** entry
appears in the server navigation. Select it, toggle/adjust the settings you want,
and hit **Save Changes**. Restart the server for the changes to take effect.

> The editor reads and writes `/server.properties` in the server's root
> directory. If the file doesn't exist yet, start the Minecraft server once so it
> generates one.

---

## 🗂️ Project structure

```
.
├── conf.yml                     # Blueprint extension manifest
├── app/
│   └── PropertiesController.php  # Reads/writes server.properties via Wings
├── routes/
│   └── web.php                  # Backend routes
├── resources/
│   ├── icon.svg                 # Extension icon
│   ├── views/view.blade.php     # Admin panel page
│   └── scripts/components/
│       ├── Components.yml        # Registers the "Properties" route
│       └── server/properties/
│           └── PropertiesEditor.tsx  # The React UI
├── build.sh                     # Packages the extension into .blueprint
├── install.sh                   # Interactive install/remove/update menu
└── README.md
```

---

## 🔒 Security

- All file operations go through Pterodactyl's own Wings daemon file repository —
  no direct filesystem or SFTP access.
- Every request is authorized against the server's subuser permissions
  (`file.read-content` to view, `file.update` to save).
- No credentials or tokens are ever stored in the frontend.

---

## 📄 License

MIT — see [LICENSE](./LICENSE).
