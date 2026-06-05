import { describe, expect, it } from "vitest";
import { AIController } from "../../src/core/aiController";
import { containsPoint, distance, expanded, vec } from "../../src/core/geometry";
import { dashDistance, GameSession, moveSpeed } from "../../src/core/gameSession";
import { arenaMaps, mapByID, safeZoneState } from "../../src/core/maps";
import { matchConfig, weaponDefinitions, type PlayerInput } from "../../src/core/models";

describe("map validation", () => {
  it("keeps all player and weapon spawns out of collision", () => {
    expect(arenaMaps).toHaveLength(5);
    for (const map of arenaMaps) {
      expect(map.size.x).toBe(1600);
      expect(map.size.y).toBe(1100);
      expect(map.spawnPoints.length).toBeGreaterThanOrEqual(4);
      expect(map.weaponSpawnPoints.length).toBeGreaterThanOrEqual(5);
      for (const spawn of map.spawnPoints) {
        expect(map.walls.some((wall) => containsPoint(expanded(wall.rect, 18), spawn))).toBe(false);
      }
      for (const spawn of map.weaponSpawnPoints) {
        expect(map.walls.some((wall) => containsPoint(expanded(wall.rect, 18), spawn.position))).toBe(false);
      }
    }
  });
});

describe("weapon rules", () => {
  it("uses the new cyberpunk weapon IDs", () => {
    expect(weaponDefinitions.map((weapon) => weapon.id).sort()).toEqual(["energy-shield-baton", "neon-katana", "pulse-bow", "ray-pistol"].sort());
  });

  it("keeps melee burst damage higher than rapid ranged damage", () => {
    const katana = weaponDefinitions.find((weapon) => weapon.id === "neon-katana")!;
    const pistol = weaponDefinitions.find((weapon) => weapon.id === "ray-pistol")!;
    expect(katana.damage).toBeGreaterThan(pistol.damage);
  });
});

describe("movement and collision", () => {
  it("prevents movement through cover walls", () => {
    const session = standardSession();
    const wall = mapByID("map01_skyline_garden_ruins").walls[0]!;
    session.forcePlayerPosition("p1", vec(wall.rect.origin.x - 30, wall.rect.origin.y + 12));
    session.step([input("p1", { x: 1, y: 0 })], 0.5);
    expect(containsPoint(expanded(wall.rect, 18), session.players.get("p1")!.position)).toBe(false);
  });

  it("applies dash and roll events", () => {
    const session = standardSession();
    const before = session.players.get("p1")!.position;
    session.step([input("p1", { x: 1, y: 0 }, { x: 1, y: 0 }, false, undefined, true)], 0.1);
    const player = session.players.get("p1")!;
    expect(distance(before, player.position)).toBeGreaterThan(moveSpeed * 0.1);
    expect(distance(before, player.position)).toBeLessThanOrEqual(moveSpeed * 0.1 + dashDistance + 1);
    expect(player.dashCooldownRemaining).toBeGreaterThan(0);
    expect(session.snapshot().events.some((event) => event.type === "dash")).toBe(true);
    session.step([input("p2", { x: 1, y: 0 }, { x: 1, y: 0 }, false, undefined, false, true)], 0.1);
    expect(session.snapshot().events.some((event) => event.type === "roll")).toBe(true);
  });

  it("keeps standard displacement on cooldown", () => {
    const session = standardSession();
    session.step([input("p1", { x: 1, y: 0 }, { x: 1, y: 0 }, false, undefined, true)], 0.1);
    const afterDash = session.players.get("p1")!.position;
    expect(session.players.get("p1")!.dashCooldownRemaining).toBeGreaterThan(0);
    session.step([input("p1", { x: 1, y: 0 }, { x: 1, y: 0 }, false, undefined, true)], 0.1);
    const afterCooldownBlocked = session.players.get("p1")!.position;
    expect(distance(afterDash, afterCooldownBlocked)).toBeLessThanOrEqual(moveSpeed * 0.1 + 1);
    expect(session.snapshot().events.some((event) => event.type === "dash")).toBe(false);
  });

  it("limits melee-only mode to movement and melee attacks", () => {
    const session = meleeSession();
    expect(session.droppedWeapons).toHaveLength(0);
    const before = session.players.get("p1")!.position;
    session.step([input("p1", { x: 1, y: 0 }, { x: 1, y: 0 }, true, undefined, true, true)], 0.1);
    const afterInvalidButtons = session.players.get("p1")!.position;
    expect(distance(before, afterInvalidButtons)).toBeLessThanOrEqual(moveSpeed * 0.1 + 1);
    expect(session.snapshot().events.some((event) => ["dash", "roll", "projectile-fired", "shield-block"].includes(event.type))).toBe(false);
    session.forcePlayerPosition("p1", vec(300, 300));
    session.forcePlayerPosition("p2", vec(344, 300));
    session.step([input("p1", { x: 0, y: 0 }, { x: 1, y: 0 }, false, "punch")], 0.1);
    expect(session.snapshot().events.some((event) => event.type === "melee-swing")).toBe(true);
  });
});

describe("combat events", () => {
  it("emits pickup and projectile events", () => {
    const session = standardSession();
    const spawn = session.droppedWeapons.find((weapon) => weapon.weaponID === "ray-pistol")!;
    session.forcePlayerPosition("p1", spawn.position);
    session.step([input("p1", { x: 0, y: 0 })], 0.1);
    expect(session.players.get("p1")!.weaponID).toBe("ray-pistol");
    expect(session.snapshot().events.some((event) => event.type === "pickup")).toBe(true);
    session.step([input("p1", { x: 0, y: 0 }, { x: 1, y: 0 }, true)], 0.1);
    expect(session.snapshot().events.some((event) => event.type === "projectile-fired")).toBe(true);
  });

  it("prevents melee hits through cover", () => {
    const session = standardSession();
    const wall = mapByID("map01_skyline_garden_ruins").walls[0]!;
    session.forcePlayerPosition("p1", vec(wall.rect.origin.x - 40, wall.rect.origin.y + 36));
    session.forcePlayerPosition("p2", vec(wall.rect.origin.x + wall.rect.size.x + 30, wall.rect.origin.y + 36));
    const player = session.players.get("p1")!;
    player.weapon = "melee";
    player.weaponID = "neon-katana";
    player.facing = { x: 1, y: 0 };
    session.step([input("p1", { x: 0, y: 0 }, { x: 1, y: 0 }, true)], 0.1);
    expect(session.players.get("p2")!.health).toBe(100);
  });

  it("blocks projectiles with cover and emits an impact event", () => {
    const session = standardSession();
    const wall = mapByID("map01_skyline_garden_ruins").walls[0]!;
    session.forcePlayerPosition("p1", vec(wall.rect.origin.x - 64, wall.rect.origin.y + 28));
    session.forcePlayerPosition("p2", vec(wall.rect.origin.x + wall.rect.size.x + 90, wall.rect.origin.y + 28));
    const player = session.players.get("p1")!;
    player.weapon = "ranged";
    player.weaponID = "ray-pistol";
    player.facing = { x: 1, y: 0 };
    session.step([input("p1", { x: 0, y: 0 }, { x: 1, y: 0 }, true)], 0.1);
    expect(session.players.get("p2")!.health).toBe(100);
    expect(session.snapshot().events.some((event) => event.type === "projectile-hit")).toBe(true);
  });
});

describe("safe zone and winner", () => {
  it("has three decreasing phases and emits phase events", () => {
    const map = mapByID("map01_skyline_garden_ruins");
    const first = safeZoneState(map.safeZone, 0);
    const second = safeZoneState(map.safeZone, map.safeZone.phaseDuration + 1);
    const third = safeZoneState(map.safeZone, map.safeZone.phaseDuration * 2 + 1);
    expect([first.phase, second.phase, third.phase]).toEqual([0, 1, 2]);
    expect(first.radius).toBeGreaterThan(second.radius);
    expect(second.radius).toBeGreaterThan(third.radius);
    const session = standardSession();
    session.step([], map.safeZone.phaseDuration + 0.1);
    expect(session.snapshot().events.some((event) => event.type === "safe-zone-phase")).toBe(true);
  });

  it("damages only players outside the safe zone", () => {
    const session = standardSession();
    session.forcePlayerPosition("p1", vec(18, 18));
    session.forcePlayerPosition("p2", mapByID("map01_skyline_garden_ruins").safeZone.center);
    session.step([], 1);
    expect(session.players.get("p1")!.health).toBeLessThan(100);
    expect(session.players.get("p2")!.health).toBe(100);
  });
});

describe("AI", () => {
  it("moves toward the safe zone when outside it", () => {
    const session = standardSession();
    session.forcePlayerPosition("p1", vec(18, 18));
    const snapshot = session.snapshot();
    snapshot.tick = 18;
    const ai = new AIController("p1", "hard");
    const aiInput = ai.input(snapshot, mapByID("map01_skyline_garden_ruins"));
    expect(aiInput.movement.x).toBeGreaterThan(0);
    expect(aiInput.movement.y).toBeGreaterThan(0);
  });
});

function standardSession(): GameSession {
  const config = matchConfig({ kind: "single", difficulty: "medium", ruleset: "standard" }, "map01_skyline_garden_ruins", 2);
  return new GameSession(config, ["p1", "p2"]);
}

function meleeSession(): GameSession {
  const config = matchConfig({ kind: "single", difficulty: "medium", ruleset: "meleeOnly" }, "map01_skyline_garden_ruins", 2);
  return new GameSession(config, ["p1", "p2"]);
}

function input(playerID: string, movement: { x: number; y: number }, aim = { x: 1, y: 0 }, firePressed = false, meleeAction?: PlayerInput["meleeAction"], dashPressed = false, rollPressed = false): PlayerInput {
  const result: PlayerInput = { playerID, movement, aim, firePressed, tick: 0 };
  if (meleeAction) result.meleeAction = meleeAction;
  if (dashPressed) result.dashPressed = true;
  if (rollPressed) result.rollPressed = true;
  return result;
}
