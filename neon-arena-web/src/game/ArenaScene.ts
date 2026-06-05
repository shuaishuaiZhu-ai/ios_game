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
import { DepthLayers } from "./render/DepthLayers";

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

  /**
   * Array of decorative prop images placed on the map.  These props are not
   * collidable and exist purely for visual interest.  They are removed
   * automatically with the scene.
   */
  private decorations: Phaser.GameObjects.Image[] = [];

  constructor() { super("arena"); }

  init(data: Partial<ArenaSceneOptions>): void {
    // Determine the map to use.  If a config was provided, prefer its mapID; otherwise
    // default to the first map in the asset manifest.
    const mapID = data.config?.mapID ?? "map01_skyline_garden_ruins";
    // Determine the match configuration.  When no config is supplied, fall back to a
    // standard 4‑player match with medium difficulty.  The playerCount will
    // determine how many player IDs and AI controllers are constructed below.
    const config = data.config ?? matchConfig({ kind: "single", difficulty: "medium", ruleset: "standard" }, mapID, 4, 1, 30);
    const localPlayerID = data.localPlayerID ?? "p1";
    const inputState = data.inputState ?? new BrowserInputState();
    // Generate a sequential list of player IDs based on the requested player count.
    const playerIDs: string[] = Array.from({ length: config.playerCount }, (_v, i) => `p${i + 1}`);
    // Construct the GameSession with the truncated list of player IDs.  Nicknames
    // default to empty strings for all players.
    const nicknames: Record<string, string> = {};
    for (const id of playerIDs) nicknames[id] = nicknames[id] ?? "";
    const session = new GameSession(config, playerIDs, nicknames);
    // Create a fallback driver when no networked driver is provided.  The driver
    // includes an AIController for every non‑local player.  Difficulties cycle
    // between medium and hard to provide some variation between AIs.  If there
    // is only one player, no AI controllers will be created.
    const aiControllers: AIController[] = [];
    for (let i = 1; i < playerIDs.length; i++) {
      const pid = playerIDs[i];
      const difficulty = i % 2 === 0 ? "medium" : "hard";
      aiControllers.push(new AIController(pid, difficulty));
    }
    const fallbackDriver: SceneDriver = { kind: "single", session, aiControllers };
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
    // Place decorative environmental props on top of the background.  These
    // objects enhance the arena's visual richness with bridges, ruined walls
    // and neon foliage.  They do not interact with gameplay.
    this.createDecorations();
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

  /**
   * Populate the arena with decorative props.  These sprites are added on top
   * of the map background at fixed positions relative to the arena size.
   * The placement is intentionally simple: a series of sky bridges spanning the
   * mid‑section of the map and a handful of neon plants in the corners.  If
   * additional props are desired, they can be appended here.
   */
  private createDecorations(): void {
    const { x: width, y: height } = this.map.size;
    // Place a row of sky bridge segments across the arena.  They are spaced
    // evenly along the x axis and anchored near the top quarter of the map.
    const segmentCount = Math.max(3, Math.floor(width / 480));
    for (let i = 0; i < segmentCount; i++) {
      const x = (width / (segmentCount + 1)) * (i + 1);
      const y = height * 0.32;
      const bridge = this.add.image(x, y, "prop-sky-bridge");
      // Scale the bridge to maintain consistent appearance across devices.
      const scale = Math.min(1, Math.max(0.5, width / 2000));
      bridge.setScale(scale).setDepth(DepthLayers.decor).setAlpha(0.86);
      this.decorations.push(bridge);
    }
    // Add a few neon plant clusters in the arena corners.  These plants are
    // smaller and provide accent lighting reminiscent of the concept art.
    const plantPositions = [
      { x: width * 0.18, y: height * 0.18 },
      { x: width * 0.82, y: height * 0.18 },
      { x: width * 0.18, y: height * 0.82 },
      { x: width * 0.82, y: height * 0.82 }
    ];
    for (const pos of plantPositions) {
      const plant = this.add.image(pos.x, pos.y, "prop-neon-plant");
      plant.setScale(0.55).setDepth(DepthLayers.decor).setAlpha(0.92);
      this.decorations.push(plant);
    }
  }
}
