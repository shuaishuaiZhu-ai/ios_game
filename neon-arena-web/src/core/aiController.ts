import { add, length, normalize, scale, sub, type Vector2, zeroVector } from "./geometry";
import type { Difficulty, MapDefinition, MatchSnapshot, MeleeAction, PlayerInput, PlayerState, SafeZoneState } from "./models";

export class AIController {
  constructor(
    readonly playerID: string,
    readonly difficulty: Difficulty
  ) {}

  input(snapshot: MatchSnapshot, map: MapDefinition): PlayerInput {
    const self = snapshot.players.find((player) => player.id === this.playerID && !player.isEliminated);
    if (!self) {
      return { playerID: this.playerID, movement: { ...zeroVector }, aim: { ...zeroVector }, firePressed: false, tick: snapshot.tick };
    }

    const safeMovement = this.movementTowardSafeZoneIfNeeded(self, snapshot.safeZone);
    const target = nearestOpponent(self, snapshot.players);
    const targetVector = target ? sub(target.position, self.position) : { x: 1, y: 0 };
    const aim = this.adjustedAim(normalize(targetVector));
    const combatMovement = target ? this.movementFor(self, target, map) : { ...zeroVector };
    const movement = length(safeMovement) > 0 ? safeMovement : combatMovement;
    const meleeAction = this.meleeAction(length(targetVector));

    const input: PlayerInput = {
      playerID: this.playerID,
      movement,
      aim,
      firePressed: this.shouldAttack(length(targetVector), snapshot.tick) || meleeAction !== undefined,
      tick: snapshot.tick
    };
    if (meleeAction) {
      input.meleeAction = meleeAction;
    }
    return input;
  }

  movementTowardSafeZoneIfNeeded(player: PlayerState, safeZone: SafeZoneState): Vector2 {
    const dist = length(sub(player.position, safeZone.center));
    if (dist <= safeZone.radius * 0.82) {
      return { ...zeroVector };
    }
    return normalize(sub(safeZone.center, player.position));
  }

  private movementFor(player: PlayerState, target: PlayerState, _map: MapDefinition): Vector2 {
    const offset = sub(target.position, player.position);
    const dist = length(offset);
    const strafe = normalize({ x: -offset.y, y: offset.x });

    if (this.difficulty === "easy") {
      return dist > 160 ? normalize(offset) : scale(strafe, 0.35);
    }
    if (this.difficulty === "medium") {
      return dist > 130 ? normalize(offset) : strafe;
    }
    if (dist < 80) {
      return normalize(sub(player.position, target.position));
    }
    return normalize(add(normalize(offset), scale(strafe, 0.45)));
  }

  private adjustedAim(aim: Vector2): Vector2 {
    if (this.difficulty === "easy") return normalize(add(aim, { x: 0.24, y: -0.16 }));
    if (this.difficulty === "medium") return normalize(add(aim, { x: 0.08, y: -0.05 }));
    return aim;
  }

  private shouldAttack(distance: number, tick: number): boolean {
    if (this.difficulty === "easy") return tick % 22 === 0 && distance < 360;
    if (this.difficulty === "medium") return tick % 14 === 0 && distance < 430;
    return tick % 8 === 0 && distance < 480;
  }

  private meleeAction(distance: number): MeleeAction | undefined {
    if (distance >= 72) return undefined;
    if (this.difficulty === "easy") return "punch";
    if (this.difficulty === "medium") return distance > 44 ? "flyingKick" : "punch";
    return distance < 42 ? "throw" : "flyingKick";
  }
}

function nearestOpponent(player: PlayerState, players: PlayerState[]): PlayerState | undefined {
  return players
    .filter((candidate) => candidate.id !== player.id && !candidate.isEliminated)
    .sort((a, b) => length(sub(a.position, player.position)) - length(sub(b.position, player.position)))[0];
}
