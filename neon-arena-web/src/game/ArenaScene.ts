import Phaser from "phaser";
import { add, length, normalize, scale, sub, type Vector2, zeroVector } from "../core/geometry";
import { AIController } from "../core/aiController";
import { GameSession, hitRadius, playerRadius } from "../core/gameSession";
import { mapByID } from "../core/maps";
import type { MapDefinition, MatchConfig, MatchSnapshot, MeleeAction, PlayerInput } from "../core/models";
import { themeByID, type VisualTheme } from "../core/themes";
import { BrowserInputState } from "./browserInput";

export type SceneDriver =
  | { kind: "single"; session: GameSession; aiControllers: AIController[] }
  | { kind: "online"; getSnapshot: () => MatchSnapshot | undefined; sendInput: (input: PlayerInput) => void };

export interface ArenaSceneOptions {
  localPlayerID: string;
  config: MatchConfig;
  themeID: string;
  inputState: BrowserInputState;
  driver: SceneDriver;
  onHud: (mode: string, zone: string) => void;
}

export class ArenaScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics;
  private overlayText!: Phaser.GameObjects.Text;
  private theme: VisualTheme;
  private map: MapDefinition;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private pointerAim: Vector2 = { ...zeroVector };
  private lastNetworkSend = 0;

  constructor(private readonly options: ArenaSceneOptions) {
    super({ key: "arena" });
    this.theme = themeByID(options.themeID);
    this.map = mapByID(options.config.mapID);
  }

  create(): void {
    this.graphics = this.add.graphics();
    this.overlayText = this.add.text(this.map.size.x / 2, 44, "", {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "28px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4
    });
    this.overlayText.setOrigin(0.5, 0);

    this.cameras.main.setBounds(0, 0, this.map.size.x, this.map.size.y);
    this.keys = (this.input.keyboard?.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      Up: Phaser.Input.Keyboard.KeyCodes.UP,
      Left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      Down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      Right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      Q: Phaser.Input.Keyboard.KeyCodes.Q,
      E: Phaser.Input.Keyboard.KeyCodes.E,
      R: Phaser.Input.Keyboard.KeyCodes.R
    }) ?? {}) as Record<string, Phaser.Input.Keyboard.Key>;

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => this.updatePointerAim(pointer));
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.updatePointerAim(pointer));
  }

  override update(time: number, delta: number): void {
    const snapshotBefore = this.currentSnapshot();
    const localInput = this.buildInput(snapshotBefore);

    const driver = this.options.driver;
    if (driver.kind === "single") {
      const driverSnapshot = driver.session.snapshot();
      const aiInputs = driver.aiControllers.map((ai) => ai.input(driverSnapshot, this.map));
      driver.session.step([localInput, ...aiInputs], Math.min(delta / 1000, 0.1));
    } else if (time - this.lastNetworkSend > 50 || localInput.firePressed || localInput.meleeAction) {
      driver.sendInput(localInput);
      this.lastNetworkSend = time;
    }

    const snapshot = this.currentSnapshot();
    this.render(snapshot);
    this.updateHud(snapshot);
  }

  setTheme(themeID: string): void {
    this.theme = themeByID(themeID);
  }

  private currentSnapshot(): MatchSnapshot | undefined {
    if (this.options.driver.kind === "single") {
      return this.options.driver.session.snapshot();
    }
    return this.options.driver.getSnapshot();
  }

  private buildInput(snapshot: MatchSnapshot | undefined): PlayerInput {
    const keyboardMovement = this.keyboardMovement();
    const movement = length(keyboardMovement) > 0 ? keyboardMovement : this.options.inputState.movement;
    const player = snapshot?.players.find((candidate) => candidate.id === this.options.localPlayerID);
    const aim = length(this.pointerAim) > 0 ? this.pointerAim : this.options.inputState.aim;
    const meleeAction = this.keyboardMeleeAction() ?? this.options.inputState.consumeMelee();
    const firePressed = this.options.inputState.consumeFire() || this.keys.Space?.isDown === true;

    if (player && length(aim) <= 0.05 && length(movement) > 0.05) {
      this.options.inputState.setAim(movement);
    }

    const input: PlayerInput = {
      playerID: this.options.localPlayerID,
      movement,
      aim: length(aim) > 0.05 ? aim : { x: 1, y: 0 },
      firePressed,
      tick: snapshot?.tick ?? 0
    };
    if (meleeAction) {
      input.meleeAction = meleeAction;
    }
    return input;
  }

  private keyboardMovement(): Vector2 {
    const x = Number(this.keys.D?.isDown || this.keys.Right?.isDown) - Number(this.keys.A?.isDown || this.keys.Left?.isDown);
    const y = Number(this.keys.S?.isDown || this.keys.Down?.isDown) - Number(this.keys.W?.isDown || this.keys.Up?.isDown);
    const movement = { x, y };
    return length(movement) > 0 ? normalize(movement) : { ...zeroVector };
  }

  private keyboardMeleeAction(): MeleeAction | undefined {
    if (this.keys.R && Phaser.Input.Keyboard.JustDown(this.keys.R)) return "throw";
    if (this.keys.E && Phaser.Input.Keyboard.JustDown(this.keys.E)) return "flyingKick";
    if (this.keys.Q && Phaser.Input.Keyboard.JustDown(this.keys.Q)) return "punch";
    return undefined;
  }

  private updatePointerAim(pointer: Phaser.Input.Pointer): void {
    const snapshot = this.currentSnapshot();
    const player = snapshot?.players.find((candidate) => candidate.id === this.options.localPlayerID);
    if (!player) {
      return;
    }

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.pointerAim = normalize(sub(worldPoint, player.position));
    this.options.inputState.setAim(this.pointerAim);
  }

  private render(snapshot: MatchSnapshot | undefined): void {
    const graphics = this.graphics;
    graphics.clear();
    graphics.fillStyle(color(this.theme.background), 1);
    graphics.fillRect(0, 0, this.map.size.x, this.map.size.y);
    this.drawGrid(graphics);
    this.drawSafeZone(graphics, snapshot);
    this.drawWalls(graphics);
    this.drawPickups(graphics, snapshot);
    this.drawProjectiles(graphics, snapshot);
    this.drawPlayers(graphics, snapshot);

    if (!snapshot) {
      this.overlayText.setText("等待房间开局");
    } else if (snapshot.winnerID) {
      this.overlayText.setText(snapshot.winnerID === "draw" ? "平局" : `胜者 ${this.nameFor(snapshot, snapshot.winnerID)}`);
    } else {
      this.overlayText.setText("");
    }
  }

  private drawGrid(graphics: Phaser.GameObjects.Graphics): void {
    graphics.lineStyle(1, color(this.theme.wallStroke), 0.12);
    for (let x = 0; x <= this.map.size.x; x += 48) {
      graphics.lineBetween(x, 0, x, this.map.size.y);
    }
    for (let y = 0; y <= this.map.size.y; y += 48) {
      graphics.lineBetween(0, y, this.map.size.x, y);
    }
  }

  private drawSafeZone(graphics: Phaser.GameObjects.Graphics, snapshot: MatchSnapshot | undefined): void {
    if (!snapshot) {
      return;
    }
    graphics.lineStyle(5, color(this.theme.safeZone), 0.9);
    graphics.strokeCircle(snapshot.safeZone.center.x, snapshot.safeZone.center.y, snapshot.safeZone.radius);
    graphics.lineStyle(1, color(this.theme.safeZone), 0.35);
    graphics.strokeCircle(snapshot.safeZone.center.x, snapshot.safeZone.center.y, snapshot.safeZone.radius + 12);
  }

  private drawWalls(graphics: Phaser.GameObjects.Graphics): void {
    for (const wall of this.map.walls) {
      graphics.fillStyle(color(this.theme.wallFill), 1);
      graphics.fillRect(wall.rect.origin.x, wall.rect.origin.y, wall.rect.size.x, wall.rect.size.y);
      graphics.lineStyle(3, color(this.theme.wallStroke), 0.9);
      graphics.strokeRect(wall.rect.origin.x, wall.rect.origin.y, wall.rect.size.x, wall.rect.size.y);
    }
  }

  private drawPickups(graphics: Phaser.GameObjects.Graphics, snapshot: MatchSnapshot | undefined): void {
    for (const weapon of snapshot?.droppedWeapons ?? []) {
      if (weapon.isPickedUp) {
        continue;
      }
      const fill = weapon.type === "melee" ? this.theme.meleePickup : this.theme.rangedPickup;
      graphics.fillStyle(color(fill), 0.9);
      graphics.beginPath();
      graphics.moveTo(weapon.position.x, weapon.position.y - 14);
      graphics.lineTo(weapon.position.x + 14, weapon.position.y);
      graphics.lineTo(weapon.position.x, weapon.position.y + 14);
      graphics.lineTo(weapon.position.x - 14, weapon.position.y);
      graphics.closePath();
      graphics.fillPath();
    }
  }

  private drawProjectiles(graphics: Phaser.GameObjects.Graphics, snapshot: MatchSnapshot | undefined): void {
    for (const projectile of snapshot?.projectiles ?? []) {
      graphics.fillStyle(color(this.theme.projectile), 1);
      graphics.fillCircle(projectile.position.x, projectile.position.y, 5);
    }
  }

  private drawPlayers(graphics: Phaser.GameObjects.Graphics, snapshot: MatchSnapshot | undefined): void {
    for (const player of snapshot?.players ?? []) {
      const isLocal = player.id === this.options.localPlayerID;
      const fill = player.isEliminated ? "#3c4654" : isLocal ? this.theme.localPlayer : this.theme.remotePlayer;
      graphics.fillStyle(color(fill), player.isEliminated ? 0.45 : 1);
      graphics.fillCircle(player.position.x, player.position.y, playerRadius);
      graphics.lineStyle(3, color("#ffffff"), isLocal ? 0.9 : 0.35);
      graphics.strokeCircle(player.position.x, player.position.y, playerRadius);

      const aimEnd = add(player.position, scale(player.facing, hitRadius + 16));
      graphics.lineStyle(3, color(fill), 0.8);
      graphics.lineBetween(player.position.x, player.position.y, aimEnd.x, aimEnd.y);

      graphics.fillStyle(color("#111827"), 0.9);
      graphics.fillRect(player.position.x - 24, player.position.y - 34, 48, 6);
      graphics.fillStyle(color(player.health > 35 ? "#22c55e" : "#ef4444"), 1);
      graphics.fillRect(player.position.x - 24, player.position.y - 34, 48 * Math.max(0, player.health / 100), 6);
    }
  }

  private updateHud(snapshot: MatchSnapshot | undefined): void {
    const mode = this.options.config.mode.kind === "single" ? "单人 AI" : this.options.config.mode.kind === "onlineDuel" ? "在线 1v1" : "在线混战";
    const rules = this.options.config.mode.ruleset === "meleeOnly" ? "肉搏" : "普通";
    if (!snapshot) {
      this.options.onHud(`${mode} / ${rules}`, "等待开局");
      return;
    }
    const zone = `缩圈 ${snapshot.safeZone.phase + 1}/3 · 半径 ${Math.round(snapshot.safeZone.radius)}`;
    this.options.onHud(`${mode} / ${rules}`, zone);
  }

  private nameFor(snapshot: MatchSnapshot, playerID: string): string {
    return snapshot.players.find((player) => player.id === playerID)?.nickname ?? playerID;
  }
}

function color(hex: string): number {
  return Number.parseInt(hex.replace("#", ""), 16);
}
