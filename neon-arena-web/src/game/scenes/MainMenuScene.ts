import Phaser from "phaser";

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

    // Create a semi‑transparent rounded rectangle for the start button.
    const buttonWidth = Math.min(width * 0.5, 360);
    const buttonHeight = Math.max(48, Math.round(height * 0.08));
    const buttonX = width / 2;
    const buttonY = height * 0.7;
    const startButton = this.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x00e5ff, 0.85);
    startButton.setOrigin(0.5);
    startButton.setStrokeStyle(2, 0xffffff, 0.9);
    startButton.setInteractive({ useHandCursor: true });

    // Label the button with text.
    const startText = this.add.text(buttonX, buttonY, "Start Game", {
      fontFamily: "Arial, sans-serif",
      fontSize: `${Math.round(buttonHeight * 0.5)}px`,
      color: "#070916",
      fontStyle: "bold"
    });
    startText.setOrigin(0.5);

    // Handle pointer/touch interactions on the button.
    startButton.on("pointerdown", () => {
      const inputState = this.registry.get("inputState");
      // Pass through the existing input state when starting the arena scene.
      this.scene.start("arena", { inputState });
    });

    // Re‑calculate layout on resize to ensure a responsive menu.
    this.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
      const { width: newW, height: newH } = gameSize;
      bg.setPosition(newW / 2, newH / 2).setDisplaySize(newW, newH);
      title.setPosition(newW / 2, newH * 0.2).setFontSize(Math.round(newH * 0.06));
      const newButtonWidth = Math.min(newW * 0.5, 360);
      const newButtonHeight = Math.max(48, Math.round(newH * 0.08));
      startButton.setPosition(newW / 2, newH * 0.7).setSize(newButtonWidth, newButtonHeight);
      startText.setPosition(newW / 2, newH * 0.7).setFontSize(Math.round(newButtonHeight * 0.5));
    });
  }
}