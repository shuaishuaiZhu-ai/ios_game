import type { MatchConfig, MatchSnapshot, NetworkMessage, PlayerInput, Ruleset } from "../core/models";

export interface RoomClientOptions {
  roomCode: string;
  playerID: string;
  nickname: string;
  mapID: string;
  ruleset: Ruleset;
  targetPlayers: number;
}

export interface RoomClientEvents {
  status(message: string): void;
  start(config: MatchConfig): void;
  snapshot(snapshot: MatchSnapshot): void;
  close(message: string): void;
}

export class RoomClient {
  snapshot: MatchSnapshot | undefined;
  config: MatchConfig | undefined;
  private socket: WebSocket | undefined;

  constructor(
    private readonly options: RoomClientOptions,
    private readonly events: RoomClientEvents
  ) {}

  connect(): void {
    this.events.status(`正在连接房间 ${this.options.roomCode}...`);
    const socket = new WebSocket(roomURL(this.options));
    this.socket = socket;

    socket.addEventListener("open", () => {
      this.events.status(`已加入房间 ${this.options.roomCode}，等待玩家。`);
    });

    socket.addEventListener("message", (event) => {
      for (const message of decodeMessages(event.data)) {
        this.handleMessage(message);
      }
    });

    socket.addEventListener("close", () => {
      this.events.close("在线房间连接已关闭。");
    });

    socket.addEventListener("error", () => {
      this.events.status("在线房间连接失败。部署到 Cloudflare Worker 或使用 wrangler dev 后再试。");
    });
  }

  sendInput(input: PlayerInput): void {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      return;
    }
    this.socket.send(JSON.stringify({ type: "input", input } satisfies NetworkMessage));
  }

  close(): void {
    this.socket?.close();
    this.socket = undefined;
  }

  private handleMessage(message: NetworkMessage): void {
    if (message.type === "lobby") {
      this.events.status(`房间 ${message.roomCode}: ${message.playerCount}/${message.targetPlayers} 人`);
      return;
    }
    if (message.type === "start") {
      this.config = message.config;
      this.events.start(message.config);
      return;
    }
    if (message.type === "snapshot") {
      this.snapshot = message.snapshot;
      this.events.snapshot(message.snapshot);
      return;
    }
    if (message.type === "playerDisconnected") {
      this.events.status(`玩家 ${message.playerID} 已离线。`);
      return;
    }
    if (message.type === "error") {
      this.events.status(message.message);
    }
  }
}

function roomURL(options: RoomClientOptions): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = new URL(`${protocol}//${window.location.host}/api/rooms/${options.roomCode}`);
  url.searchParams.set("playerID", options.playerID);
  url.searchParams.set("nickname", options.nickname);
  url.searchParams.set("mapID", options.mapID);
  url.searchParams.set("ruleset", options.ruleset);
  url.searchParams.set("targetPlayers", String(options.targetPlayers));
  url.searchParams.set("seed", String(Date.now() % 100000));
  return url.toString();
}

function decodeMessages(data: unknown): NetworkMessage[] {
  if (typeof data !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(data) as NetworkMessage | NetworkMessage[];
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}
