---
id: entities-and-mobs
title: Entities & mobs
sidebar_position: 5
---

# Entities & mobs

Everything that exists in a Pixel Divers world — divers, fish, submarines, corpses,
harpoons in flight — is an **Entity**: a plain container node assembled from components.
This page shows how creatures are composed and what happens over an entity's lifetime.

## Component composition

An Entity scene looks like this:

```
Entity (Node)                 entity_id, component registry
├── Body (Node2D subtype)     transform + physics; the thing in space
│   └── Visuals               sprites, animation targets
├── Health                    core damage contract
├── Hurtbox                   receives hits, validates server-side
├── NetworkTransform          server snapshots down, clients interpolate
└── …behaviour components     movement, AI, effects — one node each
```

- The Entity itself has no transform; the optional **`body`** child carries it. The body
  can be a `CharacterBody2D`, a `RigidBody2D`, a plain `Node2D`, or absent entirely
  (pure-data entities are legal).
- Components that other code looks up — or that carry RPCs — extend `EntityComponent`
  and are found via `entity.find_component(Type)`. Pure behaviours are plain nodes that
  read only their own `@export` references.
- **Authority is imposed from outside.** Spawners and the vehicle registry call
  `AuthorityMirror.set_authority(id)`; an entity never sets its own multiplayer
  authority.

## How creatures are assembled

**There is no Mob class.** A creature is an Entity scene composed from shared mob
components plus `Health`, a `Hurtbox`, and `NetworkTransform`. A harmless fish and a
hostile sycophant are *the same shape* with different components and tuning:

- **`MobWander`** — server-side drift: a heading re-rolled by a timer, eased toward each
  tick. Deliberately not steering AI. Its `enabled` flag is the handle a pursuit
  component parks it with.
- **`SycophantPursuit`** — the hostile-fish brain: an `Area2D` maintains a candidate
  list, the server picks a target, chases on the CHARACTERS tick, and sweeps its
  `Hitbox` into the victim's `Hurtbox`. The hitbox's own cooldown *is* the attack
  cooldown.
- **`FloatWhenDead`** — the dead mob's movement: rises to the surface and holds there.
  Living movement components check `is_alive()` and stand down; this one does the
  inverse.
- **`Butcherable`** — a dagger swing landing on a *dead* entity grants an item to the
  butcher and swaps the visuals to a skeleton.
- **`DecomposeOnDeath`** — the one dead-entity lifetime: fade, dust burst, despawn after
  a delay. Two different lifetimes (fresh corpse vs butchered skeleton) are the same
  component re-armed with a different delay — not a special case.
- **`RamDeath`** — vehicle impacts above a speed threshold synthesize a one-shot hitbox
  and feed it through the normal damage contract, so rams reuse the same path as every
  other damage source.

Want a new creature? Compose a scene: pick the components, set the exported tuning,
point the visuals at your sprites. A creature variant that just swims slower or hits
harder is a `.tscn` edit — **zero new code**.

The same doctrine covers the player and vehicles. A diver is an Entity scene wired with
the "character bundle" (`Health`, `MovementController`, `Inventory`, `EquippedItem`,
survival meters, …). A submarine is an Entity scene with seat components, physics, and —
on the big ones — a walkable interior. Different scene, same building blocks.

## Movement

Movement composes too:

- **`MovementController`** owns one dispatch rule: rider in a vehicle → do nothing (the
  vehicle moves the rider); otherwise delegate to the active movement type.
- **`MovementType`** is a strategy base — swim, walk, air — selected by an
  **`EnvironmentSensor`** reading the surrounding tiles. This strategy-interface base
  class is one of the few permitted "inheritance" shapes: it declares a contract, not a
  data hierarchy.
- For player-driven entities, **`MovementInput`** handles the networking: sequenced
  inputs up, server simulation, client prediction with rollback.

## Spawn lifecycle

Entities enter the world through one funnel: **`EntitySpawner`**
(a `MultiplayerSpawner` in core).

1. The **server** calls
   `create_server_entity(scene_path, position, authority)`.
2. The spawner assigns the next network-stable `entity_id`, instantiates the scene on
   every peer, places it, and sets its multiplayer authority.
3. Components register with their Entity as they enter the tree; simulation components
   register on their tick phase.

From there, lifetime is owned by the world's streaming:

- **Entities follow chunks.** When a chunk activates, `ChunkEntityStore` (server-only)
  spawns the saveable entities standing in it; when the chunk deactivates, it writes
  them back to disk — one JSON file per chunk. Which chunk owns an entity is derived
  from its position, never stored. An occupied vehicle is exempt from unloading.
- **Mobs are renewable scenery.** `MobSpawner` rolls a seeded chance per freshly
  activated chunk, spawns into open water, and despawns that chunk's mobs on
  deactivation. Mobs are deliberately not saved.
- **Death is a state, not a deletion.** "Dead" is `entity.is_alive()` — never a health
  comparison. Components that must not run while dead check it themselves. On a diver's
  death the server spawns a separate corpse entity (with per-peer ragdoll debris) and
  the world starts a replicated respawn countdown; mobs float, decompose, and despawn
  through their death components instead.
- Despawning is the server freeing the entity (`delete_server_entity`), which replicates
  removal to every peer; freeing the Entity frees its body and components with it.
