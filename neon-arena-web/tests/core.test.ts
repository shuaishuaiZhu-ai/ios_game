import { describe, expect, it } from "vitest";
import { AIController } from "../src/core/aiController";
import { containsPoint, expanded, vec } from "../src/core/geometry";
import { GameSession } from "../src/core/gameSession";
import { arenaMaps, mapByID, safeZoneState } from "../src/core/maps";
import { energyBlade, matchConfig, pulseRifle, type PlayerInput } from "../src/core/models";

describe("arena maps", () => {
  it("keeps player spawns and weapon spawns out of walls", () => {
    for (const map of arenaMaps) {
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
    expect(energyBlade.damage).toBeGreaterThan(pulseRifle.damage);
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
    session.forcePlayerPosition("p1", vec(360, 222));
    session.forcePlayerPosition("p2", vec(540, 222));
    const player = session.players.get("p1")!;
    player.weapon = "ranged";
    player.facing = { x: 1, y: 0 };

    session.step([input("p1", { x: 0, y: 0 }, { x: 1, y: 0 }, true)], 0.1);

    expect(session.projectiles).toHaveLength(0);
    expect(session.players.get("p2")!.health).toBe(100);
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
    session.forcePlayerPosition("p2", vec(450, 310));

    session.step([], 1);

    expect(session.players.get("p1")!.health).toBeLessThan(100);
    expect(session.players.get("p2")!.health).toBe(100);
  });

  it("resolves a winner after the last opponent is eliminated", () => {
    const session = standardSession("neon-grid");
    session.forcePlayerPosition("p1", vec(240, 240));
    session.forcePlayerPosition("p2", vec(282, 240));
    session.players.get("p1")!.weapon = "melee";
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
    const ai = new AIController("p1", "hard");

    const aiInput = ai.input(snapshot, mapByID("neon-grid"));

    expect(aiInput.movement.x).toBeGreaterThan(0);
    expect(aiInput.movement.y).toBeGreaterThan(0);
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
  meleeAction?: PlayerInput["meleeAction"]
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
  return result;
}
