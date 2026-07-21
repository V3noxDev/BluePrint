# Properties Editor

A **Blueprint** extension for [Pterodactyl](https://pterodactyl.io/) that adds a beautiful, guided editor for the
Minecraft: Java Edition `server.properties` file — right inside the server page. No more digging through the file
manager to flip a gamerule.

![Blueprint](https://img.shields.io/badge/Blueprint-stable--2025--04-22c55e) ![Version](https://img.shields.io/badge/version-1.0.0-16a34a)

## Features

- **Guided editor** — grouped sections (Gameplay, World, Players, Performance & Network) with toggles, dropdowns and
  validated number inputs for the most-used properties.
- **Raw mode** — a monospaced editor for the full file. Comments and unknown keys are always preserved on save.
- **Other properties** — any key that isn't in the curated list is still shown and editable in its own section.
- **Permission aware** — reads and writes through Pterodactyl's own client API, honouring each user's file
  read/write permissions.
- **File-manager shortcut** — a "Properties Editor" button is injected into the File Manager toolbar.
- **Configurable target** — defaults to `/server.properties`, but you can point it at any properties-style file.
- **Interactive installer** — a menu-driven script (`installer.sh`) to package, install, update, remove or inspect
  the addon.

## Requirements

- A Pterodactyl panel with the [Blueprint framework](https://blueprint.zip) installed (targets `stable-2025-04`).
- `zip` on the machine running the installer (only needed for the packaging helper).

## Installation

### Option A — interactive installer (recommended)

Run the menu-driven installer on your panel host:

```bash
git clone https://github.com/<you>/propertieseditor.git
cd propertieseditor
sudo PANEL=/var/www/pterodactyl bash installer.sh
```

You'll get a selection menu:

```
1) Install / update Properties Editor
2) Remove Properties Editor
3) Query package info
4) Build .blueprint package only
5) Quit
```

Non-interactive equivalents:

```bash
bash installer.sh install     # package + install/update
bash installer.sh remove      # uninstall
bash installer.sh query       # print package metadata
bash installer.sh package     # build propertieseditor.blueprint only
```

### Option B — manual Blueprint commands

```bash
# From the extension directory, build the package
zip -rq propertieseditor.blueprint . -x ".git/*" -x "installer.sh" -x "README.md"

# Move it to your panel root and install
cp propertieseditor.blueprint /var/www/pterodactyl/
cd /var/www/pterodactyl
blueprint -install propertieseditor
```

To remove it later:

```bash
blueprint -remove propertieseditor
```

## Usage

1. Open any Minecraft server in the client area.
2. Click the new **Properties** tab in the server navigation (or the **Properties Editor** button in the File Manager).
3. Adjust settings, hit **Save changes**, then **restart the server** to apply them.

## Project structure

```
conf.yml                          # Blueprint manifest
assets/icon.svg                   # extension icon
admin/
  index.blade.php                 # admin showcase page
  Controller.php                  # admin controller (GET → index)
  admin.css                       # admin page styles
dashboard/
  dashboard.css                   # client UI styles (namespaced .mcpe-*)
  components/
    Components.yml                # hook points (server route + file button)
    ServerProperties.tsx          # the editor page
    PropertiesFileButton.tsx      # file-manager shortcut button
data/private/
  install.sh / update.sh / remove.sh   # lifecycle scripts
installer.sh                      # interactive installer
```

## Notes

- The extension never modifies files during install/remove — your `server.properties` is only ever changed when a
  user explicitly saves from the editor.
- Changes to `server.properties` require a **server restart** to take effect (Minecraft reads the file at boot).

## License

MIT
