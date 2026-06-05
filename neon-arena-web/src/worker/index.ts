import { DurableObject } from "cloudflare:workers";
import type { NetworkMessage, Ruleset } from "../core/models";
import { normalizeRoomCode, RoomState } from "./roomState";

export interface Env {
  NEON_ROOM: DurableObjectNamespace;
  ASSETS: Fetcher;
}

interface SocketAttachment {
  playerID: string;
  nickname: string;
}

interface RoomInit {
  roomCode: string;
  mapID: string;
  ruleset: Ruleset;
  targetPlayers: number;
  seed: number;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "neon-arena-room-worker" });
    }

    const roomMatch = /^\/api\/rooms\/([A-Z0-9]{1,8})$/i.exec(url.pathname);
    if (roomMatch) {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected WebSocket", { status: 426 });
      }

      const roomCode = normalizeRoomCode(roomMatch[1]!);
      const stub = env.NEON_ROOM.getByName(roomCode);
      const roomURL = new URL(request.url);
      roomURL.searchParams.set("roomCode", roomCode);
      return stub.fetch(new Request(roomURL, request));
    }

    return env.ASSETS.fetch(request);
  }
} satisfies ExportedHandler<Env>;

export class NeonRoom extends DurableObject<Env> {
  private room: RoomState | undefined;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const url = new URL(request.url);
    const playerID = cleanID(url.searchParams.get("playerID") ?? "");
    const nickname = cleanNickname(url.searchParams.get("nickname") ?? "Player");
    if (!playerID) {
      return json({ error: "Missing playerID" }, 400);
    }

    const init = roomInitFromURL(url);
    if (!this.room) {
      this.room = new RoomState(init);
    }

    const messages = this.room.join({ id: playerID, nickname });
    if (messages.some((message) => message.type === "error")) {
      return json({ error: "Room unavailable" }, 409);
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.serializeAttachment({ playerID, nickname } satisfies SocketAttachment);
    this.ctx.acceptWebSocket(server);

    server.send(encodeMessages(messages.filter((message) => message.type === "joined")));
    this.broadcast(messages.filter((message) => message.type !== "joined"));

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (!this.room || typeof message !== "string") {
      return;
    }

    const decoded = parseMessage(message);
    if (!decoded) {
      ws.send(encode({ type: "error", message: "消息格式错误。" }));
      return;
    }

    if (decoded.type === "input") {
      const updates = this.room.receiveInput(decoded.input);
      this.broadcast(updates);
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    const attachment = ws.deserializeAttachment() as SocketAttachment | undefined;
    if (attachment && this.room) {
      this.broadcast(this.room.leave(attachment.playerID));
    }
    ws.close(code, reason);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    const attachment = ws.deserializeAttachment() as SocketAttachment | undefined;
    if (attachment && this.room) {
      this.broadcast(this.room.leave(attachment.playerID));
    }
  }

  private broadcast(messages: NetworkMessage[]): void {
    if (messages.length === 0) {
      return;
    }

    const payload = encodeMessages(messages);
    for (const socket of this.ctx.getWebSockets()) {
      socket.send(payload);
    }
  }
}

function roomInitFromURL(url: URL): RoomInit {
  const ruleset = url.searchParams.get("ruleset") === "meleeOnly" ? "meleeOnly" : "standard";
  return {
    roomCode: normalizeRoomCode(url.searchParams.get("roomCode") ?? "ROOM"),
    mapID: url.searchParams.get("mapID") ?? "neon-grid",
    ruleset,
    targetPlayers: Number(url.searchParams.get("targetPlayers") ?? 2),
    seed: Number(url.searchParams.get("seed") ?? Date.now() % 100000)
  };
}

function cleanID(value: string): string {
  return value.replace(/[^a-z0-9_-]/gi, "").slice(0, 32);
}

function cleanNickname(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, 18) || "Player";
}

function encode(message: NetworkMessage): string {
  return JSON.stringify(message);
}

function encodeMessages(messages: NetworkMessage[]): string {
  return JSON.stringify(messages);
}

function parseMessage(value: string): NetworkMessage | undefined {
  try {
    return JSON.parse(value) as NetworkMessage;
  } catch {
    return undefined;
  }
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
