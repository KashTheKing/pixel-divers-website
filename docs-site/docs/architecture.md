---
id: architecture
title: Game architecture
sidebar_position: 2
---

# Game architecture

Pixel Divers is a networked 2D underwater survival game on **Godot 4.5**, using a custom
**GodotSteam MultiplayerPeer** build for Steam networking. This page explains the four
ideas that shape everything else: composition over inheritance, core vs features,
server-authoritative multiplayer, and the fixed simulation tick.

## Composition: entities are containers, not class trees

If you've modded other games, you might expect a class hierarchy like
`Aquanaut → Vehicle → Character → Entity`. Pixel Divers used to have exactly that — and
deleted it. Today:

- **`Entity` is a plain `Node`.** It's a container holding a network-stable `entity_id`,
  an optional `body: Node2D` child (which carries the transform and physics), and a
  registry of components. An Entity has no transform of its own — `entity.global_position`
  proxies to its body.
- **There is no `Diver`, `Vehicle`, or `Aquanaut` class.** Those are **scenes** — the
  same `Entity` root wired with different component compositions. `Character` exists
  only as an empty marker class for type annotations.
- **Components are child nodes.** A component that others need to look up (or that
  carries RPCs) extends `EntityComponent`; pure behaviours are plain `Node`/`Node2D`
  scripts that read only their own `@export` references.
- **Lookup is `find_component`.** Instead of walking the scene tree, code asks the
  entity: `entity.find_component(VehicleSeats)`.

Why this matters for you: **adding or removing a behaviour is adding or removing a
node.** A fish and a hostile mob are the same shape with different components and
different exported values. Differences between variants live in `.tscn` files — never in
script inheritance. If you want a mountable creature, you compose a scene with the mount
components; you don't subclass anything.

The rules of thumb the codebase follows:

- Behaviour reused across two or more entity types → a **component** with `@export`
  config.
- One-off behaviour scoped to a single scene → a **script on a sub-node** of that scene.
- Pure tuning differences → values in the `.tscn` or a `.tres`. No new file at all.

## Core vs features

The project splits into two worlds:

```
godot/
├── core/       infrastructure every feature may use
│               (entity/components, networking, spawning, items, tiles,
│                world + tick, scene loading, shared assets)
├── features/   one folder per game mechanic
│               (diving, terrain, vehicles, inventory, combat, mob, hud, …)
└── resources/  authored world content (world profiles, biomes)
```

The dependency rules are strict and simple:

1. `features/*` may depend on `core/*`. **Features never import other features.**
2. Cross-feature communication happens through signals on a `core` autoload or a shared
   component contract in `core/entity/components/` (for example `Health`: combat damages
   it, the HUD reads it, food restores it — and none of those features import each
   other). A short blessed list of feature-owned "contract classes" may be named in type
   annotations across features; anything not on the list may not cross feature folders.
3. Each feature has **one public entry point** — an autoload or a scene path. Everything
   else is internal.

Registries are autoloads: `ItemRegistry` (item id → `ItemDef`), `TileRegistry` (tile
type → `TileDefinition`), `VehicleRegistry` (the single entry point for mounting). They
scan resource files at boot rather than keeping hand-maintained lists — which is the
foundation the modding story is built on.

## Server-authoritative multiplayer

**The server is the single source of truth; clients are renderers that send inputs.**

- A listen server (you hosting for friends) is just a dedicated server with a local
  client attached. There is no separate "host" code path — the server delivers data to
  its own client through the same functions it uses for remote peers.
- Authority over an entity is set once at spawn and never changes at runtime. A
  character having "your" authority means *your input drives it* — not that your client
  owns its position.
- **Inputs go up, state comes down.** `MovementInput` sends sequence-numbered inputs to
  the server, which simulates them; your client predicts locally and reconciles by
  rollback when the server disagrees. `NetworkTransform` streams server transform
  snapshots down; clients interpolate one tick behind.
- **Damage is validated server-side only.** A `Hitbox` carries a damage payload; a
  `Hurtbox` validates the hit on the server, applies it to `Health`, and replicates the
  result through a server-guarded RPC. Clients cannot fake a hit — and every damage
  source in the game, from daggers to vehicle rams, funnels through this one contract.
- Melee is **velocity-gated**: the server measures how fast a held weapon's hitbox
  actually moved through the world each tick, and only motion at or above the item's
  `lethal_speed` wounds (see [Items & weapons](items-and-weapons.md)).

For contributors the practical rule is: anything that changes game state runs on the
server; anything cosmetic (animations, trails, particles, audio) derives from replicated
state locally on each peer and is never itself replicated.

## The simulation tick

Simulation runs on a fixed **20 Hz** tick with a documented phase order, driven by a
`TickScheduler`:

```
CHUNKS → TILES → CHARACTERS → VEHICLES → RIDERS → ENVIRONMENT → FLUSH
```

- Simulation work registers on a phase — never in `_physics_process` or `_process`.
  Scene-tree order is not a simulation order.
- Tick code uses the fixed `TICK_DELTA` (1/20 s), never a frame delta.
- Rendering interpolates between ticks, so 20 Hz simulation still looks smooth.

Why phases? Determinism and ordering. Chunks stream before tiles update, characters move
before the vehicles they ride, riders are carried after their vehicle moves, and
environment effects (oxygen drain, day/night) resolve before the tick flushes. If you
write a component that simulates anything, it registers on the phase where it belongs
and the ordering questions answer themselves.

## Where decisions are recorded

The game repo keeps **architecture decision records** (ADRs) documenting the reasoning
behind the big calls — why `Entity` is a plain Node, why there are no data-inheritance
chains, why authority is imposed externally, why inventory saves as JSON keyed by
registry id. When these docs say "this is how it works", an ADR usually says *why*.
