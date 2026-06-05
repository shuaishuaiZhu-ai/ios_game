import Phaser from "phaser";
import { add, length, normalize, scale, sub, type Vector2, zeroVector } from "../core/geometry";
import { AIController } from "../core/aiController";
import { GameSession, hitRadius, playerRadius } from "../core/gameSession";
import { mapByID } from "../core/maps";
import type { DroppedWeapon, MapDefinition, MatchConfig, MatchSnapshot, MeleeAction, PlayerInput, PlayerState, ProjectileState } from "../core/models";
import { themeByID, type VisualTheme } from "../core/themes";
import { fighterKeyForIndex, weaponTextureKey } from "./assets";
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
  private worldGraphics!: Phaser.GameObjects.Graphics;
  private uiGraphics!: Phaser.GameObjects.Graphics;
  private overlayText!: Phaser.GameObjects.Text;
  private theme: VisualTheme;
  private map: MapDefinition;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private pointerAim: Vector2 = { ...zeroVector };
  private lastNetworkSend = 0;
  private playerSprites = new Map<string, Phaser.GameObjects.Image>();
  private weaponSprites = new Map<string, Phaser.GameObjects.Image>();
  private projectileSprites = new Map<string, Phaser.GameObjects.Image>();
  private cameraTarget: Phaser.GameObjects.Image | undefined;

  constructor(private readonly options: ArenaSceneOptions) {
    super({ key: "arena" });
    this.theme = themeByID(options.themeID);
    this.map = mapByID(options.config.mapID);
  }

  create(): void {
    this.add.image(this.map.size.x / 2, this.map.size.y / 2, this.map.art.backgroundKey).setDisplaySize(this.map.size.x, this.map.size.y);
    this.createWallSprites();
    this.worldGraphics = this.add.graphics();
    this.uiGraphics = this.add.graphics();
    this.overlayText = this.add.text(this.map.size.x / 2, 54, "", {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "30px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 5
    });
    this.overlayText.setOrigin(0.5, 0);

    this.cameras.main.setBounds(0, 0, this.map.size.x, this.map.size.y);
    this.configureCameraZoom();
    this.scale.on("resize", this.configureCameraZoom, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.scale.off("resize", this.configureCameraZoom, this);
    });
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
      Shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      Ctrl: Phaser.Input.Keyboard.KeyCodes.CTRL,
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
    } else if (time - this.lastNetworkSend > 50 || localInput.firePressed || localInput.meleeAction || localInput.dashPressed || localInput.rollPressed) {
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
    const dashPressed = this.options.inputState.consumeDash() || this.keys.Shift?.isDown === true;
    const rollPressed = this.options.inputState.consumeRoll() || this.keys.Ctrl?.isDown === true;

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
    if (dashPressed) input.dashPressed = true;
    if (rollPressed) input.rollPressed = true;
    if (meleeAction) input.meleeAction = meleeAction;
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
    if (!player) return;

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.pointerAim = normalize(sub(worldPoint, player.position));
    this.options.inputState.setAim(this.pointerAim);
  }

  private createWallSprites(): void {
    for (const wall of this.map.walls) {
      this.add
        .image(wall.rect.origin.x + wall.rect.size.x / 2, wall.rect.origin.y + wall.rect.size.y / 2, this.map.art.wallKey)
        .setDisplaySize(wall.rect.size.x, wall.rect.size.y);
    }
  }

  private render(snapshot: MatchSnapshot | undefined): void {
    this.worldGraphics.clear();
    this.uiGraphics.clear();
    this.drawSafeZone(snapshot);
    this.updatePickups(snapshot?.droppedWeapons ?? []);
    this.updateProjectiles(snapshot?.projectiles ?? []);
    this.updatePlayers(snapshot?.players ?? []);
    this.drawCombatReadouts(snapshot);

    if (!snapshot) {
      this.overlayText.setText("等待房间开局");
    } else if (snapshot.winnerID) {
      this.overlayText.setText(snapshot.winnerID === "draw" ? "平局" : `胜者 ${this.nameFor(snapshot, snapshot.winnerID)}`);
    } else {
      this.overlayText.setText("");
    }
  }

  private drawSafeZone(snapshot: MatchSnapshot | undefined): void {
    if (!snapshot) return;
    const zone = snapshot.safeZone;
    this.worldGraphics.lineStyle(8, color(this.map.art.accent), 0.95);
    this.worldGraphics.strokeCircle(zone.center.x, zone.center.y, zone.radius);
    this.worldGraphics.lineStyle(2, color(this.theme.safeZone), 0.42);
    this.worldGraphics.strokeCircle(zone.center.x, zone.center.y, zone.radius + 18);
    this.worldGraphics.strokeCircle(zone.center.x, zone.center.y, zone.radius - 18);
  }

  private updatePickups(weapons: DroppedWeapon[]): void {
    const activeIDs = new Set<string>();
    for (const weapon of weapons) {
      if (weapon.isPickedUp) continue;
      activeIDs.add(weapon.id);
      const texture = weaponTextureKey(weapon.weaponID);
      const sprite = this.weaponSprites.get(weapon.id) ?? this.add.image(weapon.position.x, weapon.position.y, texture);
      sprite.setTexture(texture);
      sprite.setPosition(weapon.position.x, weapon.position.y);
      sprite.setDisplaySize(weapon.type === "melee" ? 62 : 74, weapon.type === "melee" ? 62 : 52);
      sprite.setDepth(7);
      this.weaponSprites.set(weapon.id, sprite);
      this.worldGraphics.lineStyle(3, color(weapon.type === "melee" ? this.theme.meleePickup : this.theme.rangedPickup), 0.88);
      this.worldGraphics.strokeCircle(weapon.position.x, weapon.position.y, 38);
    }
    this.removeMissing(this.weaponSprites, activeIDs);
  }

  private updateProjectiles(projectiles: ProjectileState[]): void {
    const activeIDs = new Set<string>();
    for (const projectile of projectiles) {
      activeIDs.add(projectile.id);
      const sprite = this.projectileSprites.get(projectile.id) ?? this.add.image(projectile.position.x, projectile.position.y, "fx-projectile");
      sprite.setPosition(projectile.position.x, projectile.position.y);
      sprite.setRotation(Math.atan2(projectile.velocity.y, projectile.velocity.x));
      sprite.setDisplaySize(44, 20);
      sprite.setDepth(9);
      this.projectileSprites.set(projectile.id, sprite);
    }
    this.removeMissing(this.projectileSprites, activeIDs);
  }

  private updatePlayers(players: PlayerState[]): void {
    const activeIDs = new Set<string>();
    const sortedPlayers = [...players].sort((a, b) => a.id.localeCompare(b.id));
    sortedPlayers.forEach((player, index) => {
      activeIDs.add(player.id);
      const isLocal = player.id === this.options.localPlayerID;
      const texture = fighterKeyForIndex(isLocal ? 0 : index + 1);
      const sprite = this.playerSprites.get(player.id) ?? this.add.image(player.position.x, player.position.y, texture);
      sprite.setTexture(texture);
      sprite.setPosition(player.position.x, player.position.y);
      sprite.setRotation(Math.atan2(player.facing.y, player.facing.x) + Math.PI / 2);
      sprite.setAlpha(player.isEliminated ? 0.35 : 1);
      sprite.setDisplaySize(70, 70);
      sprite.setDepth(12);
      this.playerSprites.set(player.id, sprite);

      if (isLocal && this.cameraTarget !== sprite) {
        this.cameraTarget = sprite;
        this.cameras.main.startFollow(sprite, true, 0.12, 0.12);
      }
    });
    this.removeMissing(this.playerSprites, activeIDs);
  }

  private drawCombatReadouts(snapshot: MatchSnapshot | undefined): void {
    for (const player of snapshot?.players ?? []) {
      const isLocal = player.id === this.options.localPlayerID;
      const ringColor = isLocal ? this.theme.localPlayer : this.theme.remotePlayer;
      this.uiGraphics.lineStyle(isLocal ? 4 : 2, color(ringColor), player.isEliminated ? 0.2 : 0.9);
      this.uiGraphics.strokeCircle(player.position.x, player.position.y + 8, playerRadius + 18);

      const barWidth = 64;
      this.uiGraphics.fillStyle(color("#111827"), 0.82);
      this.uiGraphics.fillRoundedRect(player.position.x - barWidth / 2, player.position.y - 54, barWidth, 8, 4);
      this.uiGraphics.fillStyle(color(player.health > 35 ? "#22c55e" : "#ef4444"), 1);
      this.uiGraphics.fillRoundedRect(player.position.x - barWidth / 2, player.position.y - 54, barWidth * Math.max(0, player.health / 100), 8, 4);

      const aimEnd = add(player.position, scale(player.facing, hitRadius + 28));
      this.uiGraphics.lineStyle(4, color(ringColor), 0.85);
      this.uiGraphics.lineBetween(player.position.x, player.position.y, aimEnd.x, aimEnd.y);

      if (player.dashCooldownRemaining > 0) {
        this.uiGraphics.lineStyle(2, color("#ffffff"), 0.35);
        this.uiGraphics.strokeCircle(player.position.x, player.position.y, playerRadius + 27);
      }
      if (player.invulnerabilityRemaining > 0) {
        this.uiGraphics.lineStyle(5, color("#ffffff"), 0.5);
        this.uiGraphics.strokeCircle(player.position.x, player.position.y, playerRadius + 10);
      }
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

  private configureCameraZoom(): void {
    const isPhoneLandscape = this.scale.width < 960 && this.scale.width > this.scale.height;
    if (!isPhoneLandscape) {
      this.cameras.main.setZoom(1);
      return;
    }

    const targetWorldWidth = 1160;
    const targetWorldHeight = 620;
    const zoom = Math.min(this.scale.width / targetWorldWidth, this.scale.height / targetWorldHeight);
    this.cameras.main.setZoom(Phaser.Math.Clamp(zoom, 0.62, 1));
  }

  private nameFor(snapshot: MatchSnapshot, playerID: string): string {
    return snapshot.players.find((player) => player.id === playerID)?.nickname ?? playerID;
  }

  private removeMissing<T extends Phaser.GameObjects.GameObject>(items: Map<string, T>, activeIDs: Set<string>): void {
    for (const [id, item] of items) {
      if (!activeIDs.has(id)) {
        item.destroy();
        items.delete(id);
      }
    }
  }
}

function color(hex: string): number {
  return Number.parseInt(hex.replace("#", ""), 16);
}
