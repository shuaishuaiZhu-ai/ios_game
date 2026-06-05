import {
  add,
  clampPoint,
  clone,
  containsPoint,
  distance,
  dot,
  expanded,
  intersectsSegment,
  length,
  maxX,
  maxY,
  minX,
  minY,
  normalize,
  scale,
  sub,
  vec,
  zeroVector,
  type ArenaRect,
  type Vector2
} from "./geometry";
import { mapByID, safeZoneState } from "./maps";
import {
  canUseDisplacement,
  canUseWeapons,
  defaultWeaponForType,
  energyShieldBaton,
  neonKatana,
  pulseBow,
  rayPistol,
  rulesetForMode,
  weaponByID,
  type CombatEvent,
  type DroppedWeapon,
  type Elimination,
  type MapDefinition,
  type MatchConfig,
  type MatchSnapshot,
  type MeleeAction,
  type PlayerInput,
  type PlayerState,
  type ProjectileState,
  type SafeZoneState,
  type WeaponDefinition,
  type WeaponID
} from "./models";

export const playerRadius = 18;
export const pickupRadius = 34;
export const hitRadius = 22;
export const moveSpeed = 214;
export const dashDistance = 152;
export const rollDistance = 98;

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
  private eventsThisTick: CombatEvent[] = [];
  private previousSafeZonePhase = 0;

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
        cooldownRemaining: 0,
        dashCooldownRemaining: 0,
        rollCooldownRemaining: 0,
        invulnerabilityRemaining: 0,
        shieldRemaining: 0
      });
    });

    if (canUseWeapons(rulesetForMode(config.mode))) {
      this.droppedWeapons = map.weaponSpawnPoints.map((spawn, index) => {
        const type = spawn.allowedTypes[index % spawn.allowedTypes.length]!;
        return {
          id: spawn.id,
          type,
          weaponID: spawn.weaponIDs?.[index % spawn.weaponIDs.length] ?? defaultWeaponForType(type),
          position: { ...spawn.position },
          isPickedUp: false
        };
      });
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
      eliminations: [...this.eliminations],
      events: [...this.eventsThisTick]
    };
    if (this.winnerID) snapshot.winnerID = this.winnerID;
    return clone(snapshot);
  }

  consumeEvents(): CombatEvent[] {
    const events = [...this.eventsThisTick];
    this.eventsThisTick = [];
    return clone(events);
  }

  applyAuthoritativeSnapshot(snapshot: MatchSnapshot): void {
    this.tick = snapshot.tick;
    this.players = new Map(snapshot.players.map((player) => [player.id, clone(player)]));
    this.projectiles = clone(snapshot.projectiles);
    this.droppedWeapons = clone(snapshot.droppedWeapons);
    this.eliminations = clone(snapshot.eliminations);
    this.winnerID = snapshot.winnerID;
    this.authoritativeSafeZone = clone(snapshot.safeZone);
    this.eventsThisTick = clone(snapshot.events ?? []);
    this.previousSafeZonePhase = snapshot.safeZone.phase;
  }

  step(inputs: PlayerInput[], deltaSeconds: number): void {
    if (this.winnerID) return;
    this.eventsThisTick = [];
    this.authoritativeSafeZone = undefined;
    this.tick += 1;
    const simulationDelta = Math.min(Math.max(deltaSeconds, 0), 0.2);
    this.elapsedTime += Math.max(deltaSeconds, 0);
    this.updateCooldowns(simulationDelta);
    const safeZone = this.safeZone;
    if (safeZone.phase !== this.previousSafeZonePhase) {
      this.previousSafeZonePhase = safeZone.phase;
      this.eventsThisTick.push({ type: "safe-zone-phase", tick: this.tick, phase: safeZone.phase, radius: safeZone.radius });
    }

    const latestInputs = new Map<string, PlayerInput>();
    for (const input of inputs) latestInputs.set(input.playerID, input);

    for (const input of [...latestInputs.values()].sort((a, b) => a.playerID.localeCompare(b.playerID))) {
      const player = this.players.get(input.playerID);
      if (!player || player.isEliminated) continue;
      this.applyFacingAndMovement(player, input, simulationDelta);
    }

    this.applyPickups();

    for (const input of [...latestInputs.values()].sort((a, b) => a.playerID.localeCompare(b.playerID))) {
      const player = this.players.get(input.playerID);
      if (!player || player.isEliminated) continue;
      if (input.shieldPressed || input.firePressed || input.meleeAction) this.performAction(player, input);
    }

    this.updateProjectiles(simulationDelta);
    this.applySafeZoneDamage(simulationDelta);
    this.updateWinner();
  }

  forcePlayerPosition(id: string, position: Vector2): void {
    const player = this.players.get(id);
    if (player) player.position = this.constrainedPosition(position);
  }

  addPlayer(id: string, nickname: string): boolean {
    if (this.players.has(id) || this.players.size >= this.config.playerCount) return false;
    const spawn = this.map.spawnPoints[this.players.size % this.map.spawnPoints.length]!;
    this.players.set(id, {
      id,
      nickname,
      position: { ...spawn },
      health: 100,
      facing: vec(1, 0),
      isEliminated: false,
      cooldownRemaining: 0,
      dashCooldownRemaining: 0,
      rollCooldownRemaining: 0,
      invulnerabilityRemaining: 0,
      shieldRemaining: 0
    });
    return true;
  }

  eliminatePlayer(id: string): void {
    const player = this.players.get(id);
    if (!player || player.isEliminated) return;
    player.health = 0;
    player.isEliminated = true;
    this.eliminations.push({ playerID: id, tick: this.tick });
    this.updateWinner();
  }

  hasLineOfSight(from: Vector2, to: Vector2): boolean {
    return !this.map.walls.some((wall) => this.blocksProjectiles(wall.kind) && intersectsSegment(wall.rect, from, to));
  }

  private updateCooldowns(deltaSeconds: number): void {
    for (const player of this.players.values()) {
      player.cooldownRemaining = Math.max(0, player.cooldownRemaining - deltaSeconds);
      player.dashCooldownRemaining = Math.max(0, player.dashCooldownRemaining - deltaSeconds);
      player.rollCooldownRemaining = Math.max(0, player.rollCooldownRemaining - deltaSeconds);
      player.invulnerabilityRemaining = Math.max(0, player.invulnerabilityRemaining - deltaSeconds);
      player.shieldRemaining = Math.max(0, player.shieldRemaining - deltaSeconds);
    }
  }

  private applyFacingAndMovement(player: PlayerState, input: PlayerInput, deltaSeconds: number): void {
    const aim = normalize(input.aim);
    if (length(aim) > 0) player.facing = aim;
    const movement = normalize(input.movement);
    const candidate = add(player.position, scale(movement, moveSpeed * deltaSeconds));
    player.position = this.constrainedPosition(candidate);
    if (!canUseDisplacement(rulesetForMode(this.config.mode))) return;
    const burstDirection = length(movement) > 0 ? movement : player.facing;
    if (input.dashPressed && player.dashCooldownRemaining <= 0 && length(burstDirection) > 0) {
      const from = { ...player.position };
      player.position = this.constrainedPosition(add(player.position, scale(normalize(burstDirection), dashDistance)));
      player.dashCooldownRemaining = 1.15;
      this.eventsThisTick.push({ type: "dash", tick: this.tick, playerID: player.id, from, to: { ...player.position } });
    } else if (input.rollPressed && player.rollCooldownRemaining <= 0 && length(burstDirection) > 0) {
      const from = { ...player.position };
      player.position = this.constrainedPosition(add(player.position, scale(normalize(burstDirection), rollDistance)));
      player.rollCooldownRemaining = 0.88;
      player.invulnerabilityRemaining = 0.26;
      this.eventsThisTick.push({ type: "roll", tick: this.tick, playerID: player.id, from, to: { ...player.position } });
    }
  }

  private constrainedPosition(candidate: Vector2): Vector2 {
    let clamped = clampPoint(candidate, vec(playerRadius, playerRadius), vec(this.map.size.x - playerRadius, this.map.size.y - playerRadius));
    for (const wall of this.map.walls) {
      if (!this.blocksMovement(wall.kind)) continue;
      const area = expanded(wall.rect, playerRadius);
      if (containsPoint(area, clamped)) clamped = this.nearestFreePoint(clamped, area);
    }
    return clamped;
  }

  private nearestFreePoint(point: Vector2, area: ArenaRect): Vector2 {
    const candidates = [
      vec(minX(area) - 0.1, point.y),
      vec(maxX(area) + 0.1, point.y),
      vec(point.x, minY(area) - 0.1),
      vec(point.x, maxY(area) + 0.1)
    ].map((candidate) => clampPoint(candidate, vec(playerRadius, playerRadius), vec(this.map.size.x - playerRadius, this.map.size.y - playerRadius)));
    return candidates.sort((a, b) => distance(a, point) - distance(b, point))[0] ?? point;
  }

  private applyPickups(): void {
    if (!canUseWeapons(rulesetForMode(this.config.mode))) {
      this.droppedWeapons = [];
      for (const player of this.players.values()) {
        delete player.weapon;
        delete player.weaponID;
      }
      return;
    }
    for (const weapon of this.droppedWeapons) {
      if (weapon.isPickedUp) continue;
      const picker = [...this.players.values()].find((player) => !player.isEliminated && distance(player.position, weapon.position) <= pickupRadius);
      if (!picker) continue;
      weapon.isPickedUp = true;
      picker.weapon = weapon.type;
      picker.weaponID = weapon.weaponID;
      this.eventsThisTick.push({ type: "pickup", tick: this.tick, playerID: picker.id, weaponID: weapon.weaponID, position: { ...weapon.position } });
    }
  }

  private performAction(player: PlayerState, input: PlayerInput): void {
    if (player.cooldownRemaining > 0 && !input.shieldPressed) return;
    if (rulesetForMode(this.config.mode) === "meleeOnly") {
      if (input.meleeAction) this.applyMeleeAction(input.meleeAction, player);
      return;
    }
    if (input.shieldPressed && player.weaponID === "energy-shield-baton") {
      player.shieldRemaining = energyShieldBaton.blockDuration ?? 0.45;
      this.eventsThisTick.push({ type: "shield-block", tick: this.tick, playerID: player.id, position: { ...player.position } });
      return;
    }
    if (player.weapon === "melee") {
      const weapon = weaponByID(player.weaponID ?? "neon-katana");
      this.damageFirstTarget(player, weapon.range, weapon.damage, weapon.knockback, weapon.id);
      player.cooldownRemaining = weapon.cooldown;
      this.eventsThisTick.push({ type: "melee-swing", tick: this.tick, playerID: player.id, weaponID: weapon.id, position: { ...player.position }, facing: { ...player.facing } });
    } else if (player.weapon === "utility") {
      const weapon = weaponByID(player.weaponID ?? "energy-shield-baton");
      if (input.firePressed || input.meleeAction) {
        this.damageFirstTarget(player, weapon.range, weapon.damage, weapon.knockback, weapon.id);
        player.cooldownRemaining = weapon.cooldown;
        this.eventsThisTick.push({ type: "melee-swing", tick: this.tick, playerID: player.id, weaponID: weapon.id, position: { ...player.position }, facing: { ...player.facing } });
      }
    } else if (player.weapon === "ranged") {
      this.spawnProjectile(player);
    } else if (input.meleeAction) {
      this.applyMeleeAction(input.meleeAction, player);
    }
  }

  private applyMeleeAction(action: MeleeAction, player: PlayerState): void {
    const stats = meleeStats(action);
    this.damageFirstTarget(player, stats.range, stats.damage, stats.knockback, undefined, action);
    player.cooldownRemaining = stats.cooldown;
    this.eventsThisTick.push({ type: "melee-swing", tick: this.tick, playerID: player.id, action, position: { ...player.position }, facing: { ...player.facing } });
  }

  private damageFirstTarget(player: PlayerState, range: number, damage: number, knockback: number, weaponID?: WeaponID, action?: MeleeAction): void {
    const facing = normalize(player.facing);
    if (length(facing) <= 0) return;
    const target = [...this.players.values()]
      .filter((candidate) => candidate.id !== player.id && !candidate.isEliminated)
      .filter((candidate) => {
        const offset = sub(candidate.position, player.position);
        if (length(offset) > range + hitRadius) return false;
        if (dot(normalize(offset), facing) <= 0.45) return false;
        return this.hasLineOfSight(player.position, candidate.position);
      })
      .sort((a, b) => distance(a.position, player.position) - distance(b.position, player.position))[0];
    if (!target) return;
    this.damagePlayer(target.id, damage, scale(facing, knockback), player.id);
    this.eventsThisTick.push({ type: "melee-hit", tick: this.tick, playerID: player.id, targetID: target.id, weaponID, action, position: { ...target.position } });
  }

  private spawnProjectile(player: PlayerState): void {
    const weapon = player.weaponID ? weaponByID(player.weaponID) : rayPistol;
    if (weapon.type !== "ranged") return;
    const direction = normalize(applySpread(player.facing, weapon.spread, this.tick + this.projectiles.length));
    if (length(direction) <= 0) return;
    const from = add(player.position, scale(direction, 28));
    const velocity = scale(direction, weapon.projectileSpeed);
    this.projectiles.push({
      id: `p-${this.tick}-${this.projectiles.length}`,
      ownerID: player.id,
      weaponID: weapon.id,
      position: from,
      previousPosition: { ...from },
      velocity,
      damage: weapon.damage,
      knockback: weapon.knockback,
      remainingRange: weapon.range,
      isActive: true
    });
    player.cooldownRemaining = weapon.cooldown;
    this.eventsThisTick.push({ type: "projectile-fired", tick: this.tick, playerID: player.id, weaponID: weapon.id, from, to: add(from, scale(direction, 48)) });
  }

  private updateProjectiles(deltaSeconds: number): void {
    for (const projectile of this.projectiles) {
      if (!projectile.isActive) continue;
      const start = projectile.position;
      const travel = scale(projectile.velocity, deltaSeconds);
      const end = add(start, travel);
      projectile.previousPosition = { ...start };
      if (this.map.walls.some((wall) => this.blocksProjectiles(wall.kind) && intersectsSegment(wall.rect, start, end))) {
        projectile.position = end;
        projectile.isActive = false;
        this.eventsThisTick.push({ type: "projectile-hit", tick: this.tick, playerID: projectile.ownerID, weaponID: projectile.weaponID, position: end });
        continue;
      }
      projectile.position = end;
      projectile.remainingRange -= length(travel);
      const hit = [...this.players.values()].find(
        (player) => player.id !== projectile.ownerID && !player.isEliminated && distance(player.position, end) <= hitRadius
      );
      if (hit) {
        this.damagePlayer(hit.id, projectile.damage, scale(normalize(projectile.velocity), projectile.knockback), projectile.ownerID);
        projectile.isActive = false;
        this.eventsThisTick.push({ type: "projectile-hit", tick: this.tick, playerID: projectile.ownerID, targetID: hit.id, weaponID: projectile.weaponID, position: { ...hit.position } });
      }
      if (projectile.remainingRange <= 0) projectile.isActive = false;
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

  private damagePlayer(id: string, amount: number, knockback: Vector2 = { ...zeroVector }, attackerID?: string): void {
    const player = this.players.get(id);
    if (!player || player.isEliminated) return;
    if (player.invulnerabilityRemaining > 0) return;
    if (attackerID && player.shieldRemaining > 0 && this.isShieldFacing(player, attackerID)) {
      this.eventsThisTick.push({ type: "shield-block", tick: this.tick, playerID: player.id, position: { ...player.position } });
      return;
    }
    player.health = Math.max(0, player.health - amount);
    if (length(knockback) > 0) player.position = this.constrainedPosition(add(player.position, knockback));
    if (player.health <= 0) {
      player.isEliminated = true;
      this.eliminations.push({ playerID: id, tick: this.tick });
    }
  }

  private isShieldFacing(player: PlayerState, attackerID: string): boolean {
    const attacker = this.players.get(attackerID);
    if (!attacker) return false;
    const toAttacker = normalize(sub(attacker.position, player.position));
    return dot(toAttacker, normalize(player.facing)) > 0.18;
  }

  private updateWinner(): void {
    const alive = [...this.players.values()].filter((player) => !player.isEliminated);
    if (alive.length === 1) this.winnerID = alive[0]!.id;
    else if (alive.length === 0) this.winnerID = "draw";
  }

  private blocksMovement(kind: string): boolean {
    return kind === "solid" || kind === "softCover";
  }

  private blocksProjectiles(kind: string): boolean {
    return kind === "solid" || kind === "softCover" || kind === "projectileOnly";
  }
}

export function meleeStats(action: MeleeAction): { damage: number; range: number; cooldown: number; knockback: number } {
  if (action === "punch") return { damage: 12, range: 40, cooldown: 0.28, knockback: 24 };
  if (action === "flyingKick") return { damage: 22, range: 74, cooldown: 0.62, knockback: 58 };
  return { damage: 26, range: 48, cooldown: 0.82, knockback: 74 };
}

function applySpread(direction: Vector2, spread: number, seed: number): Vector2 {
  const base = normalize(direction);
  const jitter = Math.sin(seed * 12.9898) * 43758.5453;
  const angle = (jitter - Math.floor(jitter) - 0.5) * spread;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return normalize({ x: base.x * cos - base.y * sin, y: base.x * sin + base.y * cos });
}

export const defaultMeleeWeapon = neonKatana;
export const defaultRangedWeapon = rayPistol;
export const highImpactRangedWeapon = pulseBow;
export const defaultUtilityWeapon = energyShieldBaton;
