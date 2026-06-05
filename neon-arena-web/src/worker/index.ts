import { decodeMessage, encodeMessage } from "../network/protocol";
import { RoomState } from "./roomState";
import type { NetworkMessage, Ruleset } from "../core/models";

export interface Env {
  ROOMS: DurableObjectNamespace;
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") return Response.json({ ok: true });
    const match = url.pathname.match(/^\/api\/rooms\/([^/]+)$/);
    if (match) {
      const roomCode = match[1]!;
      const id = env.ROOMS.idFromName(roomCode);
      return env.ROOMS.get(id).fetch(request);
    }
    return env.ASSETS.fetch(request);
  }
};

export class NeonArenaRoom {
  private state: RoomState | undefined;
  private sockets = new Set<WebSocket>();

  constructor(private readonly durableState: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const upgrade = request.headers.get("Upgrade");
    if (upgrade !== "websocket") return new Response("Expected websocket", { status: 426 });
    const url = new URL(request.url);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    this.sockets.add(server);
    const roomCode = url.pathname.split("/").pop() ?? "ROOM";
    const mapID = url.searchParams.get("map") ?? "map01_skyline_garden_ruins";
    const targetPlayers = Number(url.searchParams.get("players") ?? 2);
    const ruleset = (url.searchParams.get("ruleset") ?? "standard") as Ruleset;
    this.state ??= new RoomState({ roomCode, mapID, ruleset, targetPlayers, seed: 1 });
    server.addEventListener("message", (event) => this.handle(server, String(event.data)));
    server.addEventListener("close", () => this.sockets.delete(server));
    server.addEventListener("error", () => this.sockets.delete(server));
    return new Response(null, { status: 101, webSocket: client });
  }

  private handle(socket: WebSocket, payload: string): void {
    const message = decodeMessage(payload);
    if (!message || !this.state) return;
    let responses: NetworkMessage[] = [];
    if (message.type === "join") responses = this.state.join({ id: message.playerID, nickname: message.nickname });
    else if (message.type === "input") responses = this.state.receiveInput(message.input);
    if (responses.length > 0) this.broadcast(responses);
  }

  private broadcast(messages: NetworkMessage[]): void {
    for (const socket of this.sockets) {
      for (const message of messages) socket.send(encodeMessage(message));
    }
  }
}

export class NeonRoom extends NeonArenaRoom {}
