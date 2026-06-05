import type { MatchSnapshot, PlayerInput } from "../../core/models";
import type { GameSession } from "../../core/gameSession";
import type { AIController } from "../../core/aiController";
import type { MapDefinition } from "../../core/models";

export type SceneDriver =
  | { kind: "single"; session: GameSession; aiControllers: AIController[] }
  | { kind: "online"; getSnapshot: () => MatchSnapshot | undefined; sendInput: (input: PlayerInput) => void };

export class SceneDriverController {
  private lastNetworkSend = 0;
  constructor(private readonly driver: SceneDriver, private readonly map: MapDefinition) {}

  currentSnapshot(): MatchSnapshot | undefined {
    if (this.driver.kind === "single") return this.driver.session.snapshot();
    return this.driver.getSnapshot();
  }

  update(time: number, delta: number, localInput: PlayerInput): MatchSnapshot | undefined {
    if (this.driver.kind === "single") {
      const snapshot = this.driver.session.snapshot();
      const aiInputs = this.driver.aiControllers.map((ai) => ai.input(snapshot, this.map));
      this.driver.session.step([localInput, ...aiInputs], Math.min(delta / 1000, 0.1));
    } else if (
      time - this.lastNetworkSend > 50 ||
      localInput.firePressed ||
      localInput.meleeAction ||
      localInput.dashPressed ||
      localInput.rollPressed ||
      localInput.shieldPressed
    ) {
      this.driver.sendInput(localInput);
      this.lastNetworkSend = time;
    }
    return this.currentSnapshot();
  }
}
