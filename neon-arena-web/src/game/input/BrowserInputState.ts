import { normalize, type Vector2 } from "../../core/geometry";
import type { MeleeAction } from "../../core/models";

export class BrowserInputState {
  movement: Vector2 = { x: 0, y: 0 };
  aim: Vector2 = { x: 1, y: 0 };
  private fireQueued = false;
  private dashQueued = false;
  private rollQueued = false;
  private shieldHeld = false;
  private meleeQueued: MeleeAction | undefined;

  setMovement(value: Vector2): void {
    this.movement = normalize(value);
    if (Math.hypot(this.movement.x, this.movement.y) > 0.05) this.aim = this.movement;
  }

  setAim(value: Vector2): void {
    const aim = normalize(value);
    if (Math.hypot(aim.x, aim.y) > 0.05) this.aim = aim;
  }

  queueFire(): void { this.fireQueued = true; }
  queueDash(): void { this.dashQueued = true; }
  queueRoll(): void { this.rollQueued = true; }
  queueMelee(action: MeleeAction): void { this.meleeQueued = action; }
  setShieldHeld(value: boolean): void { this.shieldHeld = value; }

  consumeFire(): boolean { const value = this.fireQueued; this.fireQueued = false; return value; }
  consumeDash(): boolean { const value = this.dashQueued; this.dashQueued = false; return value; }
  consumeRoll(): boolean { const value = this.rollQueued; this.rollQueued = false; return value; }
  consumeMelee(): MeleeAction | undefined { const value = this.meleeQueued; this.meleeQueued = undefined; return value; }
  isShieldHeld(): boolean { return this.shieldHeld; }
}
