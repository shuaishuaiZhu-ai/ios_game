import Phaser from "phaser";
// Import matchConfig up front to avoid using dynamic require calls within the scene.  This
// helper constructs a MatchConfig given basic settings.
import { matchConfig } from "../../core/models";

// Define a simple type for menu buttons used in the main menu.  Each button
// exposes the rectangle and label objects so that layout can be updated
// responsively on resize events.
type MenuButton = {
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
};

/**
 * MainMenuScene presents a simple, user‑friendly start screen before the game begins.
 * It displays a full‑screen illustration as a backdrop and a prominent button to
 * start the match. Additional UI elements, such as a title, can be added here
 * without affecting gameplay logic. When the user taps the start button the scene
 * transitions to the arena.
 */
export class MainMenuScene extends Phaser.Scene {
  constructor() { super("main-menu"); }


  create(): void {
    const { width, height } = this.scale;
    // Draw the background illustration. The menu-background asset is preloaded via PreloadScene.
    const bg = this.add.image(width / 2, height / 2, "menu-background");
    bg.setDisplaySize(width, height);

    // Display the game title at the top of the screen.
    const title = this.add.text(width / 2, height * 0.2, "NEON ARENA", {
      fontFamily: "Arial, sans-serif",
      fontSize: `${Math.round(height * 0.06)}px`,
      color: "#00e5ff",
      fontStyle: "bold"
    });
    title.setOrigin(0.5);

    // Utility to create a menu button. Each button consists of a rectangle and
    // a text label.  Buttons are anchored at the center horizontally and
    // positioned vertically using a fraction of the screen height.  The
    // returned object is used to adjust layout on resize.

    const createButton = (
      yFrac: number,
      label: string,
      onClick: () => void
    ): MenuButton => {
      const bw = Math.min(width * 0.6, 400);
      const bh = Math.max(48, Math.round(height * 0.08));
      const bx = width / 2;
      const by = height * yFrac;
      const rect = this.add.rectangle(bx, by, bw, bh, 0x00e5ff, 0.85);
      rect.setOrigin(0.5);
      rect.setStrokeStyle(2, 0xffffff, 0.9);
      rect.setInteractive({ useHandCursor: true });
      const text = this.add.text(bx, by, label, {
        fontFamily: "Arial, sans-serif",
        fontSize: `${Math.round(bh * 0.5)}px`,
        color: "#070916",
        fontStyle: "bold"
      });
      text.setOrigin(0.5);
      rect.on("pointerdown", onClick);
      return { rect, label: text };
    };

    // Grab the input state persisted from BootScene so we can pass it into
    // ArenaScene when starting a match.  If none exists, the arena will
    // instantiate its own BrowserInputState.
    const persistedInputState: any = this.registry.get("inputState");

    // Start a match with a given player count.  This helper constructs a
    // MatchConfig using matchConfig and a fixed map.  Should the design call
    // for different maps per mode, the second argument could be randomized.
    const startMatch = (playerCount: number): void => {
      const config = matchConfig(
        { kind: "single", difficulty: "medium", ruleset: "standard" },
        "map01_skyline_garden_ruins",
        playerCount,
        1,
        30
      );
      this.scene.start("arena", { inputState: persistedInputState, config });
    };

    // Instantiate menu buttons for the different supported modes.  The y
    // fractions are chosen to space the buttons evenly near the lower half of
    // the screen.  The callbacks invoke startMatch with the desired
    // player count.
    const aiButton = createButton(0.55, "AI Match", () => startMatch(4));
    const twoPlayerButton = createButton(0.68, "2 Players", () => startMatch(2));
    const fourPlayerButton = createButton(0.81, "4 Players", () => startMatch(4));

    // Adjust layout when the game window is resized.  This ensures that the
    // background illustration and all buttons remain centered and scale
    // appropriately.  Each button is resized and re-positioned using the
    // same y fraction values used during creation.
    this.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
      const { width: newW, height: newH } = gameSize;
      bg.setPosition(newW / 2, newH / 2).setDisplaySize(newW, newH);
      title.setPosition(newW / 2, newH * 0.2).setFontSize(Math.round(newH * 0.06));
      const reposition = (btn: MenuButton, yFrac: number): void => {
        const newBw = Math.min(newW * 0.6, 400);
        const newBh = Math.max(48, Math.round(newH * 0.08));
        const by = newH * yFrac;
        btn.rect.setPosition(newW / 2, by).setSize(newBw, newBh);
        btn.label.setPosition(newW / 2, by).setFontSize(Math.round(newBh * 0.5));
      };
      reposition(aiButton, 0.55);
      reposition(twoPlayerButton, 0.68);
      reposition(fourPlayerButton, 0.81);
    });
  }
}