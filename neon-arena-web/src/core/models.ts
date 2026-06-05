import type { ArenaRect, Vector2 } from "./geometry";

export type Difficulty = "easy" | "medium" | "hard";
export type Ruleset = "standard" | "meleeOnly";
export type WeaponType = "melee" | "ranged";
export type WeaponID = "energy-blade" | "shock-hammer" | "pulse-rifle" | "laser-carbine";
export type MeleeAction = "punch" | "flyingKick" | "throw";
export type GameMode =
  | { kind: "single"; difficulty: Difficulty; ruleset: Ruleset }
  | { kind: "onlineDuel"; ruleset: Ruleset }
  | { kind: "onlineFFA"; ruleset: Ruleset };

export interface WeaponDefinition {
  id: WeaponID;
  type: WeaponType;
  category: "light" | "heavy" | "precision" | "rapid";
  name: string;
  damage: number;
  range: number;
  cooldown: number;
  projectileSpeed: number;
  knockback: number;
  spread: number;
  pickupWeight: number;
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
}

export interface ProjectileState {
  id: string;
  ownerID: string;
  position: Vector2;
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

export interface MatchSnapshot {
  tick: number;
  players: PlayerState[];
  projectiles: ProjectileState[];
  droppedWeapons: DroppedWeapon[];
  safeZone: SafeZoneState;
  eliminations: Elimination[];
  winnerID?: string;
}

export interface ArenaWall {
  id: string;
  rect: ArenaRect;
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
    wallKey: string;
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
  | { type: "snapshot"; snapshot: MatchSnapshot }
  | { type: "playerDisconnected"; playerID: string }
  | { type: "error"; message: string };

export const energyBlade: WeaponDefinition = {
  id: "energy-blade",
  type: "melee",
  category: "light",
  name: "Energy Blade",
  damage: 34,
  range: 48,
  cooldown: 0.45,
  projectileSpeed: 0,
  knockback: 44,
  spread: 0,
  pickupWeight: 3
};

export const shockHammer: WeaponDefinition = {
  id: "shock-hammer",
  type: "melee",
  category: "heavy",
  name: "Shock Hammer",
  damage: 44,
  range: 42,
  cooldown: 0.72,
  projectileSpeed: 0,
  knockback: 78,
  spread: 0,
  pickupWeight: 2
};

export const pulseRifle: WeaponDefinition = {
  id: "pulse-rifle",
  type: "ranged",
  category: "rapid",
  name: "Pulse Rifle",
  damage: 16,
  range: 420,
  cooldown: 0.32,
  projectileSpeed: 560,
  knockback: 22,
  spread: 0.04,
  pickupWeight: 3
};

export const laserCarbine: WeaponDefinition = {
  id: "laser-carbine",
  type: "ranged",
  category: "precision",
  name: "Laser Carbine",
  damage: 22,
  range: 540,
  cooldown: 0.5,
  projectileSpeed: 680,
  knockback: 30,
  spread: 0.015,
  pickupWeight: 2
};

export const weaponDefinitions = [energyBlade, shockHammer, pulseRifle, laserCarbine] as const;

export function weaponByID(id: WeaponID): WeaponDefinition {
  return weaponDefinitions.find((weapon) => weapon.id === id) ?? energyBlade;
}

export function defaultWeaponForType(type: WeaponType): WeaponID {
  return type === "melee" ? "energy-blade" : "pulse-rifle";
}

export function rulesetForMode(mode: GameMode): Ruleset {
  return mode.ruleset;
}

export function matchConfig(mode: GameMode, mapID: string, playerCount: number, seed = 1, tickRate = 30): MatchConfig {
  return { mode, mapID, playerCount, seed, tickRate };
}
