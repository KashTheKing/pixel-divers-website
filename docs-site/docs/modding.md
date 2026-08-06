---
id: modding
title: Modding
sidebar_position: 6
---

# Modding

Pixel Divers is built **data-first**: items, tiles, and mob spawns are `.tres` resource
files found by scanning, not hardcoded lists. A mod extends those scans with your own
content pack — new items, weapons, consumables, tile definitions, creature spawns, even
custom behaviours and creatures built from the game's own components. Mods are chosen
**per world** and distributed through the **Steam Workshop**.

A complete working mod (one edible `glow_berry` item with a pixel-art icon) ships in the
game repo at `mod-template/` — copy it, rename it, ship it.

:::caution Mods are code
A mod can ship its own scripts, and scripts run with the game's full privileges.
Subscribe to authors you trust.
:::

## Mod anatomy

A mod is a **`.zip` resource pack**. Every file inside sits under one
`mods/<mod_id>/` folder, with a `mods/<mod_id>/mod.json` manifest:

```
mods/
└── example_mod/           <- your mod id: lowercase letters, digits, _
    ├── mod.json           <- required manifest
    └── items/             <- ItemDef .tres files (+ .png icons)
        ├── glow_berry.tres
        └── glow_berry.png <- same basename as the .tres = used as its icon
```

```json title="mods/example_mod/mod.json"
{
  "id": "example_mod",
  "name": "Example Mod",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "One sentence for the mod list."
}
```

The rules:

- **`id`** is lowercase letters, digits, and `_`, and **must equal the folder name**.
  It's the mod's identity everywhere — the enabled list, the multiplayer handshake,
  `res://mods/<id>/`.
- **A pack with any file outside its own `mods/<id>/` folder is refused whole.** Packs
  mount straight into the game's filesystem, so nothing may reach outside its namespace.
- **Mods can never override game files or ids the game owns.** Core content scans first
  and wins collisions (a colliding mod id logs a warning and loses).

### Content folders

All optional — the game scans whichever exist:

| Folder | Resource | What it adds |
| --- | --- | --- |
| `items/` | `ItemDef` `.tres` | Items, weapons, consumables (see [Items & weapons](items-and-weapons.md)) |
| `tiles/` | `TileDefinition` `.tres` | Loot / durability / placement for tile types the game hasn't claimed |
| `mob_spawns/` | `MobSpawnEntry` `.tres` | Creature spawn-table rows: scene, per-chunk chance, depth range (`min_depth` / `max_depth`), climates mask |

`.tres` files are **plain text** — a text editor is all you need. They reference the
game's scripts and scenes by `res://` path (e.g. `res://core/items/item_def.gd`), which
resolve inside the running game; the template's `glow_berry.tres` is the worked example.
An `ItemDef` with no icon set uses a `.png` with the same basename beside its `.tres` —
that's the supported way to give a modded item art, since hand-zipped mods can't ship
Godot-imported textures.

Mods may also ship their own `.gd` scripts and `.tscn` scenes under their folder — a
custom item-use behaviour, or a whole creature composed from the game's components
(see [Entities & mobs](entities-and-mobs.md)).

### Building the .zip

Zip the `mods/` folder so the archive's paths start with `mods/<your_id>/`:

```bash
tar -a -c -f example_mod.zip mods
```

(or right-click the `mods` folder → *Compress to ZIP file* — any zip tool works as long
as `mods/` is the top-level entry.)

## Installing mods

Two ways:

1. **Steam Workshop** — just subscribe. Subscriptions are discovered automatically; no
   manual install.
2. **Local `.zip`** — drop it into the game's mods folder. On Windows:

   ```
   %APPDATA%\Godot\app_userdata\Pixel Divers\mods\
   ```

A local `.zip` **beats a Workshop copy of the same id** — so as an author you can test a
dev copy over your own published mod.

## Per-world mods

Mods are enabled **per world**, not globally:

- Pick them on the **Mods tab** of the Create World page. The choice is stored in that
  world's `server.properties` (the `mods=` row) — a dedicated server sets the same key.
- Vanilla worlds are untouched, and leaving a world returns the menus to vanilla
  content.
- If a world needs a mod you don't have (or a mod update needs a restart), world entry
  stops with a dialog naming it — a world never half-loads.
- **Removing a mod from a world is safe but lossy**: saved modded items survive as inert
  "ghost" items (id kept, no icon, no use) until the mod returns. Nothing is deleted.

### Multiplayer

The **server decides the mod set** — everyone in a world runs the identical set:

- Lobbies advertise their mods, so browsers can see a modded lobby up front.
- Joining a modded world, you're told exactly which mods you're missing **before your
  diver spawns**. Workshop subscriptions and local zips both satisfy the requirement.

## Steam Workshop

The Mods tab's **Find Mods** button opens the game's Workshop in the Steam overlay.
Subscribing is installing — the game picks up installed subscriptions on the next
refresh (the tab refreshes when shown).

## Publishing

Upload your `.zip` (plus a preview image) as a Workshop item with `steamcmd`:

```text title="workshop_item.vdf"
"workshopitem"
{
    "appid"          "4385080"
    "contentfolder"  "C:\\path\\to\\folder-containing-the-zip"
    "previewfile"    "C:\\path\\to\\preview.png"
    "visibility"     "0"
    "title"          "Example Mod"
    "description"    "..."
    "changenote"     "First release"
}
```

```bash
steamcmd +login <account> +workshop_build_item C:\path\to\workshop_item.vdf +quit
```

The content folder must contain **exactly one `.zip`**. After the first upload, add the
returned `publishedfileid` to the vdf so later runs update the same item.

## Not yet moddable

Known limits of the current system:

- **New tile types or tile art** — tile ids are a fixed 1-byte space shared by the
  generator, tileset, and save format; mods can only define *unclaimed* ids.
- **World generation** — generation must stay deterministic per seed, so mod biomes and
  floors need version pinning first.
- **Mod load order / dependencies** — the enabled set is sorted; mods can't declare
  dependencies on each other yet.
- **Overriding game content** — blocked by design; an explicit opt-in override mechanism
  may come later.
- **Version pinning** — worlds store mod ids, not versions; a world always runs the
  installed version.
