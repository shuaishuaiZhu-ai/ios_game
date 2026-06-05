import { length, normalize, sub, type Vector2 } from "../../core/geometry";
import type { MatchSnapshot, PlayerInput } from "../../core/models";
import { BrowserInputState } from "./BrowserInputState";
import { KeyboardControls } from "./KeyboardControls";

export class InputComposer {
  private pointerAim: Vector2 = { x: 1, y: 0 };

  constructor(private readonly localPlayerID: string, private readonly state: BrowserInputState, private readonly keyboard: KeyboardControls) {}

  setPointerAimFromWorld(worldPoint: Vector2, snapshot: MatchSnapshot | undefined): void {
    const player = snapshot?.players.find((candidate) => candidate.id === this.localPlayerID);
    if (!player) return;
    this.pointerAim = normalize(sub(worldPoint, player.position));
    this.state.setAim(this.pointerAim);
  }

  build(snapshot: MatchSnapshot | undefined): PlayerInput {
    const keyboardMovement = this.keyboard.movement();
    const movement = length(keyboardMovement) > 0 ? keyboardMovement : this.state.movement;
    const aim = length(this.pointerAim) > 0.05 ? this.pointerAim : this.state.aim;
    const meleeAction = this.keyboard.meleeAction() ?? this.state.consumeMelee();
    const input: PlayerInput = {
      playerID: this.localPlayerID,
      movement,
      aim: length(aim) > 0.05 ? aim : { x: 1, y: 0 },
      firePressed: this.state.consumeFire() || this.keyboard.firePressed(),
      tick: snapshot?.tick ?? 0
    };
    if (this.state.consumeDash() || this.keyboard.dashPressed()) input.dashPressed = true;
    if (this.state.consumeRoll() || this.keyboard.rollPressed()) input.rollPressed = true;
    if (this.state.isShieldHeld() || this.keyboard.shieldPressed()) input.shieldPressed = true;
    if (meleeAction) input.meleeAction = meleeAction;
    return input;
  }
}
