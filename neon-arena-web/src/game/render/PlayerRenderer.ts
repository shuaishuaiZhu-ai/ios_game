import Phaser from "phaser";
import type { CombatEvent, PlayerState } from "../../core/models";
import { fighterSheetKeyForIndex, heldWeaponTextureKey } from "../assets";
import { DepthLayers } from "./DepthLayers";

export class PlayerRenderer {
  private sprites = new Map<string, Phaser.GameObjects.Sprite>();
  private shadows = new Map<string, Phaser.GameObjects.Ellipse>();
  private auras = new Map<string, Phaser.GameObjects.Ellipse>();
  private heldWeapons = new Map<string, Phaser.GameObjects.Image>();
  private previousPositions = new Map<string, { x: number; y: number }>();
  private previousHealth = new Map<string, number>();
  private cameraTarget?: Phaser.GameObjects.Sprite;

  constructor(private readonly scene: Phaser.Scene, private readonly localPlayerID: string) {}

  render(players: PlayerState[], events: CombatEvent[]): void {
    const active = new Set<string>();
    const attacking = new Set<string>();
    const hit = new Set<string>();
    for (const event of events) {
      if (event.type === "melee-swing" || event.type === "projectile-fired" || event.type === "shield-block") attacking.add(event.playerID);
      if ((event.type === "melee-hit" || event.type === "projectile-hit") && event.targetID) hit.add(event.targetID);
    }
    const sorted = [...players].sort((a, b) => a.id.localeCompare(b.id));
    sorted.forEach((player, index) => {
      active.add(player.id);
      const isLocal = player.id === this.localPlayerID;
      const key = fighterSheetKeyForIndex(isLocal ? 0 : index + 1);
      const sprite = this.sprites.get(player.id) ?? this.scene.add.sprite(player.position.x, player.position.y, key);
      const shadow = this.shadows.get(player.id) ?? this.scene.add.ellipse(player.position.x, player.position.y + 28, 58, 20, 0x000000, 0.34);
      const auraColor = playerColor(index);
      const aura = this.auras.get(player.id) ?? this.scene.add.ellipse(player.position.x, player.position.y + 24, 64, 22, auraColor, 0.18);
      const previous = this.previousPositions.get(player.id);
      const previousHealth = this.previousHealth.get(player.id);
      const moved = previous ? Math.hypot(player.position.x - previous.x, player.position.y - previous.y) > 1.2 : false;
      const frame = this.frameFor(player, moved, attacking.has(player.id), hit.has(player.id) || (previousHealth !== undefined && player.health < previousHealth));
      this.previousPositions.set(player.id, { ...player.position });
      this.previousHealth.set(player.id, player.health);
      shadow.setPosition(player.position.x, player.position.y + 30).setDepth(DepthLayers.playerShadow + player.position.y / 10000);
      shadow.setScale(player.isEliminated ? 0.8 : moved ? 1.08 : 1, player.isEliminated ? 0.78 : 1).setAlpha(player.isEliminated ? 0.12 : 0.34);
      aura.setPosition(player.position.x, player.position.y + 24).setDepth(DepthLayers.playerShadow + 0.1 + player.position.y / 10000);
      aura.setFillStyle(auraColor, player.isEliminated ? 0.05 : 0.18).setStrokeStyle(isLocal ? 4 : 3, auraColor, player.isEliminated ? 0.15 : 0.78);
      sprite.setTexture(key).setFrame(frame).setPosition(player.position.x, player.position.y);
      sprite.setRotation(0).setFlipX(player.facing.x < -0.12);
      sprite.setDisplaySize(isLocal ? 86 : 80, isLocal ? 86 : 80).setDepth(DepthLayers.player + player.position.y / 10000);
      sprite.setAlpha(player.isEliminated ? 0.28 : player.invulnerabilityRemaining > 0 ? 0.58 : 1);
      this.sprites.set(player.id, sprite);
      this.shadows.set(player.id, shadow);
      this.auras.set(player.id, aura);
      if (player.weaponID) {
        const weaponKey = heldWeaponTextureKey(player.weaponID);
        const held = this.heldWeapons.get(player.id) ?? this.scene.add.image(player.position.x, player.position.y, weaponKey);
        held.setTexture(weaponKey).setPosition(player.position.x + player.facing.x * 35, player.position.y + player.facing.y * 35);
        held.setRotation(Math.atan2(player.facing.y, player.facing.x)).setDisplaySize(58, 38).setDepth(sprite.depth + 0.01).setAlpha(sprite.alpha);
        this.heldWeapons.set(player.id, held);
      } else {
        this.heldWeapons.get(player.id)?.destroy();
        this.heldWeapons.delete(player.id);
      }
      if (isLocal && this.cameraTarget !== sprite) {
        this.cameraTarget = sprite;
        this.scene.cameras.main.startFollow(sprite, true, 0.11, 0.11);
      }
    });
    for (const [id, sprite] of this.sprites) if (!active.has(id)) { sprite.destroy(); this.sprites.delete(id); }
    for (const [id, shadow] of this.shadows) if (!active.has(id)) { shadow.destroy(); this.shadows.delete(id); }
    for (const [id, aura] of this.auras) if (!active.has(id)) { aura.destroy(); this.auras.delete(id); }
    for (const [id, sprite] of this.heldWeapons) if (!active.has(id)) { sprite.destroy(); this.heldWeapons.delete(id); }
    for (const id of [...this.previousPositions.keys()]) if (!active.has(id)) this.previousPositions.delete(id);
    for (const id of [...this.previousHealth.keys()]) if (!active.has(id)) this.previousHealth.delete(id);
  }

  private frameFor(player: PlayerState, moved: boolean, attacking: boolean, hit: boolean): number {
    if (hit) return 3;
    if (attacking || player.cooldownRemaining > 0.04 || player.shieldRemaining > 0) return 2;
    if (moved) return 1;
    return 0;
  }
}

function playerColor(index: number): number {
  const colors = [0xff4a36, 0x27a8ff, 0x9b54ff, 0x65e84e];
  return colors[index % colors.length]!;
}
