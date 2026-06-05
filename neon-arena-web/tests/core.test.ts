import { describe, expect, it } from "vitest";
import { AIController } from "../src/core/aiController";
import { containsPoint, distance, expanded, vec } from "../src/core/geometry";
import { dashDistance, GameSession, moveSpeed } from "../src/core/gameSession";
import { arenaMaps, mapByID, safeZoneState } from "../src/core/maps";
import { matchConfig, weaponDefinitions, type PlayerInput } from "../src/core/models";

describe("arena maps", () => {
  it("keeps player spawns and weapon spawns out of walls", () => {
    expect(arenaMaps).toHaveLength(5);
    for (const map of arenaMaps) {
      expect(map.size.x).toBeGreaterThanOrEqual(1600);
      expect(map.size.y).toBeGreaterThanOrEqual(1100);
      expect(map.spawnPoints.length).toBeGreaterThanOrEqual(4);
      for (const spawn of map.spawnPoints) {
        expect(map.walls.some((wall) => containsPoint(expanded(wall.rect, 18), spawn))).toBe(false);
      }
      for (const spawn of map.weaponSpawnPoints) {
        expect(map.walls.some((wall) => containsPoint(expanded(wall.rect, 18), spawn.position))).toBe(false);
      }
    }
  });
});

describe("weapons and collision", () => {
  it("keeps melee damage higher than ranged damage", () => {
    const meleeDamage = Math.min(...weaponDefinitions.filter((weapon) => weapon.type === "melee").map((weapon) => weapon.damage));
    const rangedDamage = Math.max(...weaponDefinitions.filter((weapon) => weapon.type === "ranged").map((weapon) => weapon.damage));
    expect(meleeDamage).toBeGreaterThan(rangedDamage);
  });

  it("prevents movement through walls", () => {
    const session = standardSession("neon-grid");
    const wall = mapByID("neon-grid").walls[0]!;
    session.forcePlayerPosition("p1", vec(wall.rect.origin.x - 30, wall.rect.origin.y + 12));

    session.step([input("p1", { x: 1, y: 0 })], 0.5);

    expect(containsPoint(expanded(wall.rect, 18), session.players.get("p1")!.position)).toBe(false);
  });

  it("blocks ranged projectiles with walls", () => {
    const session = standardSession("neon-grid");
    const wall = mapByID("neon-grid").walls[0]!;
    session.forcePlayerPosition("p1", vec(wall.rect.origin.x - 60, wall.rect.origin.y + 20));
    session.forcePlayerPosition("p2", vec(wall.rect.origin.x + wall.rect.size.x + 80, wall.rect.origin.y + 20));
    const player = session.players.get("p1")!;
    player.weapon = "ranged";
    player.weaponID = "pulse-rifle";
    player.facing = { x: 1, y: 0 };

    session.step([input("p1", { x: 0, y: 0 }, { x: 1, y: 0 }, true)], 0.1);

    expect(session.projectiles).toHaveLength(0);
    expect(session.players.get("p2")!.health).toBe(100);
  });

  it("applies dash movement and cooldown", () => {
    const session = standardSession("neon-grid");
    const before = session.players.get("p1")!.position;

    session.step([input("p1", { x: 1, y: 0 }, { x: 1, y: 0 }, false, undefined, true)], 0.1);

    const player = session.players.get("p1")!;
    expect(distance(before, player.position)).toBeGreaterThan(moveSpeed * 0.1);
    expect(distance(before, player.position)).toBeLessThanOrEqual(moveSpeed * 0.1 + dashDistance + 1);
    expect(player.dashCooldownRemaining).toBeGreaterThan(0);
  });

  it("applies roll cooldown and short invulnerability", () => {
    const session = standardSession("neon-grid");

    session.step([input("p1", { x: 1, y: 0 }, { x: 1, y: 0 }, false, undefined, false, true)], 0.1);

    const player = session.players.get("p1")!;
    expect(player.rollCooldownRemaining).toBeGreaterThan(0);
    expect(player.invulnerabilityRemaining).toBeGreaterThan(0);
  });
});

describe("melee-only rules", () => {
  it("disables weapon pickups and projectile shooting", () => {
    const config = matchConfig({ kind: "single", difficulty: "medium", ruleset: "meleeOnly" }, "neon-grid", 2);
    const session = new GameSession(config, ["p1", "p2"]);

    session.step([input("p1", { x: 0, y: 0 }, { x: 1, y: 0 }, true)], 0.1);

    expect(session.droppedWeapons).toHaveLength(0);
    expect(session.players.get("p1")!.weapon).toBeUndefined();
    expect(session.projectiles).toHaveLength(0);
  });

  it("allows punch, flying kick, and throw actions", () => {
    for (const action of ["punch", "flyingKick", "throw"] as const) {
      const config = matchConfig({ kind: "single", difficulty: "medium", ruleset: "meleeOnly" }, "neon-grid", 2);
      const session = new GameSession(config, ["p1", "p2"]);
      session.forcePlayerPosition("p1", vec(240, 240));
      session.forcePlayerPosition("p2", vec(280, 240));

      session.step([input("p1", { x: 0, y: 0 }, { x: 1, y: 0 }, false, action)], 0.1);

      expect(session.players.get("p2")!.health).toBeLessThan(100);
    }
  });
});

describe("safe zone and winner", () => {
  it("has three shrinking phases with decreasing radius", () => {
    const map = mapByID("neon-grid");
    const first = safeZoneState(map.safeZone, 0);
    const second = safeZoneState(map.safeZone, map.safeZone.phaseDuration + 1);
    const third = safeZoneState(map.safeZone, map.safeZone.phaseDuration * 2 + 1);

    expect([first.phase, second.phase, third.phase]).toEqual([0, 1, 2]);
    expect(first.radius).toBeGreaterThan(second.radius);
    expect(second.radius).toBeGreaterThan(third.radius);
  });

  it("damages only players outside the safe zone", () => {
    const session = standardSession("neon-grid");
    session.forcePlayerPosition("p1", vec(18, 18));
    session.forcePlayerPosition("p2", mapByID("neon-grid").safeZone.center);

    session.step([], 1);

    expect(session.players.get("p1")!.health).toBeLessThan(100);
    expect(session.players.get("p2")!.health).toBe(100);
  });

  it("resolves a winner after the last opponent is eliminated", () => {
    const session = standardSession("neon-grid");
    session.forcePlayerPosition("p1", vec(240, 240));
    session.forcePlayerPosition("p2", vec(282, 240));
    session.players.get("p1")!.weapon = "melee";
    session.players.get("p1")!.weaponID = "energy-blade";
    session.players.get("p1")!.facing = { x: 1, y: 0 };
    session.players.get("p2")!.health = 10;

    session.step([input("p1", { x: 0, y: 0 }, { x: 1, y: 0 }, true)], 0.1);

    expect(session.snapshot().winnerID).toBe("p1");
  });
});

describe("AI", () => {
  it("moves toward the safe zone when outside it", () => {
    const session = standardSession("neon-grid");
    session.forcePlayerPosition("p1", vec(18, 18));
    const snapshot = session.snapshot();
    snapshot.tick = 18;
    const ai = new AIController("p1", "hard");

    const aiInput = ai.input(snapshot, mapByID("neon-grid"));

    expect(aiInput.movement.x).toBeGreaterThan(0);
    expect(aiInput.movement.y).toBeGreaterThan(0);
    expect(aiInput.dashPressed).toBe(true);
  });
});

function standardSession(mapID: string): GameSession {
  const config = matchConfig({ kind: "single", difficulty: "medium", ruleset: "standard" }, mapID, 2);
  return new GameSession(config, ["p1", "p2"]);
}

function input(
  playerID: string,
  movement: { x: number; y: number },
  aim = { x: 1, y: 0 },
  firePressed = false,
  meleeAction?: PlayerInput["meleeAction"],
  dashPressed = false,
  rollPressed = false
): PlayerInput {
  const result: PlayerInput = {
    playerID,
    movement,
    aim,
    firePressed,
    tick: 0
  };
  if (meleeAction) {
    result.meleeAction = meleeAction;
  }
  if (dashPressed) {
    result.dashPressed = true;
  }
  if (rollPressed) {
    result.rollPressed = true;
  }
  return result;
}
