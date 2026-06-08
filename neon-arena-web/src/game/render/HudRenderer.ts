import Phaser from "phaser";
import type { MapDefinition, MatchSnapshot, PlayerState } from "../../core/models";
import { fighterPortraitKeyForIndex } from "../assets";
import { DepthLayers } from "./DepthLayers";

function color(hex: string): number {
  return Number.parseInt(hex.replace("#", ""), 16);
}

const PLAYER_COLORS = ["#ff4a36", "#27a8ff", "#9b54ff", "#65e84e"];

export class HudRenderer {
  private portraits = new Map<string, Phaser.GameObjects.Image>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly graphics: Phaser.GameObjects.Graphics,
    private readonly localPlayerID: string,
    private readonly map: MapDefinition
  ) {
    this.graphics.setScrollFactor(0).setDepth(DepthLayers.hud);
  }

  render(snapshot: MatchSnapshot | undefined): void {
    if (!snapshot) return;
    const players = [...snapshot.players].sort((a, b) => a.id.localeCompare(b.id));
    this.drawRoster(players);
    this.drawMinimap(snapshot, players);
    this.destroyMissingPortraits(players);
  }

  private drawRoster(players: PlayerState[]): void {
    players.slice(0, 4).forEach((player, index) => {
      const y = 16 + index * 50;
      const accent = color(PLAYER_COLORS[index % PLAYER_COLORS.length]!);
      this.graphics.fillStyle(0x05070d, player.isEliminated ? 0.38 : 0.72).fillRoundedRect(12, y, 170, 42, 5);
      this.graphics.lineStyle(player.id === this.localPlayerID ? 2 : 1, accent, player.isEliminated ? 0.32 : 0.9).strokeRoundedRect(12, y, 170, 42, 5);
      this.graphics.fillStyle(accent, player.isEliminated ? 0.24 : 0.86).fillCircle(31, y + 21, 18);

      const portrait = this.portraits.get(player.id) ?? this.scene.add.image(31, y + 21, fighterPortraitKeyForIndex(index));
      portrait.setScrollFactor(0).setDepth(DepthLayers.hud + 1).setPosition(31, y + 21).setDisplaySize(36, 36).setAlpha(player.isEliminated ? 0.36 : 1);
      this.portraits.set(player.id, portrait);

      const health = Phaser.Math.Clamp(player.health / 100, 0, 1);
      this.graphics.fillStyle(0x11131d, 0.9).fillRoundedRect(55, y + 10, 112, 10, 5);
      this.graphics.fillStyle(accent, player.isEliminated ? 0.2 : 0.96).fillRoundedRect(55, y + 10, 112 * health, 10, 5);
      for (let segment = 0; segment < 7; segment++) {
        this.graphics.lineStyle(1, 0x05070d, 0.85).lineBetween(55 + segment * 16, y + 10, 55 + segment * 16, y + 20);
      }
      const energy = Phaser.Math.Clamp(1 - player.cooldownRemaining / 0.8, 0, 1);
      this.graphics.fillStyle(0x25e9ff, player.isEliminated ? 0.18 : 0.85).fillRoundedRect(55, y + 26, 70 * energy, 6, 3);
    });
  }

  private drawMinimap(snapshot: MatchSnapshot, players: PlayerState[]): void {
    const radius = 62;
    const x = this.scene.scale.width - radius - 20;
    const y = radius + 18;
    this.graphics.fillStyle(0x090a0f, 0.66).fillCircle(x, y, radius);
    this.graphics.lineStyle(2, color(this.map.art.accent), 0.76).strokeCircle(x, y, radius);
    this.graphics.lineStyle(1, 0xffc16a, 0.26).strokeCircle(x, y, radius - 10);

    const safeScale = radius / Math.max(this.map.size.x, this.map.size.y);
    this.graphics.lineStyle(2, color(this.map.art.accent), 0.46).strokeCircle(
      x + (snapshot.safeZone.center.x - this.map.size.x / 2) * safeScale,
      y + (snapshot.safeZone.center.y - this.map.size.y / 2) * safeScale,
      snapshot.safeZone.radius * safeScale
    );

    players.slice(0, 4).forEach((player, index) => {
      const dotX = x + (player.position.x - this.map.size.x / 2) * safeScale;
      const dotY = y + (player.position.y - this.map.size.y / 2) * safeScale;
      this.graphics.fillStyle(color(PLAYER_COLORS[index % PLAYER_COLORS.length]!), player.isEliminated ? 0.24 : 1).fillCircle(dotX, dotY, 5);
    });
  }

  private destroyMissingPortraits(players: PlayerState[]): void {
    const active = new Set(players.map((player) => player.id));
    for (const [id, portrait] of this.portraits) {
      if (!active.has(id)) {
        portrait.destroy();
        this.portraits.delete(id);
      }
    }
  }
}
