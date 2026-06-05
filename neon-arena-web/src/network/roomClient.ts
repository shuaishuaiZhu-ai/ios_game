import type { MatchConfig, MatchSnapshot, NetworkMessage, PlayerInput } from "../core/models";
import { decodeMessage, encodeMessage } from "./protocol";

export class RoomClient extends EventTarget {
  private socket: WebSocket | undefined;
  private currentSnapshot: MatchSnapshot | undefined;

  connect(url: string, playerID: string, nickname: string): void {
    this.socket = new WebSocket(url);
    this.socket.addEventListener("open", () => this.send({ type: "join", playerID, nickname }));
    this.socket.addEventListener("message", (event) => this.handleMessage(String(event.data)));
  }

  snapshot(): MatchSnapshot | undefined {
    return this.currentSnapshot;
  }

  sendInput(input: PlayerInput): void {
    this.send({ type: "input", input });
  }

  private send(message: NetworkMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(encodeMessage(message));
  }

  private handleMessage(payload: string): void {
    const message = decodeMessage(payload);
    if (!message) return;
    if (message.type === "snapshot") this.currentSnapshot = message.snapshot;
    this.dispatchEvent(new CustomEvent<NetworkMessage>(message.type, { detail: message }));
  }
}

export function buildWorkerWebSocketURL(roomCode: string, config: MatchConfig): string {
  const url = new URL(`/api/rooms/${encodeURIComponent(roomCode)}`, window.location.href);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("map", config.mapID);
  url.searchParams.set("players", String(config.playerCount));
  url.searchParams.set("ruleset", config.mode.ruleset);
  return url.toString();
}
