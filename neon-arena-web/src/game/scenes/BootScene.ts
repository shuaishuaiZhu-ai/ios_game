import Phaser from "phaser";

import { BrowserInputState } from "../input/BrowserInputState";

export class BootScene extends Phaser.Scene {
  constructor() { super("boot"); }
  /**
   * The BootScene simply stores the inputState passed from main.ts into the global registry
   * before progressing to the preload scene. Storing the BrowserInputState here allows
   * later scenes (such as the main menu and arena) to retrieve it without coupling to the boot
   * parameters. Without this pass‑through the input controllers would re‑create their own
   * state, leading to desynchronised touch/keyboard handling.
   */
  create(data: { inputState?: BrowserInputState } = {}): void {
    if (data.inputState) {
      this.registry.set("inputState", data.inputState);
    }
    this.scene.start("preload");
  }
}
