import Phaser from "phaser";
import type { PlayerState } from "../../core/models";
import { fighterKeyForIndex, heldWeaponTextureKey } from "../assets";
import { DepthLayers } from "./DepthLayers";

export class PlayerRenderer {
  private sprites = new Map<string, Phaser.GameObjects.Image>();
  private heldWeapons = new Map<string, Phaser.GameObjects.Image>();
  private cameraTarget?: Phaser.GameObjects.Image;

  constructor(private readonly scene: Phaser.Scene, private readonly localPlayerID: string) {}

  render(players: PlayerState[]): void {
    const active = new Set<string>();
    const sorted = [...players].sort((a, b) => a.id.localeCompare(b.id));
    sorted.forEach((player, index) => {
      active.add(player.id);
      const isLocal = player.id === this.localPlayerID;
      const key = fighterKeyForIndex(isLocal ? 0 : index + 1);
      const sprite = this.sprites.get(player.id) ?? this.scene.add.image(player.position.x, player.position.y, key);
      sprite.setTexture(key).setPosition(player.position.x, player.position.y).setRotation(Math.atan2(player.facing.y, player.facing.x) + Math.PI / 2);
      sprite.setDisplaySize(74, 74).setDepth(DepthLayers.player + player.position.y / 10000).setAlpha(player.isEliminated ? 0.28 : player.invulnerabilityRemaining > 0 ? 0.58 : 1);
      this.sprites.set(player.id, sprite);
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
    for (const [id, sprite] of this.heldWeapons) if (!active.has(id)) { sprite.destroy(); this.heldWeapons.delete(id); }
  }
}
