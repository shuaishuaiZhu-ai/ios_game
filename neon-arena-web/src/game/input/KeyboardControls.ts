import Phaser from "phaser";
import { normalize, type Vector2, zeroVector } from "../../core/geometry";
import type { MeleeAction } from "../../core/models";

export class KeyboardControls {
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};

  constructor(private readonly scene: Phaser.Scene) {}

  create(): void {
    this.keys = (this.scene.input.keyboard?.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      Up: Phaser.Input.Keyboard.KeyCodes.UP,
      Left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      Down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      Right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      Shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      Ctrl: Phaser.Input.Keyboard.KeyCodes.CTRL,
      Q: Phaser.Input.Keyboard.KeyCodes.Q,
      E: Phaser.Input.Keyboard.KeyCodes.E,
      R: Phaser.Input.Keyboard.KeyCodes.R,
      F: Phaser.Input.Keyboard.KeyCodes.F
    }) ?? {}) as Record<string, Phaser.Input.Keyboard.Key>;
  }

  movement(): Vector2 {
    const x = Number(this.keys.D?.isDown || this.keys.Right?.isDown) - Number(this.keys.A?.isDown || this.keys.Left?.isDown);
    const y = Number(this.keys.S?.isDown || this.keys.Down?.isDown) - Number(this.keys.W?.isDown || this.keys.Up?.isDown);
    const movement = { x, y };
    return Math.hypot(x, y) > 0 ? normalize(movement) : { ...zeroVector };
  }

  firePressed(): boolean { return this.keys.Space?.isDown === true; }
  dashPressed(): boolean { return this.keys.Shift?.isDown === true; }
  rollPressed(): boolean { return this.keys.Ctrl?.isDown === true; }
  shieldPressed(): boolean { return this.keys.F?.isDown === true; }

  meleeAction(): MeleeAction | undefined {
    if (this.keys.R && Phaser.Input.Keyboard.JustDown(this.keys.R)) return "throw";
    if (this.keys.E && Phaser.Input.Keyboard.JustDown(this.keys.E)) return "flyingKick";
    if (this.keys.Q && Phaser.Input.Keyboard.JustDown(this.keys.Q)) return "punch";
    return undefined;
  }
}
