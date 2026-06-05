export interface ArenaAsset {
  key: string;
  path: string;
  width?: number;
  height?: number;
}

export const mapAssets: ArenaAsset[] = [
  { key: "map-ion-rooftop", path: "/assets/maps/ion-rooftop.svg", width: 1600, height: 1100 },
  { key: "map-foundry-overpass", path: "/assets/maps/foundry-overpass.svg", width: 1600, height: 1100 },
  { key: "map-skyline-garden", path: "/assets/maps/skyline-garden.svg", width: 1600, height: 1100 },
  { key: "map-dockyard-sprawl", path: "/assets/maps/dockyard-sprawl.svg", width: 1700, height: 1120 },
  { key: "map-market-crossfire", path: "/assets/maps/market-crossfire.svg", width: 1600, height: 1100 }
];

export const environmentAssets: ArenaAsset[] = [
  { key: "wall-ion", path: "/assets/environment/wall-ion.svg", width: 160, height: 80 },
  { key: "wall-foundry", path: "/assets/environment/wall-foundry.svg", width: 160, height: 80 },
  { key: "wall-garden", path: "/assets/environment/wall-garden.svg", width: 160, height: 80 },
  { key: "wall-market", path: "/assets/environment/wall-market.svg", width: 160, height: 80 }
];

export const characterAssets: ArenaAsset[] = [
  { key: "fighter-cyan", path: "/assets/characters/fighter-cyan.svg", width: 96, height: 96 },
  { key: "fighter-magenta", path: "/assets/characters/fighter-magenta.svg", width: 96, height: 96 },
  { key: "fighter-yellow", path: "/assets/characters/fighter-yellow.svg", width: 96, height: 96 },
  { key: "fighter-violet", path: "/assets/characters/fighter-violet.svg", width: 96, height: 96 }
];

export const weaponAssets: ArenaAsset[] = [
  { key: "weapon-energy-blade", path: "/assets/weapons/energy-blade.svg", width: 96, height: 96 },
  { key: "weapon-shock-hammer", path: "/assets/weapons/shock-hammer.svg", width: 96, height: 96 },
  { key: "weapon-pulse-rifle", path: "/assets/weapons/pulse-rifle.svg", width: 110, height: 76 },
  { key: "weapon-laser-carbine", path: "/assets/weapons/laser-carbine.svg", width: 110, height: 76 }
];

export const fxAssets: ArenaAsset[] = [
  { key: "fx-projectile", path: "/assets/fx/projectile.svg", width: 72, height: 32 },
  { key: "fx-melee-arc", path: "/assets/fx/melee-arc.svg", width: 120, height: 120 }
];

export const arenaAssets = [...mapAssets, ...environmentAssets, ...characterAssets, ...weaponAssets, ...fxAssets];

export function fighterKeyForIndex(index: number): string {
  return characterAssets[index % characterAssets.length]!.key;
}

export function weaponTextureKey(weaponID: string): string {
  return `weapon-${weaponID}`;
}
