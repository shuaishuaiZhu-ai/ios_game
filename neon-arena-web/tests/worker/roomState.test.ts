import { describe, expect, it } from "vitest";
import { RoomState } from "../../src/worker/roomState";
import type { PlayerInput } from "../../src/core/models";

describe("RoomState", () => {
  it("creates 2-player rooms and broadcasts snapshots with events", () => {
    const room = roomState(2);
    room.join({ id: "p1", nickname: "One" });
    const messages = room.join({ id: "p2", nickname: "Two" });
    expect(messages.some((message) => message.type === "start")).toBe(true);
    expect(messages.some((message) => message.type === "snapshot")).toBe(true);
    const afterInput = room.receiveInput(input("p1"), 1000);
    const snapshot = afterInput.find((message) => message.type === "snapshot");
    expect(snapshot?.type).toBe("snapshot");
    if (snapshot?.type === "snapshot") expect(Array.isArray(snapshot.events)).toBe(true);
  });

  it("supports 3 and 4 player FFA rooms", () => {
    for (const count of [3, 4]) {
      const room = roomState(count);
      for (let index = 1; index <= count - 1; index++) room.join({ id: `p${index}`, nickname: `${index}` });
      const messages = room.join({ id: `p${count}`, nickname: `${count}` });
      const start = messages.find((message) => message.type === "start");
      expect(start?.type).toBe("start");
      if (start?.type === "start") expect(start.config.mode.kind).toBe("onlineFFA");
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

  it("keeps melee-only rooms from spawning ranged weapons", () => {
    const room = new RoomState({ roomCode: "TEST01", mapID: "map01_skyline_garden_ruins", ruleset: "meleeOnly", targetPlayers: 2, seed: 1 });
    room.join({ id: "p1", nickname: "One" });
    room.join({ id: "p2", nickname: "Two" });
    expect(room.session?.droppedWeapons).toHaveLength(0);
  });
});

function roomState(targetPlayers: number): RoomState {
  return new RoomState({ roomCode: "TEST01", mapID: "map01_skyline_garden_ruins", ruleset: "standard", targetPlayers, seed: 1 });
}

function input(playerID: string): PlayerInput {
  return { playerID, movement: { x: 1, y: 0 }, aim: { x: 1, y: 0 }, firePressed: false, tick: 0 };
}
