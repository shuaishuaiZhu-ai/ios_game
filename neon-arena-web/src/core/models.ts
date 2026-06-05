import type { ArenaRect, Vector2 } from "./geometry";

export type Difficulty = "easy" | "medium" | "hard";
export type Ruleset = "standard" | "meleeOnly";
export type WeaponType = "melee" | "ranged" | "utility";
export type WeaponID = "neon-katana" | "pulse-bow" | "ray-pistol" | "energy-shield-baton";
export type MeleeAction = "punch" | "flyingKick" | "throw";

export type GameMode =
  | { kind: "single"; difficulty: Difficulty; ruleset: Ruleset }
  | { kind: "onlineDuel"; ruleset: Ruleset }
  | { kind: "onlineFFA"; ruleset: Ruleset };

export interface WeaponDefinition {
  id: WeaponID;
  type: WeaponType;
  category: "light" | "heavy" | "precision" | "rapid" | "defense";
  damage: number;
  range: number;
  cooldown: number;
  projectileSpeed: number;
  knockback: number;
  spread: number;
  pickupWeight: number;
  blockAngle?: number;
  blockDuration?: number;
}

export interface MatchConfig {
  mode: GameMode;
  mapID: string;
  playerCount: number;
  seed: number;
  tickRate: number;
}

export interface PlayerInput {
  playerID: string;
  movement: Vector2;
  aim: Vector2;
  firePressed: boolean;
  dashPressed?: boolean;
  rollPressed?: boolean;
  shieldPressed?: boolean;
  meleeAction?: MeleeAction;
  tick: number;
}

export interface PlayerState {
  id: string;
  nickname: string;
  position: Vector2;
  health: number;
  facing: Vector2;
  weapon?: WeaponType;
  weaponID?: WeaponID;
  isEliminated: boolean;
  cooldownRemaining: number;
  dashCooldownRemaining: number;
  rollCooldownRemaining: number;
  invulnerabilityRemaining: number;
  shieldRemaining: number;
}

export interface ProjectileState {
  id: string;
  ownerID: string;
  weaponID: WeaponID;
  position: Vector2;
  previousPosition: Vector2;
  velocity: Vector2;
  damage: number;
  knockback: number;
  remainingRange: number;
  isActive: boolean;
}

export interface DroppedWeapon {
  id: string;
  type: WeaponType;
  weaponID: WeaponID;
  position: Vector2;
  isPickedUp: boolean;
}

export interface Elimination {
  playerID: string;
  tick: number;
}

export interface SafeZoneState {
  phase: number;
  center: Vector2;
  radius: number;
  nextShrinkTime: number;
  outsideDamagePerSecond: number;
}

export type CombatEvent =
  | { type: "projectile-fired"; tick: number; playerID: string; weaponID: WeaponID; from: Vector2; to: Vector2 }
  | { type: "projectile-hit"; tick: number; playerID: string; targetID?: string; weaponID: WeaponID; position: Vector2 }
  | { type: "melee-swing"; tick: number; playerID: string; weaponID?: WeaponID; action?: MeleeAction; position: Vector2; facing: Vector2 }
  | { type: "melee-hit"; tick: number; playerID: string; targetID: string; weaponID?: WeaponID; action?: MeleeAction; position: Vector2 }
  | { type: "shield-block"; tick: number; playerID: string; position: Vector2 }
  | { type: "dash"; tick: number; playerID: string; from: Vector2; to: Vector2 }
  | { type: "roll"; tick: number; playerID: string; from: Vector2; to: Vector2 }
  | { type: "pickup"; tick: number; playerID: string; weaponID: WeaponID; position: Vector2 }
  | { type: "safe-zone-phase"; tick: number; phase: number; radius: number };

export interface MatchSnapshot {
  tick: number;
  players: PlayerState[];
  projectiles: ProjectileState[];
  droppedWeapons: DroppedWeapon[];
  safeZone: SafeZoneState;
  eliminations: Elimination[];
  events: CombatEvent[];
  winnerID?: string;
}

export type ColliderKind = "solid" | "softCover" | "projectileOnly";

export interface ArenaWall {
  id: string;
  rect: ArenaRect;
  kind: ColliderKind;
}

export interface WeaponSpawnPoint {
  id: string;
  position: Vector2;
  allowedTypes: WeaponType[];
  weaponIDs?: WeaponID[];
}

export interface SafeZoneConfig {
  center: Vector2;
  phaseRadii: number[];
  phaseDuration: number;
  outsideDamagePerSecond: number;
}

export interface MapDefinition {
  id: string;
  name: string;
  size: Vector2;
  art: {
    backgroundKey: string;
    thumbnailKey: string;
    accent: string;
    mood: string;
  };
  walls: ArenaWall[];
  spawnPoints: Vector2[];
  weaponSpawnPoints: WeaponSpawnPoint[];
  safeZone: SafeZoneConfig;
}

export type NetworkMessage =
  | { type: "join"; playerID: string; nickname: string }
  | { type: "joined"; playerID: string; nickname: string; roomCode: string }
  | { type: "lobby"; roomCode: string; playerCount: number; targetPlayers: number; players: Array<{ id: string; nickname: string }> }
  | { type: "ready"; playerID: string }
  | { type: "start"; config: MatchConfig; playerIDs: string[]; nicknames: Record<string, string> }
  | { type: "input"; input: PlayerInput }
  | { type: "snapshot"; snapshot: MatchSnapshot; events: CombatEvent[] }
  | { type: "playerDisconnected"; playerID: string }
  | { type: "error"; message: string };

export const neonKatana: WeaponDefinition = {
  id: "neon-katana",
  type: "melee",
  category: "light",
  damage: 34,
  range: 58,
  cooldown: 0.42,
  projectileSpeed: 0,
  knockback: 52,
  spread: 0,
  pickupWeight: 3
};

export const pulseBow: WeaponDefinition = {
  id: "pulse-bow",
  type: "ranged",
  category: "precision",
  damage: 28,
  range: 620,
  cooldown: 0.68,
  projectileSpeed: 640,
  knockback: 34,
  spread: 0.012,
  pickupWeight: 2
};

export const rayPistol: WeaponDefinition = {
  id: "ray-pistol",
  type: "ranged",
  category: "rapid",
  damage: 14,
  range: 430,
  cooldown: 0.26,
  projectileSpeed: 760,
  knockback: 18,
  spread: 0.05,
  pickupWeight: 3
};

export const energyShieldBaton: WeaponDefinition = {
  id: "energy-shield-baton",
  type: "utility",
  category: "defense",
  damage: 22,
  range: 46,
  cooldown: 0.54,
  projectileSpeed: 0,
  knockback: 62,
  spread: 0,
  pickupWeight: 2,
  blockAngle: 0.22,
  blockDuration: 0.45
};

export const weaponDefinitions = [neonKatana, pulseBow, rayPistol, energyShieldBaton] as const;

export function weaponByID(id: WeaponID): WeaponDefinition {
  return weaponDefinitions.find((weapon) => weapon.id === id) ?? neonKatana;
}

export function defaultWeaponForType(type: WeaponType): WeaponID {
  if (type === "melee") return "neon-katana";
  if (type === "utility") return "energy-shield-baton";
  return "ray-pistol";
}

export function rulesetForMode(mode: GameMode): Ruleset {
  return mode.ruleset;
}

export function matchConfig(mode: GameMode, mapID: string, playerCount: number, seed = 1, tickRate = 30): MatchConfig {
  return { mode, mapID, playerCount, seed, tickRate };
}
