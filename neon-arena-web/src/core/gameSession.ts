import { add, containsPoint, distance, dot, expanded, intersectsSegment, length, maxX, maxY, minX, minY, normalize, scale, sub, vec, type Vector2 } from "./geometry";
import { mapByID, safeZoneState } from "./maps";
import { energyBlade, pulseRifle, rulesetForMode, type DroppedWeapon, type Elimination, type MapDefinition, type MatchConfig, type MatchSnapshot, type MeleeAction, type PlayerInput, type PlayerState, type ProjectileState, type SafeZoneState } from "./models";

export const playerRadius = 18;
export const pickupRadius = 32;
export const hitRadius = 22;

export class GameSession {
  readonly config: MatchConfig;
  readonly map: MapDefinition;
  tick = 0;
  elapsedTime = 0;
  players = new Map<string, PlayerState>();
  projectiles: ProjectileState[] = [];
  droppedWeapons: DroppedWeapon[] = [];
  eliminations: Elimination[] = [];
  winnerID: string | undefined;
  private authoritativeSafeZone: SafeZoneState | undefined;

  constructor(config: MatchConfig, playerIDs: string[], nicknames: Record<string, string> = {}, map = mapByID(config.mapID)) {
    this.config = config;
    this.map = map;

    playerIDs.slice(0, config.playerCount).forEach((playerID, index) => {
      const spawn = map.spawnPoints[index % map.spawnPoints.length]!;
      this.players.set(playerID, {
        id: playerID,
        nickname: nicknames[playerID] ?? playerID,
        position: { ...spawn },
        health: 100,
        facing: vec(1, 0),
        isEliminated: false,
        cooldownRemaining: 0
      });
    });

    if (rulesetForMode(config.mode) === "standard") {
      this.droppedWeapons = map.weaponSpawnPoints.map((spawn, index) => ({
        id: spawn.id,
        type: spawn.allowedTypes[index % spawn.allowedTypes.length]!,
        position: { ...spawn.position },
        isPickedUp: false
      }));
    }
  }

  get safeZone(): SafeZoneState {
    return this.authoritativeSafeZone ?? safeZoneState(this.map.safeZone, this.elapsedTime);
  }

  snapshot(): MatchSnapshot {
    const snapshot: MatchSnapshot = {
      tick: this.tick,
      players: [...this.players.values()].sort((a, b) => a.id.localeCompare(b.id)),
      projectiles: [...this.projectiles].sort((a, b) => a.id.localeCompare(b.id)),
      droppedWeapons: [...this.droppedWeapons].sort((a, b) => a.id.localeCompare(b.id)),
      safeZone: this.safeZone,
      eliminations: this.eliminations
    };
    if (this.winnerID) {
      snapshot.winnerID = this.winnerID;
    }
    return clone(snapshot);
  }

  applyAuthoritativeSnapshot(snapshot: MatchSnapshot): void {
    this.tick = snapshot.tick;
    this.players = new Map(snapshot.players.map((player) => [player.id, clone(player)]));
    this.projectiles = clone(snapshot.projectiles);
    this.droppedWeapons = clone(snapshot.droppedWeapons);
    this.eliminations = clone(snapshot.eliminations);
    this.winnerID = snapshot.winnerID;
    this.authoritativeSafeZone = clone(snapshot.safeZone);
  }

  step(inputs: PlayerInput[], deltaSeconds: number): void {
    if (this.winnerID) {
      return;
    }

    this.authoritativeSafeZone = undefined;
    this.tick += 1;
    this.elapsedTime += deltaSeconds;

    for (const player of this.players.values()) {
      player.cooldownRemaining = Math.max(0, player.cooldownRemaining - deltaSeconds);
    }

    const latestInputs = new Map<string, PlayerInput>();
    for (const input of inputs) {
      latestInputs.set(input.playerID, input);
    }

    for (const input of [...latestInputs.values()].sort((a, b) => a.playerID.localeCompare(b.playerID))) {
      const player = this.players.get(input.playerID);
      if (!player || player.isEliminated) continue;

      const aim = normalize(input.aim);
      if (length(aim) > 0) {
        player.facing = aim;
      }

      const movement = normalize(input.movement);
      const candidate = add(player.position, scale(movement, 170 * deltaSeconds));
      player.position = this.constrainedPosition(candidate);
    }

    this.applyPickups();

    for (const input of [...latestInputs.values()].sort((a, b) => a.playerID.localeCompare(b.playerID))) {
      const player = this.players.get(input.playerID);
      if (!player || player.isEliminated) continue;
      if (input.firePressed || input.meleeAction) {
        this.performAction(player, input);
      }
    }

    this.updateProjectiles(deltaSeconds);
    this.applySafeZoneDamage(deltaSeconds);
    this.updateWinner();
  }

  forcePlayerPosition(id: string, position: Vector2): void {
    const player = this.players.get(id);
    if (player) {
      player.position = { ...position };
    }
  }

  addPlayer(id: string, nickname: string): boolean {
    if (this.players.has(id) || this.players.size >= this.config.playerCount) {
      return false;
    }

    const spawn = this.map.spawnPoints[this.players.size % this.map.spawnPoints.length]!;
    this.players.set(id, {
      id,
      nickname,
      position: { ...spawn },
      health: 100,
      facing: vec(1, 0),
      isEliminated: false,
      cooldownRemaining: 0
    });
    return true;
  }

  eliminatePlayer(id: string): void {
    const player = this.players.get(id);
    if (!player || player.isEliminated) {
      return;
    }
    player.health = 0;
    player.isEliminated = true;
    this.eliminations.push({ playerID: id, tick: this.tick });
    this.updateWinner();
  }

  private constrainedPosition(candidate: Vector2): Vector2 {
    const clamped = vec(
      Math.min(Math.max(candidate.x, playerRadius), this.map.size.x - playerRadius),
      Math.min(Math.max(candidate.y, playerRadius), this.map.size.y - playerRadius)
    );

    for (const wall of this.map.walls) {
      const area = expanded(wall.rect, playerRadius);
      if (containsPoint(area, clamped)) {
        return this.nearestFreePoint(clamped, area);
      }
    }

    return clamped;
  }

  private nearestFreePoint(point: Vector2, area: { origin: Vector2; size: Vector2 }): Vector2 {
    const candidates = [
      vec(minX(area) - 0.1, point.y),
      vec(maxX(area) + 0.1, point.y),
      vec(point.x, minY(area) - 0.1),
      vec(point.x, maxY(area) + 0.1)
    ].map((candidate) =>
      vec(
        Math.min(Math.max(candidate.x, playerRadius), this.map.size.x - playerRadius),
        Math.min(Math.max(candidate.y, playerRadius), this.map.size.y - playerRadius)
      )
    );

    return candidates.sort((a, b) => distance(a, point) - distance(b, point))[0] ?? point;
  }

  private applyPickups(): void {
    if (rulesetForMode(this.config.mode) !== "standard") {
      this.droppedWeapons = [];
      for (const player of this.players.values()) {
        delete player.weapon;
      }
      return;
    }

    for (const weapon of this.droppedWeapons) {
      if (weapon.isPickedUp) continue;
      const picker = [...this.players.values()].find((player) => !player.isEliminated && distance(player.position, weapon.position) <= pickupRadius);
      if (!picker) continue;
      weapon.isPickedUp = true;
      picker.weapon = weapon.type;
    }
  }

  private performAction(player: PlayerState, input: PlayerInput): void {
    if (player.cooldownRemaining > 0) {
      return;
    }

    if (rulesetForMode(this.config.mode) === "meleeOnly") {
      this.applyMeleeAction(input.meleeAction ?? "punch", player);
      return;
    }

    if (player.weapon === "melee") {
      this.damageFirstTarget(player, energyBlade.range, energyBlade.damage);
      player.cooldownRemaining = energyBlade.cooldown;
    } else if (player.weapon === "ranged") {
      this.spawnProjectile(player);
    } else if (input.meleeAction) {
      this.applyMeleeAction(input.meleeAction, player);
    }
  }

  private applyMeleeAction(action: MeleeAction, player: PlayerState): void {
    const stats = meleeStats(action);
    this.damageFirstTarget(player, stats.range, stats.damage);
    player.cooldownRemaining = stats.cooldown;
  }

  private damageFirstTarget(player: PlayerState, range: number, damage: number): void {
    const facing = normalize(player.facing);
    if (length(facing) <= 0) return;

    const target = [...this.players.values()]
      .filter((candidate) => candidate.id !== player.id && !candidate.isEliminated)
      .filter((candidate) => {
        const offset = sub(candidate.position, player.position);
        if (length(offset) > range + hitRadius) return false;
        return dot(normalize(offset), facing) > 0.45;
      })
      .sort((a, b) => distance(a.position, player.position) - distance(b.position, player.position))[0];

    if (target) {
      this.damagePlayer(target.id, damage);
    }
  }

  private spawnProjectile(player: PlayerState): void {
    const direction = normalize(player.facing);
    if (length(direction) <= 0) return;

    this.projectiles.push({
      id: `p-${this.tick}-${this.projectiles.length}`,
      ownerID: player.id,
      position: add(player.position, scale(direction, 28)),
      velocity: scale(direction, pulseRifle.projectileSpeed),
      damage: pulseRifle.damage,
      remainingRange: pulseRifle.range,
      isActive: true
    });
    player.cooldownRemaining = pulseRifle.cooldown;
  }

  private updateProjectiles(deltaSeconds: number): void {
    for (const projectile of this.projectiles) {
      if (!projectile.isActive) continue;
      const start = projectile.position;
      const travel = scale(projectile.velocity, deltaSeconds);
      const end = add(start, travel);

      if (this.map.walls.some((wall) => intersectsSegment(wall.rect, start, end))) {
        projectile.position = end;
        projectile.isActive = false;
        continue;
      }

      projectile.position = end;
      projectile.remainingRange -= length(travel);

      const hit = [...this.players.values()].find(
        (player) => player.id !== projectile.ownerID && !player.isEliminated && distance(player.position, end) <= hitRadius
      );
      if (hit) {
        this.damagePlayer(hit.id, projectile.damage);
        projectile.isActive = false;
      }

      if (projectile.remainingRange <= 0) {
        projectile.isActive = false;
      }
    }

    this.projectiles = this.projectiles.filter((projectile) => projectile.isActive);
  }

  private applySafeZoneDamage(deltaSeconds: number): void {
    const zone = this.safeZone;
    for (const player of this.players.values()) {
      if (!player.isEliminated && distance(player.position, zone.center) > zone.radius) {
        this.damagePlayer(player.id, zone.outsideDamagePerSecond * deltaSeconds);
      }
    }
  }

  private damagePlayer(id: string, amount: number): void {
    const player = this.players.get(id);
    if (!player || player.isEliminated) return;
    player.health = Math.max(0, player.health - amount);
    if (player.health <= 0) {
      player.isEliminated = true;
      this.eliminations.push({ playerID: id, tick: this.tick });
    }
  }

  private updateWinner(): void {
    const alive = [...this.players.values()].filter((player) => !player.isEliminated);
    if (alive.length === 1) {
      this.winnerID = alive[0]!.id;
    } else if (alive.length === 0) {
      this.winnerID = "draw";
    }
  }
}

export function meleeStats(action: MeleeAction): { damage: number; range: number; cooldown: number } {
  if (action === "punch") return { damage: 12, range: 38, cooldown: 0.28 };
  if (action === "flyingKick") return { damage: 22, range: 68, cooldown: 0.62 };
  return { damage: 26, range: 44, cooldown: 0.82 };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
