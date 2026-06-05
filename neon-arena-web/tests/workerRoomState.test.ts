import { describe, expect, it } from "vitest";
import { RoomState } from "../src/worker/roomState";
import type { PlayerInput } from "../src/core/models";

describe("RoomState", () => {
  it("creates a lobby and starts when target players join", () => {
    const room = roomState(2);

    const first = room.join({ id: "p1", nickname: "One" });
    const second = room.join({ id: "p2", nickname: "Two" });

    expect(first.some((message) => message.type === "lobby")).toBe(true);
    expect(first.some((message) => message.type === "start")).toBe(false);
    expect(second.some((message) => message.type === "start")).toBe(true);
    expect(second.some((message) => message.type === "snapshot")).toBe(true);
  });

  it("rejects players after the room is full and running", () => {
    const room = roomState(2);
    room.join({ id: "p1", nickname: "One" });
    room.join({ id: "p2", nickname: "Two" });

    const extra = room.join({ id: "p3", nickname: "Three" });

    expect(extra).toEqual([{ type: "error", message: "比赛已经开始，不能中途加入。" }]);
  });

  it("broadcasts authoritative snapshots after input", () => {
    const room = roomState(2);
    room.join({ id: "p1", nickname: "One" });
    room.join({ id: "p2", nickname: "Two" });

    const messages = room.receiveInput(input("p1"), 1000);
    const snapshot = messages.find((message) => message.type === "snapshot");

    expect(snapshot?.type).toBe("snapshot");
    if (snapshot?.type === "snapshot") {
      expect(snapshot.snapshot.tick).toBeGreaterThan(0);
    }
  });

  it("allows same-player reconnect after disconnect", () => {
    const room = roomState(2);
    room.join({ id: "p1", nickname: "One" });
    room.join({ id: "p2", nickname: "Two" });

    const disconnect = room.leave("p2");
    const reconnect = room.join({ id: "p2", nickname: "Two" });

    expect(disconnect.some((message) => message.type === "playerDisconnected")).toBe(true);
    expect(reconnect.some((message) => message.type === "joined")).toBe(true);
    expect(reconnect.some((message) => message.type === "snapshot")).toBe(true);
  });

  it("supports four-player FFA rooms", () => {
    const room = roomState(4);
    room.join({ id: "p1", nickname: "One" });
    room.join({ id: "p2", nickname: "Two" });
    room.join({ id: "p3", nickname: "Three" });
    const messages = room.join({ id: "p4", nickname: "Four" });

    const start = messages.find((message) => message.type === "start");

    expect(start?.type).toBe("start");
    if (start?.type === "start") {
      expect(start.config.mode.kind).toBe("onlineFFA");
      expect(start.config.playerCount).toBe(4);
    }
  });
});

function roomState(targetPlayers: number): RoomState {
  return new RoomState({
    roomCode: "TEST01",
    mapID: "neon-grid",
    ruleset: "standard",
    targetPlayers,
    seed: 1
  });
}

function input(playerID: string): PlayerInput {
  return {
    playerID,
    movement: { x: 1, y: 0 },
    aim: { x: 1, y: 0 },
    firePressed: false,
    tick: 0
  };
}
