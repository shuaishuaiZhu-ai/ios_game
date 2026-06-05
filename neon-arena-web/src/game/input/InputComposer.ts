import { length, normalize, sub, type Vector2 } from "../../core/geometry";
import { canUseDisplacement, canUseWeapons, type MatchSnapshot, type PlayerInput, type Ruleset } from "../../core/models";
import { BrowserInputState } from "./BrowserInputState";
import { KeyboardControls } from "./KeyboardControls";

export class InputComposer {
  private pointerAim: Vector2 = { x: 1, y: 0 };

  constructor(
    private readonly localPlayerID: string,
    private readonly state: BrowserInputState,
    private readonly keyboard: KeyboardControls,
    private readonly ruleset: Ruleset
  ) {}

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
    const weaponsEnabled = canUseWeapons(this.ruleset);
    const displacementEnabled = canUseDisplacement(this.ruleset);
    const firePressed = this.state.consumeFire() || this.keyboard.firePressed();
    const dashPressed = this.state.consumeDash() || this.keyboard.dashPressed();
    const rollPressed = this.state.consumeRoll() || this.keyboard.rollPressed();
    const input: PlayerInput = {
      playerID: this.localPlayerID,
      movement,
      aim: length(aim) > 0.05 ? aim : { x: 1, y: 0 },
      firePressed: weaponsEnabled && firePressed,
      tick: snapshot?.tick ?? 0
    };
    if (displacementEnabled && dashPressed) input.dashPressed = true;
    if (displacementEnabled && rollPressed) input.rollPressed = true;
    if (weaponsEnabled && (this.state.isShieldHeld() || this.keyboard.shieldPressed())) input.shieldPressed = true;
    if (meleeAction) input.meleeAction = meleeAction;
    return input;
  }
}
