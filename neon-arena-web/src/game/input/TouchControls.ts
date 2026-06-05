import { BrowserInputState } from "./BrowserInputState";

export class TouchControls {
  private root: HTMLElement;
  private state: BrowserInputState;
  private pointerID: number | undefined;
  private base!: HTMLElement;
  private knob!: HTMLElement;

  constructor(root: HTMLElement, state: BrowserInputState) {
    this.root = root;
    this.state = state;
  }

  mount(): void {
    this.root.innerHTML = "";
    const ribbon = document.createElement("div");
    ribbon.className = "status-ribbon";
    const pad = document.createElement("div");
    pad.className = "touch-pad";
    this.base = document.createElement("div");
    this.base.className = "joystick-base";
    this.knob = document.createElement("div");
    this.knob.className = "joystick-knob";
    pad.append(this.base, this.knob);
    const actions = document.createElement("div");
    actions.className = "action-pad";
    actions.append(
      this.button("action-button action-fire", () => this.state.queueFire()),
      this.button("action-button action-melee", () => this.state.queueMelee("punch")),
      this.button("action-button action-dash", () => this.state.queueDash()),
      this.button("action-button action-roll", () => this.state.queueRoll()),
      this.holdButton("action-button action-shield")
    );
    this.root.append(ribbon, pad, actions);
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

  private holdButton(className: string): HTMLButtonElement {
    const button = this.button(className, () => this.state.setShieldHeld(true));
    button.addEventListener("pointerup", () => this.state.setShieldHeld(false));
    button.addEventListener("pointercancel", () => this.state.setShieldHeld(false));
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
