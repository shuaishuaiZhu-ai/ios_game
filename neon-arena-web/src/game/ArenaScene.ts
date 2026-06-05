import Phaser from "phaser";
import { AIController } from "../core/aiController";
import { GameSession } from "../core/gameSession";
import { mapByID } from "../core/maps";
import { matchConfig, type MapDefinition, type MatchConfig, type MatchSnapshot } from "../core/models";
import { BrowserInputState } from "./input/BrowserInputState";
import { KeyboardControls } from "./input/KeyboardControls";
import { InputComposer } from "./input/InputComposer";
import { TouchControls } from "./input/TouchControls";
import { SceneDriverController, type SceneDriver } from "./sync/SceneDriverController";
import { MapRenderer } from "./render/MapRenderer";
import { SafeZoneRenderer } from "./render/SafeZoneRenderer";
import { WeaponRenderer } from "./render/WeaponRenderer";
import { ProjectileRenderer } from "./render/ProjectileRenderer";
import { PlayerRenderer } from "./render/PlayerRenderer";
import { HudRenderer } from "./render/HudRenderer";
import { VfxSystem } from "./render/VfxSystem";

export interface ArenaSceneOptions {
  localPlayerID: string;
  config: MatchConfig;
  inputState: BrowserInputState;
  driver: SceneDriver;
}

export class ArenaScene extends Phaser.Scene {
  private options!: ArenaSceneOptions;
  private map!: MapDefinition;
  private driver!: SceneDriverController;
  private keyboard!: KeyboardControls;
  private composer!: InputComposer;
  private worldGraphics!: Phaser.GameObjects.Graphics;
  private uiGraphics!: Phaser.GameObjects.Graphics;
  private safeZoneRenderer!: SafeZoneRenderer;
  private weaponRenderer!: WeaponRenderer;
  private projectileRenderer!: ProjectileRenderer;
  private playerRenderer!: PlayerRenderer;
  private hudRenderer!: HudRenderer;
  private vfx!: VfxSystem;
  private lastVfxTick = -1;

  constructor() { super("arena"); }

  init(data: Partial<ArenaSceneOptions>): void {
    const mapID = data.config?.mapID ?? "map01_skyline_garden_ruins";
    const config = data.config ?? matchConfig({ kind: "single", difficulty: "medium", ruleset: "standard" }, mapID, 4, 1, 30);
    const localPlayerID = data.localPlayerID ?? "p1";
    const inputState = data.inputState ?? new BrowserInputState();
    const session = new GameSession(config, ["p1", "p2", "p3", "p4"], { p1: "", p2: "", p3: "", p4: "" });
    const fallbackDriver: SceneDriver = { kind: "single", session, aiControllers: [new AIController("p2", "medium"), new AIController("p3", "hard"), new AIController("p4", "medium")] };
    this.options = { localPlayerID, config, inputState, driver: data.driver ?? fallbackDriver };
    this.map = mapByID(config.mapID);
  }

  create(): void {
    this.cameras.main.setBounds(0, 0, this.map.size.x, this.map.size.y);
    this.configureCameraZoom();
    this.scale.on("resize", this.configureCameraZoom, this);
    this.worldGraphics = this.add.graphics();
    this.uiGraphics = this.add.graphics();
    new MapRenderer(this, this.map).create();
    this.safeZoneRenderer = new SafeZoneRenderer(this, this.worldGraphics, this.map);
    this.safeZoneRenderer.create();
    this.weaponRenderer = new WeaponRenderer(this, this.worldGraphics);
    this.projectileRenderer = new ProjectileRenderer(this);
    this.playerRenderer = new PlayerRenderer(this, this.options.localPlayerID);
    this.hudRenderer = new HudRenderer(this.uiGraphics, this.options.localPlayerID);
    this.vfx = new VfxSystem(this);
    this.keyboard = new KeyboardControls(this);
    this.keyboard.create();
    this.composer = new InputComposer(this.options.localPlayerID, this.options.inputState, this.keyboard);
    this.driver = new SceneDriverController(this.options.driver, this.map);
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => this.composer.setPointerAimFromWorld(this.cameras.main.getWorldPoint(pointer.x, pointer.y), this.driver.currentSnapshot()));
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.composer.setPointerAimFromWorld(this.cameras.main.getWorldPoint(pointer.x, pointer.y), this.driver.currentSnapshot()));
    const hudRoot = document.getElementById("hud-root");
    if (hudRoot) {
      const touchControls = new TouchControls(hudRoot, this.options.inputState);
      touchControls.mount();
      this.events.once(Phaser.Scenes.Events.DESTROY, () => touchControls.destroy());
    }
  }

  override update(time: number, delta: number): void {
    const before = this.driver.currentSnapshot();
    const input = this.composer.build(before);
    const snapshot = this.driver.update(time, delta, input);
    this.render(snapshot);
  }

  private render(snapshot: MatchSnapshot | undefined): void {
    this.worldGraphics.clear();
    this.uiGraphics.clear();
    this.safeZoneRenderer.render(snapshot);
    this.weaponRenderer.render(snapshot?.droppedWeapons ?? []);
    this.projectileRenderer.render(snapshot?.projectiles ?? []);
    this.playerRenderer.render(snapshot?.players ?? []);
    this.hudRenderer.render(snapshot);
    if (snapshot && snapshot.tick !== this.lastVfxTick) {
      this.lastVfxTick = snapshot.tick;
      this.vfx.play(snapshot.events);
    }
  }

  private configureCameraZoom(): void {
    const isPhoneLandscape = this.scale.width <= 960 && this.scale.width > this.scale.height;
    const targetWorldWidth = isPhoneLandscape ? 1160 : 1360;
    const targetWorldHeight = isPhoneLandscape ? 620 : 760;
    const zoom = Math.min(this.scale.width / targetWorldWidth, this.scale.height / targetWorldHeight);
    this.cameras.main.setZoom(Phaser.Math.Clamp(zoom, 0.56, 1.05));
  }
}
