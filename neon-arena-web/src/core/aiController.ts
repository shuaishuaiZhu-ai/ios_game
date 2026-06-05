import { distance, length, normalize, sub, type Vector2 } from "./geometry";
import type { Difficulty, MapDefinition, MatchSnapshot, PlayerInput } from "./models";
import { steerToward } from "./ai/navigation";
import { chooseTacticalTarget } from "./ai/tactics";

export class AIController {
  constructor(readonly playerID: string, readonly difficulty: Difficulty) {}

  input(snapshot: MatchSnapshot, map: MapDefinition): PlayerInput {
    const player = snapshot.players.find((candidate) => candidate.id === this.playerID);
    if (!player || player.isEliminated) return this.empty(snapshot.tick);
    const outsideZone = distance(player.position, snapshot.safeZone.center) > snapshot.safeZone.radius - 60;
    const tactic = chooseTacticalTarget(player, snapshot);
    const desired = outsideZone ? snapshot.safeZone.center : tactic.desiredPosition;
    const nav = steerToward(player.position, desired, map);
    const aim = tactic.enemy ? normalize(sub(tactic.enemy.position, player.position)) : normalize(nav.movement);
    const aggression = this.difficulty === "easy" ? 0.35 : this.difficulty === "medium" ? 0.65 : 0.9;
    const phasePressure = snapshot.safeZone.phase >= 2 ? 0.18 : 0;
    const firePressed = tactic.shouldFire && shouldPulse(snapshot.tick, this.playerID, aggression + phasePressure);
    const shieldPressed = player.weaponID === "energy-shield-baton" && tactic.enemy !== undefined && distance(player.position, tactic.enemy.position) < 190;
    const dashPressed = (outsideZone || tactic.shouldDash || nav.isBlocked) && player.dashCooldownRemaining <= 0 && shouldPulse(snapshot.tick, `${this.playerID}-dash`, aggression);
    const rollPressed = player.health < 35 && player.rollCooldownRemaining <= 0 && shouldPulse(snapshot.tick, `${this.playerID}-roll`, aggression);
    const meleeAction = player.weapon ? undefined : tactic.shouldFire ? "punch" : undefined;
    return {
      playerID: this.playerID,
      movement: length(nav.movement) > 0 ? nav.movement : { x: 0, y: 0 },
      aim: length(aim) > 0 ? aim : { x: 1, y: 0 },
      firePressed,
      dashPressed,
      rollPressed,
      shieldPressed,
      meleeAction,
      tick: snapshot.tick
    };
  }

  private empty(tick: number): PlayerInput {
    return { playerID: this.playerID, movement: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, firePressed: false, tick };
  }
}

function shouldPulse(tick: number, key: string, chance: number): boolean {
  const hash = [...key].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const signal = Math.sin((tick + hash) * 12.9898) * 43758.5453;
  return signal - Math.floor(signal) < chance;
}
