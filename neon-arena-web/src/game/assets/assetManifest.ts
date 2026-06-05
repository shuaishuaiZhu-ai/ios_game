import type { WeaponID } from "../../core/models";
import { arenaMaps } from "../../core/maps";

export type ArenaAssetKind = "image" | "spritesheet" | "json";

export interface ArenaAsset {
  key: string;
  path: string;
  kind: ArenaAssetKind;
  frameWidth?: number;
  frameHeight?: number;
}

export const mapAssets: ArenaAsset[] = arenaMaps.flatMap((map) => [
  { key: map.art.backgroundKey, path: `/assets/neon-arena/maps/${map.id}.png`, kind: "image" as const },
  { key: map.art.thumbnailKey, path: `/assets/neon-arena/thumbnails/${map.id}_thumb.png`, kind: "image" as const },
  { key: `${map.id}-config`, path: `/assets/neon-arena/maps/${map.id}.json`, kind: "json" as const }
]);

export const characterAssets: ArenaAsset[] = [
  { key: "fighter-cyan-cat", path: "/assets/neon-arena/characters/fighter_cyan_cat.png", kind: "image" },
  { key: "fighter-pink-bunny", path: "/assets/neon-arena/characters/fighter_pink_bunny.png", kind: "image" },
  { key: "fighter-green-leaf", path: "/assets/neon-arena/characters/fighter_green_leaf.png", kind: "image" },
  { key: "fighter-orange-fox", path: "/assets/neon-arena/characters/fighter_orange_fox.png", kind: "image" }
];

export const characterSheetAssets: ArenaAsset[] = [
  { key: "fighter-cyan-cat-sheet", path: "/assets/neon-arena/characters/sheets/fighter_cyan_cat_sheet_4x1.png", kind: "spritesheet", frameWidth: 256, frameHeight: 256 },
  { key: "fighter-pink-bunny-sheet", path: "/assets/neon-arena/characters/sheets/fighter_pink_bunny_sheet_4x1.png", kind: "spritesheet", frameWidth: 256, frameHeight: 256 },
  { key: "fighter-green-leaf-sheet", path: "/assets/neon-arena/characters/sheets/fighter_green_leaf_sheet_4x1.png", kind: "spritesheet", frameWidth: 256, frameHeight: 256 },
  { key: "fighter-orange-fox-sheet", path: "/assets/neon-arena/characters/sheets/fighter_orange_fox_sheet_4x1.png", kind: "spritesheet", frameWidth: 256, frameHeight: 256 }
];

export const propAssets: ArenaAsset[] = [
  { key: "prop-broken-glasshouse", path: "/assets/neon-arena/props/broken_glasshouse_frame.png", kind: "image" },
  { key: "prop-cover-hedge", path: "/assets/neon-arena/props/cover_hedge_neon.png", kind: "image" },
  { key: "prop-cover-wall", path: "/assets/neon-arena/props/cover_wall_ruin.png", kind: "image" },
  { key: "prop-neon-plants", path: "/assets/neon-arena/props/neon_plants_cluster.png", kind: "image" },
  { key: "prop-reflective-pool", path: "/assets/neon-arena/props/reflective_pool.png", kind: "image" },
  { key: "prop-sky-bridge", path: "/assets/neon-arena/props/sky_bridge_segment.png", kind: "image" }
];

export const weaponAssets: ArenaAsset[] = [
  { key: "weapon-neon-katana", path: "/assets/neon-arena/weapons/neon_katana_pickup.png", kind: "image" },
  { key: "weapon-pulse-bow", path: "/assets/neon-arena/weapons/pulse_bow_pickup.png", kind: "image" },
  { key: "weapon-ray-pistol", path: "/assets/neon-arena/weapons/ray_pistol_pickup.png", kind: "image" },
  { key: "weapon-energy-shield-baton", path: "/assets/neon-arena/weapons/energy_shield_baton_pickup.png", kind: "image" },
  { key: "held-neon-katana", path: "/assets/neon-arena/weapons/neon_katana.png", kind: "image" },
  { key: "held-pulse-bow", path: "/assets/neon-arena/weapons/pulse_bow.png", kind: "image" },
  { key: "held-ray-pistol", path: "/assets/neon-arena/weapons/ray_pistol.png", kind: "image" },
  { key: "held-energy-shield-baton", path: "/assets/neon-arena/weapons/energy_shield_baton.png", kind: "image" }
];

export const vfxAssets: ArenaAsset[] = [
  { key: "fx-projectile-ray-pistol", path: "/assets/neon-arena/vfx/projectile_trail_teal.png", kind: "image" },
  { key: "fx-projectile-pulse-bow", path: "/assets/neon-arena/vfx/projectile_trail_green.png", kind: "image" },
  { key: "fx-melee-pink", path: "/assets/neon-arena/vfx/melee_slash_pink.png", kind: "image" },
  { key: "fx-melee-teal", path: "/assets/neon-arena/vfx/melee_slash_teal.png", kind: "image" },
  { key: "fx-melee-orange", path: "/assets/neon-arena/vfx/melee_slash_orange.png", kind: "image" },
  { key: "fx-hit-spark", path: "/assets/neon-arena/vfx/hit_spark.png", kind: "image" },
  { key: "fx-safe-zone", path: "/assets/neon-arena/vfx/safe_zone_ring_1600x1100.png", kind: "image" },
  { key: "fx-storm-tile", path: "/assets/neon-arena/vfx/storm_particles_tile_512.png", kind: "image" }
];

export const hudAssets: ArenaAsset[] = [
  { key: "hud-joystick", path: "/assets/neon-arena/hud/joystick_left.png", kind: "image" },
  { key: "hud-button-attack", path: "/assets/neon-arena/hud/action_button_attack.png", kind: "image" },
  { key: "hud-button-shoot", path: "/assets/neon-arena/hud/action_button_shoot.png", kind: "image" },
  { key: "hud-button-dash", path: "/assets/neon-arena/hud/action_button_dash.png", kind: "image" },
  { key: "hud-button-melee", path: "/assets/neon-arena/hud/action_button_melee.png", kind: "image" },
  { key: "hud-button-shield", path: "/assets/neon-arena/hud/action_button_shield.png", kind: "image" },
  { key: "hud-bars", path: "/assets/neon-arena/hud/health_ammo_bars.png", kind: "image" }
];

// Additional standalone UI assets used by menus and overlays.  These assets are not directly
// part of gameplay but provide illustrations or backgrounds for non‑interactive screens.
export const uiAssets: ArenaAsset[] = [
  { key: "menu-background", path: "/assets/neon-arena/visual_direction/menu_background.png", kind: "image" }
];

export const arenaAssets: ArenaAsset[] = [
  ...mapAssets,
  ...characterAssets,
  ...characterSheetAssets,
  ...propAssets,
  ...weaponAssets,
  ...vfxAssets,
  ...hudAssets,
  ...uiAssets
];

export function fighterKeyForIndex(index: number): string {
  return characterAssets[index % characterAssets.length]!.key;
}

export function fighterSheetKeyForIndex(index: number): string {
  return characterSheetAssets[index % characterSheetAssets.length]!.key;
}

export function weaponTextureKey(weaponID: WeaponID): string {
  return `weapon-${weaponID}`;
}

export function heldWeaponTextureKey(weaponID: WeaponID): string {
  return `held-${weaponID}`;
}

export function projectileTextureKey(weaponID: WeaponID): string {
  return weaponID === "pulse-bow" ? "fx-projectile-pulse-bow" : "fx-projectile-ray-pistol";
}
