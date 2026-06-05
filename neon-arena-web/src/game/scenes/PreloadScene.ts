import Phaser from "phaser";
import { preloadArenaAssets } from "../assets/preloadAssets";

export class PreloadScene extends Phaser.Scene {
  constructor() { super("preload"); }
  preload(): void {
    // Preload all arena assets up front. Should loading fail, Phaser will report to the console.
    preloadArenaAssets(this);
  }
  /**
   * After preloading, proceed to the main menu rather than the arena directly.
   * The main menu will be responsible for starting the actual game when the user interacts.
   */
  create(): void {
    this.scene.start("main-menu");
  }
}
