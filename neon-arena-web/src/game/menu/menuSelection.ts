import type { Difficulty, MatchConfig, Ruleset } from "../../core/models";
import { matchConfig } from "../../core/models";
import type { BrowserInputState } from "../input/BrowserInputState";
import { buildWorkerWebSocketURL } from "../../network/roomClient";

export type MatchKind = "single" | "onlineDuel" | "onlineFFA";

export interface MenuSelection {
  matchKind: MatchKind;
  mapID: string;
  ruleset: Ruleset;
  difficulty: Difficulty;
  targetPlayers: number;
  nickname: string;
  roomCode: string;
}

export interface SingleSceneOptions {
  localPlayerID: string;
  config: MatchConfig;
  inputState: BrowserInputState;
}

const ROOM_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function defaultMenuSelection(): MenuSelection {
  return {
    matchKind: "single",
    mapID: "map06_foundry_lava_arena",
    ruleset: "standard",
    difficulty: "medium",
    targetPlayers: 2,
    nickname: "Player",
    roomCode: ""
  };
}

export function createRoomCode(random = Math.random): string {
  let code = "";
  for (let index = 0; index < 6; index++) {
    code += ROOM_CHARS[Math.floor(random() * ROOM_CHARS.length) % ROOM_CHARS.length];
  }
  return code;
}

export function normalizeRoomCode(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 8);
}

export function isValidRoomCode(value: string): boolean {
  const code = normalizeRoomCode(value);
  return code.length >= 3 && code.length <= 8;
}

export function sanitizeNickname(value: string): string {
  const nickname = value.trim().replace(/\s+/g, " ").slice(0, 16);
  return nickname || "Player";
}

export function targetPlayersForMatchKind(matchKind: MatchKind, requested: number): number {
  if (matchKind === "single") return 4;
  if (matchKind === "onlineDuel") return 2;
  return Math.min(Math.max(Math.floor(requested), 3), 4);
}

export function buildSingleSceneOptions(selection: MenuSelection, inputState: BrowserInputState): SingleSceneOptions {
  return {
    localPlayerID: "p1",
    inputState,
    config: matchConfig({ kind: "single", difficulty: selection.difficulty, ruleset: selection.ruleset }, selection.mapID, 4, Date.now(), 30)
  };
}

export function buildOnlineMatchConfig(selection: MenuSelection): MatchConfig {
  const targetPlayers = targetPlayersForMatchKind(selection.matchKind, selection.targetPlayers);
  const mode = targetPlayers <= 2 ? ({ kind: "onlineDuel", ruleset: selection.ruleset } as const) : ({ kind: "onlineFFA", ruleset: selection.ruleset } as const);
  return matchConfig(mode, selection.mapID, targetPlayers, Date.now(), 30);
}

export function buildOnlineRoomURL(selection: MenuSelection): string {
  return buildWorkerWebSocketURL(normalizeRoomCode(selection.roomCode), buildOnlineMatchConfig(selection));
}
