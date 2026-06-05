import Phaser from "phaser";
import type { MatchSnapshot, PlayerState } from "../../core/models";
import { add, scale } from "../../core/geometry";
import { hitRadius, playerRadius } from "../../core/gameSession";
import { DepthLayers } from "./DepthLayers";

function color(hex: string): number { return Number.parseInt(hex.replace("#", ""), 16); }

export class HudRenderer {
  constructor(private readonly graphics: Phaser.GameObjects.Graphics, private readonly localPlayerID: string) {}

  render(snapshot: MatchSnapshot | undefined): void {
    for (const player of snapshot?.players ?? []) this.drawPlayer(player);
  }

  private drawPlayer(player: PlayerState): void {
    const isLocal = player.id === this.localPlayerID;
    const ring = isLocal ? "#00e5ff" : "#ff4fd8";
    this.graphics.setDepth(DepthLayers.playerUi);
    this.graphics.lineStyle(isLocal ? 4 : 2, color(ring), player.isEliminated ? 0.15 : 0.85).strokeCircle(player.position.x, player.position.y + 8, playerRadius + 18);
    this.graphics.fillStyle(color("#08111d"), 0.78).fillRoundedRect(player.position.x - 34, player.position.y - 56, 68, 8, 4);
    this.graphics.fillStyle(color(player.health > 35 ? "#6dff5f" : "#ff4f6a"), 0.95).fillRoundedRect(player.position.x - 34, player.position.y - 56, 68 * Math.max(0, player.health / 100), 8, 4);
    const aimEnd = add(player.position, scale(player.facing, hitRadius + 30));
    this.graphics.lineStyle(3, color(ring), 0.58).lineBetween(player.position.x, player.position.y, aimEnd.x, aimEnd.y);
    if (player.shieldRemaining > 0) this.graphics.lineStyle(5, color("#ffb02e"), 0.72).strokeCircle(player.position.x, player.position.y, playerRadius + 28);
  }
}
