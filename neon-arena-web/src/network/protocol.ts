import type { NetworkMessage } from "../core/models";

export function encodeMessage(message: NetworkMessage): string {
  return JSON.stringify(message);
}

export function decodeMessage(payload: string): NetworkMessage | undefined {
  try {
    const message = JSON.parse(payload) as NetworkMessage;
    return typeof message === "object" && message !== null && "type" in message ? message : undefined;
  } catch {
    return undefined;
  }
}
