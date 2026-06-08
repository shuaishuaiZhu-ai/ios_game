import Phaser from "phaser";
import { arenaMaps } from "../../core/maps";
import type { NetworkMessage } from "../../core/models";
import { BrowserInputState } from "../input/BrowserInputState";
import type { SceneDriver } from "../sync/SceneDriverController";
import { RoomClient } from "../../network/roomClient";
import {
  buildOnlineMatchConfig,
  buildOnlineRoomURL,
  buildSingleSceneOptions,
  createRoomCode,
  defaultMenuSelection,
  isValidRoomCode,
  normalizeRoomCode,
  sanitizeNickname,
  targetPlayersForMatchKind,
  type MatchKind,
  type MenuSelection
} from "../menu/menuSelection";

export class MainMenuScene extends Phaser.Scene {
  private selection: MenuSelection = defaultMenuSelection();
  private menuRoot?: HTMLDivElement;
  private statusLine?: HTMLDivElement;
  private difficultyRow?: HTMLLabelElement;
  private playerRow?: HTMLLabelElement;
  private roomRows: HTMLElement[] = [];
  private roomInput?: HTMLInputElement;
  private roomClient?: RoomClient;
  private localPlayerID = "";

  constructor() {
    super("main-menu");
  }

  create(): void {
    const { width, height } = this.scale;
    const bg = this.add.image(width / 2, height / 2, "menu-background");
    bg.setDisplaySize(width, height);
    this.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
      bg.setPosition(gameSize.width / 2, gameSize.height / 2).setDisplaySize(gameSize.width, gameSize.height);
    });

    this.mountMenu();
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.roomClient?.close();
      this.menuRoot?.remove();
    });
  }

  private mountMenu(): void {
    const hudRoot = document.getElementById("hud-root");
    if (!hudRoot) {
      this.startSingle();
      return;
    }

    const shell = document.createElement("div");
    shell.className = "main-menu-shell";
    const panel = document.createElement("div");
    panel.className = "main-menu-panel";
    shell.append(panel);
    this.menuRoot = shell;

    const title = document.createElement("div");
    title.className = "main-menu-title";
    title.textContent = "NEON ARENA";
    panel.append(title);

    const tabs = document.createElement("div");
    tabs.className = "menu-tabs";
    panel.append(tabs);
    for (const [kind, label] of [
      ["single", "Single AI"],
      ["onlineDuel", "Online Duel"],
      ["onlineFFA", "Online FFA"]
    ] as Array<[MatchKind, string]>) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.dataset.kind = kind;
      button.addEventListener("click", () => {
        this.selection.matchKind = kind;
        this.selection.targetPlayers = targetPlayersForMatchKind(kind, this.selection.targetPlayers);
        this.refreshMenuState();
      });
      tabs.append(button);
    }

    panel.append(this.selectRow("Map", "map", arenaMaps.map((map) => [map.id, map.name]), this.selection.mapID));
    panel.append(this.selectRow("Rules", "ruleset", [["standard", "Weapons"], ["meleeOnly", "Melee Only"]], this.selection.ruleset));
    this.difficultyRow = this.selectRow("Difficulty", "difficulty", [["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]], this.selection.difficulty);
    panel.append(this.difficultyRow);
    this.playerRow = this.selectRow("Players", "players", [["3", "3 Players"], ["4", "4 Players"]], "4");
    panel.append(this.playerRow);

    const nicknameRow = this.inputRow("Nickname", "nickname", this.selection.nickname, "Player");
    panel.append(nicknameRow.row);
    nicknameRow.input.addEventListener("input", () => {
      this.selection.nickname = nicknameRow.input.value;
    });

    const roomRow = this.inputRow("Room Code", "room", this.selection.roomCode, "ABC123");
    this.roomInput = roomRow.input;
    this.roomRows.push(roomRow.row);
    panel.append(roomRow.row);

    const actions = document.createElement("div");
    actions.className = "menu-actions";
    panel.append(actions);

    const startButton = this.actionButton("Start AI Match", () => this.startSingle());
    startButton.dataset.role = "single";
    actions.append(startButton);

    const createButton = this.actionButton("Create Room", () => {
      this.selection.roomCode = createRoomCode();
      if (this.roomInput) this.roomInput.value = this.selection.roomCode;
      this.connectOnline();
    });
    createButton.dataset.role = "online";
    actions.append(createButton);

    const joinButton = this.actionButton("Join Room", () => {
      this.selection.roomCode = normalizeRoomCode(this.roomInput?.value ?? "");
      if (this.roomInput) this.roomInput.value = this.selection.roomCode;
      this.connectOnline();
    });
    joinButton.dataset.role = "online";
    actions.append(joinButton);

    this.statusLine = document.createElement("div");
    this.statusLine.className = "menu-status";
    panel.append(this.statusLine);

    hudRoot.append(shell);
    this.refreshMenuState();
  }

  private selectRow(label: string, field: string, options: Array<[string, string]>, value: string): HTMLLabelElement {
    const row = document.createElement("label");
    row.className = "menu-row";
    row.textContent = label;
    const select = document.createElement("select");
    select.dataset.field = field;
    for (const [optionValue, optionLabel] of options) {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionLabel;
      select.append(option);
    }
    select.value = value;
    select.addEventListener("change", () => this.updateSelection(field, select.value));
    row.append(select);
    return row;
  }

  private inputRow(label: string, field: string, value: string, placeholder: string): { row: HTMLLabelElement; input: HTMLInputElement } {
    const row = document.createElement("label");
    row.className = "menu-row";
    row.textContent = label;
    const input = document.createElement("input");
    input.dataset.field = field;
    input.value = value;
    input.placeholder = placeholder;
    input.autocomplete = "off";
    input.spellcheck = false;
    row.append(input);
    return { row, input };
  }

  private actionButton(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "menu-action-button";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  private updateSelection(field: string, value: string): void {
    if (field === "map") this.selection.mapID = value;
    else if (field === "ruleset") this.selection.ruleset = value === "meleeOnly" ? "meleeOnly" : "standard";
    else if (field === "difficulty") this.selection.difficulty = value === "easy" || value === "hard" ? value : "medium";
    else if (field === "players") this.selection.targetPlayers = Number(value) === 3 ? 3 : 4;
  }

  private refreshMenuState(): void {
    const isSingle = this.selection.matchKind === "single";
    this.difficultyRow?.classList.toggle("is-hidden", !isSingle);
    this.playerRow?.classList.toggle("is-hidden", this.selection.matchKind !== "onlineFFA");
    for (const row of this.roomRows) row.classList.toggle("is-hidden", isSingle);
    this.menuRoot?.querySelectorAll<HTMLButtonElement>(".menu-tabs button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.kind === this.selection.matchKind);
    });
    this.menuRoot?.querySelectorAll<HTMLButtonElement>(".menu-action-button").forEach((button) => {
      const role = button.dataset.role;
      button.classList.toggle("is-hidden", isSingle ? role !== "single" : role !== "online");
    });
    this.setStatus(isSingle ? "Configure an AI match." : "Create a room or enter a room code.");
  }

  private startSingle(): void {
    const inputState = this.registry.get("inputState") ?? new BrowserInputState();
    this.scene.start("arena", buildSingleSceneOptions(this.selection, inputState));
  }

  private connectOnline(): void {
    if (!isValidRoomCode(this.selection.roomCode)) {
      this.setStatus("Room code must be 3-8 letters or numbers.");
      return;
    }

    const inputState = this.registry.get("inputState") ?? new BrowserInputState();
    const client = new RoomClient();
    this.roomClient?.close();
    this.roomClient = client;
    this.localPlayerID = `p${Math.floor(Math.random() * 900000 + 100000)}`;
    const nickname = sanitizeNickname(this.selection.nickname);
    this.selection.targetPlayers = targetPlayersForMatchKind(this.selection.matchKind, this.selection.targetPlayers);

    client.addEventListener("status", () => this.setStatus(`Room ${normalizeRoomCode(this.selection.roomCode)}: ${client.status()}`));
    client.addEventListener("lobby", (event) => {
      const message = (event as CustomEvent<NetworkMessage>).detail;
      if (message.type === "lobby") this.setStatus(`Room ${message.roomCode}: ${message.playerCount}/${message.targetPlayers}`);
    });
    client.addEventListener("error", (event) => {
      const message = (event as CustomEvent<NetworkMessage>).detail;
      this.setStatus(message.type === "error" ? `Room error: ${message.message}` : "Room error.");
    });
    client.addEventListener("start", (event) => {
      const message = (event as CustomEvent<NetworkMessage>).detail;
      if (message.type !== "start") return;
      const driver: SceneDriver = { kind: "online", getSnapshot: () => client.snapshot(), sendInput: (input) => client.sendInput(input) };
      this.scene.start("arena", { localPlayerID: this.localPlayerID, inputState, config: message.config, driver });
    });

    client.connect(buildOnlineRoomURL(this.selection), this.localPlayerID, nickname);
    this.setStatus(`Connecting room ${normalizeRoomCode(this.selection.roomCode)}...`);
  }

  private setStatus(message: string): void {
    if (this.statusLine) this.statusLine.textContent = message;
  }
}
