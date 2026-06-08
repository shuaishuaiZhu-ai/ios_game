import { describe, expect, it } from "vitest";
import { BrowserInputState } from "../../src/game/input/BrowserInputState";
import {
  buildOnlineMatchConfig,
  buildSingleSceneOptions,
  createRoomCode,
  defaultMenuSelection,
  isValidRoomCode,
  normalizeRoomCode,
  sanitizeNickname,
  targetPlayersForMatchKind,
  type MenuSelection
} from "../../src/game/menu/menuSelection";

describe("menu selection", () => {
  it("creates six-character room codes and validates normalized codes", () => {
    const code = createRoomCode(() => 0);
    expect(code).toBe("AAAAAA");
    expect(normalizeRoomCode(" ab-12 cd ")).toBe("AB12CD");
    expect(isValidRoomCode("abc")).toBe(true);
    expect(isValidRoomCode("ab")).toBe(false);
    expect(isValidRoomCode("abcd12345")).toBe(true);
  });

  it("builds single-player scene config with selected difficulty and map", () => {
    const selection = { ...defaultMenuSelection(), difficulty: "hard", mapID: "map06_foundry_lava_arena", ruleset: "meleeOnly" } as const;
    const options = buildSingleSceneOptions(selection, new BrowserInputState());
    expect(options.config.mapID).toBe("map06_foundry_lava_arena");
    expect(options.config.playerCount).toBe(4);
    expect(options.config.mode).toEqual({ kind: "single", difficulty: "hard", ruleset: "meleeOnly" });
  });

  it("builds online duel and FFA configs from room selections", () => {
    const duel: MenuSelection = { ...defaultMenuSelection(), matchKind: "onlineDuel", targetPlayers: 4 };
    expect(buildOnlineMatchConfig(duel).mode.kind).toBe("onlineDuel");
    expect(buildOnlineMatchConfig(duel).playerCount).toBe(2);

    const ffa: MenuSelection = { ...defaultMenuSelection(), matchKind: "onlineFFA", targetPlayers: 3 };
    expect(buildOnlineMatchConfig(ffa).mode.kind).toBe("onlineFFA");
    expect(buildOnlineMatchConfig(ffa).playerCount).toBe(3);
    expect(targetPlayersForMatchKind("onlineFFA", 9)).toBe(4);
  });

  it("sanitizes nickname input", () => {
    expect(sanitizeNickname("  Ace   Pilot  ")).toBe("Ace Pilot");
    expect(sanitizeNickname("")).toBe("Player");
  });
});
