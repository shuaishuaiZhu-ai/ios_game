/**
 * Describes an art asset loaded by the game.  Each entry specifies a unique
 * texture key along with the relative path to the asset under the `public` folder.
 * Optional size values can be provided for images.  Spritesheets may specify
 * `frameWidth` and `frameHeight` when multiple frames are packed into a single
 * sheet.  When `frameWidth` is defined the preloader will automatically load
 * the texture as a spritesheet rather than a static image.
 */
export interface ArenaAsset {
  /**
   * Phaser texture key.  This should be unique across all loaded assets.
   */
  key: string;
  /**
   * Relative path from the project root to the asset file.  All game assets
   * live under `public/assets`.
   */
  path: string;
  /** Optional display dimensions for static images */
  width?: number;
  height?: number;
  /**
   * Optional frame dimensions for spritesheets.  When present these values
   * cause the loader to call `load.spritesheet` instead of `load.image`.
   */
  frameWidth?: number;
  frameHeight?: number;
}

/*
 * High‑resolution backgrounds sourced from the new art pack.  The project
 * originally referenced vector SVG placeholders; these have been replaced
 * with detailed 1600×1100 PNGs.  The order of keys mirrors the original
 * definitions in `core/maps.ts` to avoid touching the core rule layer.
 */
export const mapAssets: ArenaAsset[] = [
  // Ion Rooftop → Cloud Spire Arboretum
  { key: "map-ion-rooftop", path: "/assets/neon-arena/maps/map05_cloud_spire_arboretum.png", width: 1600, height: 1100 },
  // Foundry Overpass → Transit Skybridge Hydroponics
  { key: "map-foundry-overpass", path: "/assets/neon-arena/maps/map02_transit_skybridge_hydroponics.png", width: 1600, height: 1100 },
  // Skyline Garden → Skyline Garden Ruins
  { key: "map-skyline-garden", path: "/assets/neon-arena/maps/map01_skyline_garden_ruins.png", width: 1600, height: 1100 },
  // Dockyard Sprawl → Reactor Orchid Courtyard
  { key: "map-dockyard-sprawl", path: "/assets/neon-arena/maps/map03_reactor_orchid_courtyard.png", width: 1600, height: 1100 },
  // Market Crossfire → Rainmarket Terrace Grove
  { key: "map-market-crossfire", path: "/assets/neon-arena/maps/map04_rainmarket_terrace_grove.png", width: 1600, height: 1100 }
];

/*
 * Wall segments extracted from the props directory.  Each PNG approximates
 * the size of its original SVG counterpart.  Should further variety be
 * required the `props/` directory contains additional obstacles that can be
 * referenced from `core/maps.ts` in a future pass.
 */
export const environmentAssets: ArenaAsset[] = [
  { key: "wall-ion", path: "/assets/neon-arena/props/cover_wall_ruin.png", width: 160, height: 80 },
  { key: "wall-foundry", path: "/assets/neon-arena/props/cover_wall_ruin.png", width: 160, height: 80 },
  { key: "wall-garden", path: "/assets/neon-arena/props/cover_wall_ruin.png", width: 160, height: 80 },
  { key: "wall-market", path: "/assets/neon-arena/props/cover_wall_ruin.png", width: 160, height: 80 }
];

/*
 * Player avatars from the art pack.  Each character is provided in both
 * portrait and sprite sheet form.  For the initial integration we load
 * the static portrait image as the in‑game representation.  Future
 * iterations should leverage the spritesheets and create animations for
 * idle, move, attack and hit states.
 */
export const characterAssets: ArenaAsset[] = [
  {
    key: "fighter-cyan", // cyan cat
    path: "/assets/neon-arena/characters/fighter_cyan_cat.png",
    width: 96,
    height: 96
  },
  {
    key: "fighter-magenta", // pink bunny
    path: "/assets/neon-arena/characters/fighter_pink_bunny.png",
    width: 96,
    height: 96
  },
  {
    key: "fighter-yellow", // green leaf (renamed for compatibility)
    path: "/assets/neon-arena/characters/fighter_green_leaf.png",
    width: 96,
    height: 96
  },
  {
    key: "fighter-violet", // orange fox as placeholder for violet
    path: "/assets/neon-arena/characters/fighter_orange_fox.png",
    width: 96,
    height: 96
  }
];

/*
 * Weapon icons mapped to high‑fidelity PNGs.  We approximate the original
 * names to the nearest match from the art pack.  Dimensions are kept
 * similar to the existing values to minimise layout changes.
 */
export const weaponAssets: ArenaAsset[] = [
  { key: "weapon-energy-blade", path: "/assets/neon-arena/weapons/neon_katana.png", width: 96, height: 96 },
  { key: "weapon-shock-hammer", path: "/assets/neon-arena/weapons/energy_shield_baton.png", width: 96, height: 96 },
  { key: "weapon-pulse-rifle", path: "/assets/neon-arena/weapons/pulse_bow.png", width: 110, height: 76 },
  { key: "weapon-laser-carbine", path: "/assets/neon-arena/weapons/ray_pistol.png", width: 110, height: 76 }
];

/*
 * Visual effects for projectiles and melee attacks.  These PNGs replace
 * simple vector shapes with more dynamic trails and slashes.  Additional
 * VFX such as hit sparks and shrinking rings are loaded separately in
 * PreloadScene via the manifest when needed.
 */
export const fxAssets: ArenaAsset[] = [
  { key: "fx-projectile", path: "/assets/neon-arena/vfx/projectile_trail_teal.png", width: 72, height: 32 },
  { key: "fx-melee-arc", path: "/assets/neon-arena/vfx/melee_slash_orange.png", width: 120, height: 120 }
];

export const arenaAssets = [...mapAssets, ...environmentAssets, ...characterAssets, ...weaponAssets, ...fxAssets];

export function fighterKeyForIndex(index: number): string {
  return characterAssets[index % characterAssets.length]!.key;
}

export function weaponTextureKey(weaponID: string): string {
  return `weapon-${weaponID}`;
}
