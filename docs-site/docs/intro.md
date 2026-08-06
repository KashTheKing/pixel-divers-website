---
id: intro
title: Introduction
sidebar_position: 1
slug: /
---

# Pixel Divers Docs

**Pixel Divers** is a 2D co-op ocean survival adventure built in **Godot 4.5**. Something
ancient calls from the floor of an alien sea, and its call pulls you down through a world
stacked seven layers deep — from open air and sunlit shallows through five ever-darker
reaches of ocean to a lightless Void where the terrain simply ends and the caller waits.

Every world is procedurally generated from a seed and fully yours to reshape: mine every
tile, carve tunnels through the seafloor, and leave marks the world remembers between
sessions. Play solo, or host a shared world over Steam and bring your friends down with
you. Along the way you manage oxygen, hunger, thirst, and sanity; craft gear from a tech
tree that climbs from surface scrap to void-grade alloys; build pressurized seafloor
habitats; and crew submarines with walkable interiors.

- [Wishlist on Steam](https://store.steampowered.com/app/4385080/Pixel_Divers/)
- [Join the Discord](https://discord.gg/aAdwxTzrkf)

## Who these docs are for

These pages are for **players who want to mod the game** and **contributors who want to
understand how it works**. They explain the ideas the engine is built on — the
composition model, the data-driven world, the server-authoritative networking — in
enough detail that you can read the game's actual scenes and resources and know what
you're looking at.

What's covered:

- **[Game architecture](architecture.md)** — how everything is put together: entities,
  components, features, and the simulation tick.
- **[World & terrain](world-and-terrain.md)** — layers, floors, biomes, climate, chunks,
  and what a world save actually contains.
- **[Items & weapons](items-and-weapons.md)** — the `ItemDef` data model, registries,
  and how item behaviour works.
- **[Entities & mobs](entities-and-mobs.md)** — how creatures and vehicles are assembled
  from components.
- **[Modding](modding.md)** — making, installing, and publishing mods.

## A note on stability

:::caution Active development

Pixel Divers is in active development. Class names, resource fields, and file layouts
described here can and will shift between builds. These docs track the current shape of
the game, but treat any specific API as provisional until release.

:::
