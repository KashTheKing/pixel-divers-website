---
id: modding
title: Modding
sidebar_position: 6
---

# Modding

:::info Coming soon

The modding system is being finalized right now — this page is a placeholder that will
become the full modding guide.

:::

Pixel Divers is built **data-first** with modding in mind. The registries that define
the game's content don't keep hand-maintained lists — they *scan* for resource files, so
a new item, tile, or biome is a dropped-in `.tres`, not an engine change. Mods mount
under `res://mods/<mod_id>/` and are enabled **per world**, and Steam Workshop
integration is planned for discovery and installs.

The sections below sketch the shape of the guide to come.

## Mod anatomy

<!-- TODO: document the mod folder layout — manifest, content folders the registries
scan (items, tiles, biomes), behaviour scenes, and asset conventions. -->

*TODO — what a mod folder looks like: the manifest, where content resources go, and how
registry scanning picks them up.*

## Installing mods

<!-- TODO: document where local mods are placed on disk and how the game discovers
them at boot. -->

*TODO — where mods live on disk and how the game finds them.*

## Per-world mods

<!-- TODO: document enabling/disabling mods per world, and what happens to a world
save when a mod it used is removed. -->

*TODO — mods are enabled per world, not globally; document the world settings flow and
save-compatibility rules.*

## Steam Workshop

<!-- TODO: document Workshop browsing, subscribing, and how subscribed items map to
mounted mods. -->

*TODO — subscribing to mods on the Workshop and how they sync to your install.*

## Publishing

<!-- TODO: document packaging a mod and uploading it to the Workshop. -->

*TODO — packaging your mod and publishing it for others.*
