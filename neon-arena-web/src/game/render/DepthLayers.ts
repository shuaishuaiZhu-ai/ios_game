export const DepthLayers = {
  map: 0,
  /** Decorative props such as bridges and scenery; rendered above the background */
  decor: 1,
  storm: 2,
  safeZone: 4,
  pickup: 7,
  projectile: 9,
  vfx: 11,
  player: 12,
  playerUi: 14,
  hud: 20
} as const;
