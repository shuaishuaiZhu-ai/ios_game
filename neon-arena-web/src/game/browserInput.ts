import { length, normalize, type Vector2, zeroVector } from "../core/geometry";
import type { MeleeAction } from "../core/models";

export type CombatAction = "fire" | "dash" | "roll" | MeleeAction;

export class BrowserInputState {
  movement: Vector2 = { ...zeroVector };
  aim: Vector2 = { x: 1, y: 0 };
  private actions = new Set<CombatAction>();

  setMovement(value: Vector2): void {
    this.movement = length(value) > 1 ? normalize(value) : value;
    if (length(this.movement) > 0.05) {
      this.aim = normalize(this.movement);
    }
  }

  setAim(value: Vector2): void {
    if (length(value) > 0.05) {
      this.aim = normalize(value);
    }
  }

  press(action: CombatAction): void {
    this.actions.add(action);
  }

  consumeFire(): boolean {
    const hasFire = this.actions.has("fire");
    this.actions.delete("fire");
    return hasFire;
  }

  consumeDash(): boolean {
    const hasDash = this.actions.has("dash");
    this.actions.delete("dash");
    return hasDash;
  }

  consumeRoll(): boolean {
    const hasRoll = this.actions.has("roll");
    this.actions.delete("roll");
    return hasRoll;
  }

  consumeMelee(): MeleeAction | undefined {
    for (const action of ["throw", "flyingKick", "punch"] as const) {
      if (this.actions.has(action)) {
        this.actions.delete(action);
        return action;
      }
    }
    return undefined;
  }
}

export function attachTouchControls(root: HTMLElement, input: BrowserInputState): void {
  const stick = root.querySelector<HTMLElement>("#move-stick");
  const knob = root.querySelector<HTMLElement>("#move-stick span");
  if (!stick || !knob) {
    return;
  }

  let activePointer = -1;

  stick.addEventListener("pointerdown", (event) => {
    activePointer = event.pointerId;
    stick.setPointerCapture(event.pointerId);
    updateStick(event);
  });

  stick.addEventListener("pointermove", (event) => {
    if (event.pointerId === activePointer) {
      updateStick(event);
    }
  });

  const release = (event: PointerEvent) => {
    if (event.pointerId !== activePointer) {
      return;
    }
    activePointer = -1;
    input.setMovement({ ...zeroVector });
    knob.style.transform = "translate(0, 0)";
  };

  stick.addEventListener("pointerup", release);
  stick.addEventListener("pointercancel", release);

  for (const button of root.querySelectorAll<HTMLButtonElement>(".combat button[data-action]")) {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      input.press(button.dataset.action as CombatAction);
    });
  }

  function updateStick(event: PointerEvent): void {
    const box = stick!.getBoundingClientRect();
    const center = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    const offset = { x: event.clientX - center.x, y: event.clientY - center.y };
    const radius = box.width / 2;
    const movement = {
      x: Math.max(-1, Math.min(1, offset.x / radius)),
      y: Math.max(-1, Math.min(1, offset.y / radius))
    };
    const normalized = length(movement) > 1 ? normalize(movement) : movement;
    input.setMovement(normalized);
    knob!.style.transform = `translate(${normalized.x * 38}px, ${normalized.y * 38}px)`;
  }
}
