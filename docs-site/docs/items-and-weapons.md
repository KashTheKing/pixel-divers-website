---
id: items-and-weapons
title: Items & weapons
sidebar_position: 4
---

# Items & weapons

Items in Pixel Divers are **pure data**. An item type is one `ItemDef` resource file; it
is never instantiated as an object in the world. What an item *does* lives in a separate
behaviour scene the server runs on use. This split — data in `.tres`, behaviour in one
scene — is what makes items easy to add and easy to mod.

## ItemDef: the item data model

`ItemDef` is a `Resource` (one `.tres` per item under the items folder), keyed by its
`id`. These are its exported fields as of the current build:

| Field | Type | What it does |
| --- | --- | --- |
| `id` | `StringName` | Registry key. How inventories, saves, and the network refer to this item. |
| `icon` | `Texture2D` | One texture used both as the inventory icon and the in-hand sprite. |
| `display_name` | `String` | Name shown to players. |
| `lore` | `String` (multiline) | Flavour text. |
| `two_handed` | `bool` | Whether the off hand grips the item too. |
| `offset` | `Vector2` | Sprite offset from the hand holding it. |
| `off_hand_grip` | `Vector2` | Where the off hand grips, measured from the primary grip in item space. Only read when `two_handed`. |
| `hold_distance` | `float` | How far from the diver's centre the item is held (px). The item orbits at this radius and the arms reach out to it. |
| `sprite_rotation_degrees` | `float` | Rotates the sprite about its grip, for art not drawn pointing along +x (a spear drawn vertically wants -90). |
| `follow_mouse` | `bool` | Whether the item tracks the aim. |
| `stack_size` | `int` | Max items per inventory slot; 0 or negative = infinite. |
| `use_behaviour` | `PackedScene` | Scene whose root is an `ItemUse` — the item's click behaviour, instanced **server-side**. Null = the item does nothing. |
| `use_cooldown` | `float` | Minimum seconds between two accepted uses. Enforced by the server. |
| `lethal_speed` | `float` | Speed (px/s through the world) the item's hitbox must be moving at to wound. 0 = damage is not velocity-gated. |
| `stab_lethal_speed` | `float` | Separate lethal speed for stabs (motion along the aim) when above 0 — set lower than `lethal_speed` to make the point easier to wound with than the flat. 0 = stabs use `lethal_speed`. |
| `trail_tip_distance` | `float` | How far past the grip the blade's tip sits (px along the aim) — where the weapon trail draws. 0 = no trail. |
| `stab_reach` | `float` | How far holding primary-use thrusts the weapon out past its hold distance (px). The thrust motion itself is what crosses `lethal_speed`. |
| `stab_damage_type` | `StringName` | Damage type for motion *along* the aim (default `"piercing"`). |
| `swing_damage_type` | `StringName` | Damage type for motion *across* the aim (default `"slashing"`; a spear swung side-on sets `"blunt"`). |
| `swing_style` | enum `NONE` / `JAB` / `OVERHEAD` | How the arm animates on use. Cosmetic only — damage timing never depends on it. |
| `swing_seconds` | `float` | How long the swing animation takes. Independent of `use_cooldown`. |
| `swing_reach` | `float` | How far the hand travels along the aim at the peak of the animation (px). |
| `swing_raise_degrees` | `float` | `OVERHEAD` only: how far the arm lifts before it comes down. |

:::note
Fields shift as the game develops — when in doubt, the source of truth is
`core/items/item_def.gd` in the game repo.
:::

## Registries

**`ItemRegistry`** is an autoload that scans the items folder for `.tres` files at boot
and maps `id → ItemDef`. Nothing registers itself; **a file in the folder is an item.**
The sorted list of ids doubles as a network-stable index, so peers agree on what item
"7" means without ever sending strings.

The same pattern repeats across the game: `TileRegistry` maps tile types to
`TileDefinition`s (durability, loot, placed-by item), and the two meet in the middle —
a tile's loot table says which items a broken tile drops, and its `placed_by` says which
item places it.

Inventory contents are saved as **JSON keyed by registry id**, deliberately not as
serialized Godot resources: resource files embed script paths, so renaming a script
would break every save in the wild. Registry ids keep saves stable — and they're also
what makes drop-in item content possible with no code changes elsewhere.

## ItemUse: what happens on click

The flow when a player clicks:

1. The owning peer latches the click and sends a use request on the CHARACTERS tick.
2. The **server** checks `use_cooldown`, instances that item's `use_behaviour` scene
   (root an `ItemUse` node), and calls `use_primary(user)` or `use_secondary(user)`.
3. Because the behaviour exists **on the server only**, anything other peers must see or
   hear has to be explicitly sent — an effects RPC, a hitbox on the user, or an RPC on a
   replicated component.

`ItemUse` extends `Node2D` and is instanced under the hand anchor, so a behaviour that
puts something into the world (a projectile, a placed tile) inherits the held item's
position and aim for free. The component that renders the held item (`EquippedItem`)
names no items — it renders whatever the `ItemDef` describes and forwards use requests.
One scene per item that does something: an edible is a scene rooted in the shared
consume script plus a `.tres`; a harpoon gun's scene spawns a server-owned projectile
entity.

## Velocity-gated melee

Melee weapons have no timed "swing window". Instead, every tick the **server measures
how far the weapon's hitbox actually travelled** through the world:

- Motion at or above the item's `lethal_speed` wounds; damage scales with the excess
  speed, up to a cap.
- Direction matters: motion *along* the aim is a **stab** dealing `stab_damage_type`;
  motion *across* the aim is a **swing** dealing `swing_damage_type`. A knife slashes;
  a spear swung side-on is a blunt pole.
- Holding primary thrusts the weapon out by `stab_reach` — the thrust motion itself is
  what crosses the lethal speed.
- The weapon behaviour is instanced on *equip*, not on first click — so an unclicked
  weapon still wounds if you genuinely swing it fast.

The client-side tell is the **weapon trail**: a small line riding the blade tip
(`trail_tip_distance`), white while merely moving, **red at or above `lethal_speed`**.
It reads the same one number the server's damage gate reads, so the tell can never
disagree with the rule.

Defence follows the same server-validated shape: a **parry** (right click with a melee
weapon held) negates damage arriving from inside an aimed arc during a short window, and
a **dash** opens a brief dodge window that negates everything. Both are damage *gates*
consulted by the server before a hit lands — multipliers on the one damage funnel every
source already goes through.
