import { GameSession } from "../core/gameSession";
import { matchConfig, type NetworkMessage, type PlayerInput, type Ruleset } from "../core/models";

export interface RoomOptions {
  roomCode: string;
  mapID: string;
  ruleset: Ruleset;
  targetPlayers: number;
  seed: number;
}

export interface RoomPlayer {
  id: string;
  nickname: string;
}

export class RoomState {
  readonly roomCode: string;
  readonly mapID: string;
  readonly ruleset: Ruleset;
  readonly targetPlayers: number;
  readonly seed: number;
  players = new Map<string, RoomPlayer>();
  session: GameSession | undefined;
  private latestInputs = new Map<string, PlayerInput>();
  private disconnectedPlayers = new Set<string>();
  private lastStepTime = 0;

  constructor(options: RoomOptions) {
    this.roomCode = normalizeRoomCode(options.roomCode);
    this.mapID = options.mapID;
    this.ruleset = options.ruleset;
    this.targetPlayers = clampTargetPlayers(options.targetPlayers);
    this.seed = options.seed;
  }

  join(player: RoomPlayer): NetworkMessage[] {
    if (this.session) {
      if (this.players.has(player.id) && this.disconnectedPlayers.has(player.id)) {
        this.disconnectedPlayers.delete(player.id);
        const snapshot = this.session.snapshot();
        return [{ type: "joined", playerID: player.id, nickname: player.nickname, roomCode: this.roomCode }, { type: "snapshot", snapshot, events: snapshot.events }];
      }
      return [{ type: "error", message: "match-running" }];
    }
    if (this.players.has(player.id)) return [{ type: "joined", playerID: player.id, nickname: player.nickname, roomCode: this.roomCode }, this.lobbyMessage()];
    if (this.players.size >= this.targetPlayers) return [{ type: "error", message: "room-full" }];
    this.players.set(player.id, player);
    const messages: NetworkMessage[] = [{ type: "joined", playerID: player.id, nickname: player.nickname, roomCode: this.roomCode }, this.lobbyMessage()];
    if (this.players.size >= this.targetPlayers) messages.push(...this.start());
    return messages;
  }

  leave(playerID: string): NetworkMessage[] {
    if (!this.players.has(playerID)) return [];
    this.latestInputs.delete(playerID);
    const messages: NetworkMessage[] = [{ type: "playerDisconnected", playerID }];
    if (this.session) {
      this.disconnectedPlayers.add(playerID);
      const snapshot = this.session.snapshot();
      messages.push({ type: "snapshot", snapshot, events: snapshot.events });
      return messages;
    }
    this.players.delete(playerID);
    messages.push(this.lobbyMessage());
    return messages;
  }

  receiveInput(input: PlayerInput, now = Date.now()): NetworkMessage[] {
    if (!this.session || this.session.winnerID) return [];
    this.latestInputs.set(input.playerID, input);
    const deltaSeconds = this.stepDelta(now);
    this.session.step([...this.latestInputs.values()], deltaSeconds);
    const snapshot = this.session.snapshot();
    return [{ type: "snapshot", snapshot, events: snapshot.events }];
  }

  lobbyMessage(): NetworkMessage {
    return { type: "lobby", roomCode: this.roomCode, playerCount: this.players.size, targetPlayers: this.targetPlayers, players: [...this.players.values()] };
  }

  private start(): NetworkMessage[] {
    const playerIDs = [...this.players.keys()].slice(0, this.targetPlayers);
    const nicknames = Object.fromEntries([...this.players.values()].map((player) => [player.id, player.nickname]));
    const mode = this.targetPlayers <= 2 ? ({ kind: "onlineDuel", ruleset: this.ruleset } as const) : ({ kind: "onlineFFA", ruleset: this.ruleset } as const);
    const config = matchConfig(mode, this.mapID, this.targetPlayers, this.seed, 30);
    this.session = new GameSession(config, playerIDs, nicknames);
    this.lastStepTime = 0;
    const snapshot = this.session.snapshot();
    return [{ type: "start", config, playerIDs, nicknames }, { type: "snapshot", snapshot, events: snapshot.events }];
  }

  private stepDelta(now: number): number {
    if (this.lastStepTime <= 0) { this.lastStepTime = now; return 1 / 30; }
    const elapsed = Math.max(1 / 60, (now - this.lastStepTime) / 1000);
    this.lastStepTime = now;
    return Math.min(elapsed, 0.2);
  }
}

export function normalizeRoomCode(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 8) || "ROOM";
}

export function clampTargetPlayers(value: number): number {
  return Math.min(Math.max(Math.floor(value), 2), 4);
}
