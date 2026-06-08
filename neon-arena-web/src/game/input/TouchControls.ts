import { BrowserInputState } from "./BrowserInputState";
import { canUseDisplacement, canUseWeapons, type Ruleset } from "../../core/models";

export interface TouchControlsOptions {
  ruleset: Ruleset;
}

export class TouchControls {
  private root: HTMLElement;
  private state: BrowserInputState;
  private options: TouchControlsOptions;
  private pointerID: number | undefined;
  private base!: HTMLElement;
  private knob!: HTMLElement;

  constructor(root: HTMLElement, state: BrowserInputState, options: TouchControlsOptions) {
    this.root = root;
    this.state = state;
    this.options = options;
  }

  mount(): void {
    this.root.innerHTML = "";
    const pad = document.createElement("div");
    pad.className = "touch-pad";
    this.base = document.createElement("div");
    this.base.className = "joystick-base";
    this.knob = document.createElement("div");
    this.knob.className = "joystick-knob";
    pad.append(this.base, this.knob);
    const actions = document.createElement("div");
    actions.className = "action-pad";
    if (canUseWeapons(this.options.ruleset)) actions.append(this.button("action-button action-fire", () => this.state.queueFire()));
    actions.append(this.button("action-button action-melee", () => this.state.queueMelee("punch")));
    if (canUseDisplacement(this.options.ruleset)) {
      actions.append(
        this.button("action-button action-dash", () => this.state.queueDash()),
        this.button("action-button action-roll", () => this.state.queueRoll())
      );
    }
    this.root.append(pad, actions);
    pad.addEventListener("pointerdown", (event) => this.startJoystick(event));
    pad.addEventListener("pointermove", (event) => this.moveJoystick(event));
    pad.addEventListener("pointerup", (event) => this.stopJoystick(event));
    pad.addEventListener("pointercancel", (event) => this.stopJoystick(event));
  }

  destroy(): void {
    this.root.innerHTML = "";
  }

  private button(className: string, onPress: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = className;
    button.type = "button";
    button.setAttribute("aria-label", "");
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      onPress();
      button.classList.add("pressed");
    });
    button.addEventListener("pointerup", () => button.classList.remove("pressed"));
    button.addEventListener("pointercancel", () => button.classList.remove("pressed"));
    return button;
  }

  private startJoystick(event: PointerEvent): void {
    if (this.pointerID !== undefined) return;
    this.pointerID = event.pointerId;
    this.base.setPointerCapture(event.pointerId);
    this.moveJoystick(event);
  }

  private moveJoystick(event: PointerEvent): void {
    if (this.pointerID !== event.pointerId) return;
    const rect = this.base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const len = Math.hypot(dx, dy);
    const max = rect.width * 0.32;
    const scale = len > max ? max / len : 1;
    this.knob.style.transform = `translate(${dx * scale}px, ${dy * scale}px)`;
    this.state.setMovement({ x: dx / max, y: dy / max });
  }

  private stopJoystick(event: PointerEvent): void {
    if (this.pointerID !== event.pointerId) return;
    this.pointerID = undefined;
    this.state.setMovement({ x: 0, y: 0 });
    this.knob.style.transform = "translate(0px, 0px)";
  }
}
