import { add, containsPoint, distance, expanded, length, normalize, scale, sub, vec, type Vector2 } from "../geometry";
import type { MapDefinition } from "../models";
import { playerRadius } from "../gameSession";

export interface NavigationResult {
  movement: Vector2;
  isBlocked: boolean;
}

export function steerToward(from: Vector2, target: Vector2, map: MapDefinition): NavigationResult {
  const direct = normalize(sub(target, from));
  if (length(direct) <= 0) return { movement: vec(0, 0), isBlocked: false };
  const probe = add(from, scale(direct, 60));
  const blocker = map.walls.find((wall) => containsPoint(expanded(wall.rect, playerRadius + 12), probe));
  if (!blocker) return { movement: direct, isBlocked: false };
  const clockwise = normalize(vec(-direct.y, direct.x));
  const counter = normalize(vec(direct.y, -direct.x));
  const cwProbe = add(from, scale(clockwise, 78));
  const ccwProbe = add(from, scale(counter, 78));
  const cwBlocked = map.walls.some((wall) => containsPoint(expanded(wall.rect, playerRadius + 10), cwProbe));
  const ccwBlocked = map.walls.some((wall) => containsPoint(expanded(wall.rect, playerRadius + 10), ccwProbe));
  if (!cwBlocked) return { movement: clockwise, isBlocked: true };
  if (!ccwBlocked) return { movement: counter, isBlocked: true };
  const away = normalize(sub(from, { x: blocker.rect.origin.x + blocker.rect.size.x / 2, y: blocker.rect.origin.y + blocker.rect.size.y / 2 }));
  return { movement: length(away) > 0 ? away : clockwise, isBlocked: true };
}

export function nearestReachableWeapon(from: Vector2, map: MapDefinition) {
  return [...map.weaponSpawnPoints].sort((a, b) => distance(a.position, from) - distance(b.position, from))[0];
}
