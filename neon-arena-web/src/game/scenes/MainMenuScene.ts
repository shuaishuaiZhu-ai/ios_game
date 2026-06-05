import Phaser from "phaser";
import { matchConfig, type Ruleset } from "../../core/models";

type MenuButton = {
  rect: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
};

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("main-menu");
  }

  create(): void {
    const { width, height } = this.scale;
    const bg = this.add.image(width / 2, height / 2, "menu-background");
    bg.setDisplaySize(width, height);

    const title = this.add.text(width / 2, height * 0.2, "NEON ARENA", {
      fontFamily: "Arial, sans-serif",
      fontSize: `${Math.round(height * 0.06)}px`,
      color: "#00e5ff",
      fontStyle: "bold"
    });
    title.setOrigin(0.5);

    const startMode = (ruleset: Ruleset): void => {
      const inputState = this.registry.get("inputState");
      const config = matchConfig({ kind: "single", difficulty: "medium", ruleset }, "map01_skyline_garden_ruins", 4, 1, 30);
      this.scene.start("arena", { inputState, config });
    };

    const weaponButton = this.createButton("Weapon Mode", () => startMode("standard"));
    const meleeButton = this.createButton("Melee Mode", () => startMode("meleeOnly"));
    this.layoutButtons(width, height, weaponButton, meleeButton);

    this.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
      const { width: newW, height: newH } = gameSize;
      bg.setPosition(newW / 2, newH / 2).setDisplaySize(newW, newH);
      title.setPosition(newW / 2, newH * 0.2).setFontSize(Math.round(newH * 0.06));
      this.layoutButtons(newW, newH, weaponButton, meleeButton);
    });
  }

  private createButton(label: string, onPress: () => void): MenuButton {
    const rect = this.add.rectangle(0, 0, 320, 54, 0x00e5ff, 0.86);
    rect.setOrigin(0.5);
    rect.setStrokeStyle(2, 0xffffff, 0.9);
    rect.setInteractive({ useHandCursor: true });
    rect.on("pointerdown", onPress);

    const text = this.add.text(0, 0, label, {
      fontFamily: "Arial, sans-serif",
      fontSize: "24px",
      color: "#070916",
      fontStyle: "bold"
    });
    text.setOrigin(0.5);

    return { rect, text };
  }

  private layoutButtons(width: number, height: number, weaponButton: MenuButton, meleeButton: MenuButton): void {
    const buttonWidth = Math.min(width * 0.46, 330);
    const buttonHeight = Math.max(46, Math.round(height * 0.08));
    const gap = Math.max(14, Math.round(height * 0.04));
    const startY = height * 0.66;

    this.layoutButton(weaponButton, width / 2, startY, buttonWidth, buttonHeight);
    this.layoutButton(meleeButton, width / 2, startY + buttonHeight + gap, buttonWidth, buttonHeight);
  }

  private layoutButton(button: MenuButton, x: number, y: number, width: number, height: number): void {
    button.rect.setPosition(x, y).setSize(width, height);
    button.text.setPosition(x, y).setFontSize(Math.round(height * 0.46));
  }
}
