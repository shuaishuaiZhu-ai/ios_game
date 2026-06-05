import Phaser from "phaser";
import type { CombatEvent, WeaponID } from "../../core/models";
import { DepthLayers } from "./DepthLayers";

export class VfxSystem {
  constructor(private readonly scene: Phaser.Scene) {}

  play(events: CombatEvent[]): void {
    for (const event of events) {
      if (event.type === "melee-swing") this.slash(event.position.x, event.position.y, Math.atan2(event.facing.y, event.facing.x), event.weaponID);
      else if (event.type === "projectile-hit" || event.type === "melee-hit") this.spark(event.position.x, event.position.y);
      else if (event.type === "dash" || event.type === "roll") this.afterimage(event.from.x, event.from.y, event.to.x, event.to.y);
      else if (event.type === "pickup" || event.type === "shield-block" || event.type === "safe-zone-phase") this.pulse("fx-hit-spark", event.type === "safe-zone-phase" ? 800 : event.position.x, event.type === "safe-zone-phase" ? 550 : event.position.y, event.type === "safe-zone-phase" ? 220 : 92);
    }
  }

  private slash(x: number, y: number, angle: number, weaponID?: WeaponID): void {
    const key = weaponID === "energy-shield-baton" ? "fx-melee-orange" : weaponID === "neon-katana" ? "fx-melee-pink" : "fx-melee-teal";
    const img = this.scene.add.image(x, y, key).setRotation(angle).setDepth(DepthLayers.vfx).setDisplaySize(150, 150).setAlpha(0.9);
    this.scene.tweens.add({ targets: img, alpha: 0, scale: 1.2, duration: 180, onComplete: () => img.destroy() });
  }

  private spark(x: number, y: number): void { this.pulse("fx-hit-spark", x, y, 88); }

  private afterimage(x1: number, y1: number, x2: number, y2: number): void {
    const line = this.scene.add.line(0, 0, x1, y1, x2, y2, 0x00e5ff, 0.42).setOrigin(0).setDepth(DepthLayers.vfx);
    this.scene.tweens.add({ targets: line, alpha: 0, duration: 180, onComplete: () => line.destroy() });
  }

  private pulse(key: string, x: number, y: number, size: number): void {
    const img = this.scene.add.image(x, y, key).setDepth(DepthLayers.vfx).setDisplaySize(size, size).setAlpha(0.88);
    this.scene.tweens.add({ targets: img, alpha: 0, scale: 1.45, duration: 220, onComplete: () => img.destroy() });
  }
}
