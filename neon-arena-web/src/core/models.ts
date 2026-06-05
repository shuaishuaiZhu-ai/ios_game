import type { ArenaRect, Vector2 } from "./geometry";

export type Difficulty = "easy" | "medium" | "hard";
export type Ruleset = "standard" | "meleeOnly";
export type WeaponType = "melee" | "ranged";
export type MeleeAction = "punch" | "flyingKick" | "throw";
export type GameMode =
  | { kind: "single"; difficulty: Difficulty; ruleset: Ruleset }
  | { kind: "onlineDuel"; ruleset: Ruleset }
  | { kind: "onlineFFA"; ruleset: Ruleset };

export interface WeaponDefinition {
  type: WeaponType;
  name: string;
  damage: number;
  range: number;
  cooldown: number;
  projectileSpeed: number;
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
  isEliminated: boolean;
  cooldownRemaining: number;
}

export interface ProjectileState {
  id: string;
  ownerID: string;
  position: Vector2;
  velocity: Vector2;
  damage: number;
  remainingRange: number;
  isActive: boolean;
}

export interface DroppedWeapon {
  id: string;
  type: WeaponType;
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
  type: "melee",
  name: "Energy Blade",
  damage: 34,
  range: 48,
  cooldown: 0.45,
  projectileSpeed: 0
};

export const pulseRifle: WeaponDefinition = {
  type: "ranged",
  name: "Pulse Rifle",
  damage: 16,
  range: 420,
  cooldown: 0.32,
  projectileSpeed: 520
};

export function rulesetForMode(mode: GameMode): Ruleset {
  return mode.ruleset;
}

export function matchConfig(mode: GameMode, mapID: string, playerCount: number, seed = 1, tickRate = 30): MatchConfig {
  return { mode, mapID, playerCount, seed, tickRate };
}
