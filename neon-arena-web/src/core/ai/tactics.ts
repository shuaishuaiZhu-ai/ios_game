import { distance, normalize, sub, type Vector2 } from "../geometry";
import type { MatchSnapshot, PlayerState } from "../models";

export interface TacticalTarget {
  enemy?: PlayerState;
  desiredPosition: Vector2;
  shouldFire: boolean;
  shouldDash: boolean;
}

export function chooseTacticalTarget(player: PlayerState, snapshot: MatchSnapshot): TacticalTarget {
  const enemies = snapshot.players.filter((candidate) => candidate.id !== player.id && !candidate.isEliminated);
  const nearest = enemies.sort((a, b) => distance(a.position, player.position) - distance(b.position, player.position))[0];
  if (!nearest) {
    return { desiredPosition: snapshot.safeZone.center, shouldFire: false, shouldDash: false };
  }
  const range = distance(player.position, nearest.position);
  const hasRanged = player.weapon === "ranged";
  const desiredPosition = hasRanged && range < 210 ? retreatFrom(player.position, nearest.position) : nearest.position;
  return {
    enemy: nearest,
    desiredPosition,
    shouldFire: hasRanged ? range < 520 : range < 84,
    shouldDash: !hasRanged && range > 96 && range < 260
  };
}

function retreatFrom(position: Vector2, enemy: Vector2): Vector2 {
  const away = normalize(sub(position, enemy));
  return { x: position.x + away.x * 160, y: position.y + away.y * 160 };
}
