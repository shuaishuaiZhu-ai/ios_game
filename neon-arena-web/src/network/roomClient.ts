import type { MatchConfig, MatchSnapshot, NetworkMessage, PlayerInput } from "../core/models";
import { decodeMessage, encodeMessage } from "./protocol";

export type RoomClientStatus = "idle" | "connecting" | "open" | "closed" | "error";
export type LobbyState = Extract<NetworkMessage, { type: "lobby" }>;

export class RoomClient extends EventTarget {
  private socket: WebSocket | undefined;
  private currentSnapshot: MatchSnapshot | undefined;
  private currentStatus: RoomClientStatus = "idle";
  private currentLobby: LobbyState | undefined;
  private currentError: string | undefined;

  connect(url: string, playerID: string, nickname: string): void {
    this.close();
    this.currentSnapshot = undefined;
    this.currentLobby = undefined;
    this.currentError = undefined;
    this.setStatus("connecting");
    this.socket = new WebSocket(url);
    this.socket.addEventListener("open", () => {
      this.setStatus("open");
      this.send({ type: "join", playerID, nickname });
    });
    this.socket.addEventListener("message", (event) => this.handleMessage(String(event.data)));
    this.socket.addEventListener("close", () => this.setStatus("closed"));
    this.socket.addEventListener("error", () => {
      this.currentError = "connection-error";
      this.setStatus("error");
    });
  }

  snapshot(): MatchSnapshot | undefined {
    return this.currentSnapshot;
  }

  status(): RoomClientStatus {
    return this.currentStatus;
  }

  lobby(): LobbyState | undefined {
    return this.currentLobby;
  }

  errorMessage(): string | undefined {
    return this.currentError;
  }

  sendInput(input: PlayerInput): void {
    this.send({ type: "input", input });
  }

  close(): void {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED && this.socket.readyState !== WebSocket.CLOSING) {
      this.socket.close();
    }
    this.socket = undefined;
  }

  private send(message: NetworkMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(encodeMessage(message));
  }

  private handleMessage(payload: string): void {
    const message = decodeMessage(payload);
    if (!message) return;
    if (message.type === "snapshot") this.currentSnapshot = message.snapshot;
    if (message.type === "lobby") this.currentLobby = message;
    if (message.type === "error") {
      this.currentError = message.message;
      this.setStatus("error");
    }
    this.dispatchEvent(new CustomEvent<NetworkMessage>(message.type, { detail: message }));
  }

  private setStatus(status: RoomClientStatus): void {
    this.currentStatus = status;
    this.dispatchEvent(new CustomEvent<RoomClientStatus>("status", { detail: status }));
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
