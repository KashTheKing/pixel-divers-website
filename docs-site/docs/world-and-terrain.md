---
id: world-and-terrain
title: World & terrain
sidebar_position: 3
---

# World & terrain

The world of Pixel Divers is infinite horizontally, layered vertically, generated
deterministically from a seed — and defined almost entirely by **data resources**, not
code. This page walks through the resource stack, how the world streams in chunks, and
what a world save actually contains.

## The vertical stack: layers, floors, shelves

The design's seven ocean layers run from open air at the surface down to the Void:
sunlit shallows, twilight forests, midnight darkness, the abyss, the trenches, and
finally endless black water with no terrain at all. Between layers sit **sea shelves** —
thick rock bands that gate progression (early ones can be swum through; deeper ones
demand submersibles, heavy drills, and permanent gates).

In data, that maps cleanly:

- The air above sea level is layer 0.
- **Five `WorldFloor` resources** are layers 1–5. A floor is one seafloor plus the rock
  band beneath it, down to the next floor — the rock band *is* that layer's shelf.
- Below the deepest floor's `void_y` there is simply no terrain: layer 6, the Void.

## The resource stack

Generation is data-driven top to bottom. The generator holds **no tuned numbers of its
own** — everything comes from resources:

- **`WorldProfile`** (`.tres`) — the whole world's shape: a `generation_version` (pinned
  per saved chunk, so old saves keep generating with the rules they were created under),
  the sea level, an ordered stack of floors, and an optional `ClimateTrack`.
- **`WorldFloor`** — one layer. Each floor owns its biomes, its carvers (cave passes),
  and its ore veins.
- **`Biome`** — a palette, not a feature list: an ordered set of `BiomeTileLayer`s
  (what the rock is) each carrying `StructureSpawn`s (what grows from it). **A new biome
  is a new `.tres` file, not new code.**
- **`ClimateTrack`** — the mega-climate overlay: one 1D noise splitting the world into
  horizontal **Cold / Neutral / Hot** bands that cut through every depth layer.
  `climate_at(tile_x)` is a pure function of (seed, column), so every peer computes the
  same answer. Biomes and structure spawns can filter on climate via a flags mask.
- **Carvers, ore veins, structures** — generation passes owned by floors and biomes
  (`NoiseCarver`, `OreVein`, `ColumnStructure`, …).

Determinism is the contract: **same seed + same profile version = same tiles, always.**
That's what makes streaming, multiplayer, and the save format below all work.

## Tiles and chunks

- Tiles are **8 px**; a chunk is **16×16 tiles**. Sea level is tile Y 0 and Y grows
  downward.
- Tiles render on three `TileMapLayer`s — background, midground, foreground — with
  autotiling. A tile's identity is a single byte (`TILE_TYPE`), shared by the generator,
  the tileset, and the save format.
- Per-tile data (durability, loot table, which item places it) lives in
  **`TileDefinition`** resources, looked up through the `TileRegistry` autoload. A tile
  type with no authored definition gets a shared fallback rather than an error.

## Streaming: how the world loads

The server owns the chunk lifecycle through **`WorldLoader`**:

1. Every tick (the CHUNKS phase), it scans player positions.
2. Chunks inside each peer's window are generated (or loaded from the save) and
   delivered as packed bytes **per peer** — never broadcast.
3. Chunks that fall out of every window unload, flushing changes to disk.

Entities ride the same rail. When a chunk activates, `ChunkEntityStore` spawns the
saveable entities standing in it; when the chunk deactivates, they're written back. An
entity's lifetime is its chunk's lifetime, not the world's. (Mobs are the deliberate
exception — fish are renewable scenery, spawned per chunk and never saved.)

## What a world save contains

Because generation is deterministic, the save only stores **divergence from the
generator** — the delta store:

- **A freshly generated chunk is never written to disk.** If you never touched it, the
  seed can always rebuild it.
- Editing a tile marks its chunk dirty; dirty chunks flush on unload, on an interval,
  and on save.
- **Entities** carrying the `SaveableEntity` marker component (vehicles, for example)
  are persisted per chunk, one JSON file per chunk, respawned from their own scene path
  at the transform they had. Divers are not chunk entities — each player's character is
  saved per player instead.
- **Inventories** save as JSON keyed by registry item ids — not serialized Godot
  resources — so renaming a script never breaks a save file.

So a world save is: the profile + seed, the edited-chunk deltas, per-chunk entity files,
and per-player data. Everything else regenerates.

## Time, light, and climate at runtime

- **`DayNightClock`** is *the* time-of-day value (0 = midnight, 0.5 = noon),
  server-owned and re-broadcast every few seconds; clients advance a local copy between
  syncs. Nothing else may own a notion of world time.
- Lighting composes three terms — depth/biome/night ambient, an occluded sky light (sun
  by day, moon by night, blocked by midground rock so caves read dark), and local
  `PointLight2D` sources. There is no hand-rolled light propagation.
- Client code reads the local player's position, biome, and climate through the `Game`
  facade (`Game.local_biome`, `Game.local_climate`, and matching `*_changed` signals)
  rather than poking at world internals.
