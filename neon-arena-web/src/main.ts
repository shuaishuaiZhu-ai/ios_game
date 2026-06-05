import Phaser from "phaser";
import "./styles.css";
import { AIController } from "./core/aiController";
import { mapByID, arenaMaps } from "./core/maps";
import { GameSession } from "./core/gameSession";
import { matchConfig, type Difficulty, type MatchConfig, type Ruleset } from "./core/models";
import { themeByID, visualThemes } from "./core/themes";
import { ArenaScene, type SceneDriver } from "./game/ArenaScene";
import { attachTouchControls, BrowserInputState } from "./game/browserInput";
import { RoomClient } from "./network/roomClient";

const menu = required<HTMLElement>("menu");
const gameShell = required<HTMLElement>("game-shell");
const gameRoot = required<HTMLElement>("game-root");
const nicknameInput = required<HTMLInputElement>("nickname");
const mapSelect = required<HTMLSelectElement>("map-select");
const rulesetSelect = required<HTMLSelectElement>("ruleset-select");
const difficultySelect = required<HTMLSelectElement>("difficulty-select");
const themeSelect = required<HTMLSelectElement>("theme-select");
const hudThemeSelect = required<HTMLSelectElement>("hud-theme-select");
const targetPlayersSelect = required<HTMLSelectElement>("target-players-select");
const roomCodeInput = required<HTMLInputElement>("room-code");
const statusText = required<HTMLElement>("status");
const hudMode = required<HTMLElement>("hud-mode");
const hudZone = required<HTMLElement>("hud-zone");
const inputState = new BrowserInputState();

let currentGame: Phaser.Game | undefined;
let currentScene: ArenaScene | undefined;
let activeRoomClient: RoomClient | undefined;

populateSelects();
attachTouchControls(gameShell, inputState);
applyTheme(themeSelect.value);

required<HTMLButtonElement>("single-button").addEventListener("click", startSinglePlayer);
required<HTMLButtonElement>("create-room-button").addEventListener("click", createOnlineRoom);
required<HTMLButtonElement>("join-room-button").addEventListener("click", joinOnlineRoom);
required<HTMLButtonElement>("leave-button").addEventListener("click", leaveGame);
themeSelect.addEventListener("change", () => updateTheme(themeSelect.value));
hudThemeSelect.addEventListener("change", () => updateTheme(hudThemeSelect.value));

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => undefined);
}

window.addEventListener("beforeunload", () => activeRoomClient?.close());

function startSinglePlayer(): void {
  activeRoomClient?.close();
  activeRoomClient = undefined;
  destroyCurrentGame();
  const localPlayerID = playerID();
  const aiID = "ai-1";
  const ruleset = rulesetSelect.value as Ruleset;
  const difficulty = difficultySelect.value as Difficulty;
  const config = matchConfig({ kind: "single", difficulty, ruleset }, mapSelect.value, 2, Date.now() % 100000, 30);
  const session = new GameSession(config, [localPlayerID, aiID], {
    [localPlayerID]: nickname(),
    [aiID]: `AI ${difficultyLabel(difficulty)}`
  });
  const driver: SceneDriver = {
    kind: "single",
    session,
    aiControllers: [new AIController(aiID, difficulty)]
  };
  launchGame(localPlayerID, config, driver, themeSelect.value);
  setStatus("单人模式已启动。");
}

function createOnlineRoom(): void {
  roomCodeInput.value = randomRoomCode();
  connectOnlineRoom(roomCodeInput.value);
}

function joinOnlineRoom(): void {
  const roomCode = roomCodeInput.value.trim().toUpperCase();
  if (!roomCode) {
    setStatus("请输入房间码。");
    return;
  }
  connectOnlineRoom(roomCode);
}

function connectOnlineRoom(roomCode: string): void {
  activeRoomClient?.close();
  activeRoomClient = undefined;
  destroyCurrentGame();
  const localPlayerID = playerID();
  let started = false;
  const client = new RoomClient(
    {
      roomCode,
      playerID: localPlayerID,
      nickname: nickname(),
      mapID: mapSelect.value,
      ruleset: rulesetSelect.value as Ruleset,
      targetPlayers: Number(targetPlayersSelect.value)
    },
    {
      status: setStatus,
      close: setStatus,
      snapshot: () => undefined,
      start: (config) => {
        if (started) {
          return;
        }
        started = true;
        const driver: SceneDriver = {
          kind: "online",
          getSnapshot: () => client.snapshot,
          sendInput: (input) => client.sendInput(input)
        };
        launchGame(localPlayerID, config, driver, themeSelect.value);
        setStatus(`房间 ${roomCode} 已开局。`);
      }
    }
  );

  activeRoomClient = client;
  roomCodeInput.value = roomCode;
  client.connect();
}

function launchGame(localPlayerID: string, config: MatchConfig, driver: SceneDriver, themeID: string): void {
  const map = mapByID(config.mapID);
  menu.hidden = true;
  gameShell.hidden = false;
  inputState.setMovement({ x: 0, y: 0 });
  inputState.setAim({ x: 1, y: 0 });
  hudThemeSelect.value = themeID;

  const scene = new ArenaScene({
    localPlayerID,
    config,
    themeID,
    inputState,
    driver,
    onHud: (mode, zone) => {
      hudMode.textContent = mode;
      hudZone.textContent = zone;
    }
  });

  currentScene = scene;
  currentGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameRoot,
    width: map.size.x,
    height: map.size.y,
    backgroundColor: themeByID(themeID).background,
    scale: {
      parent: gameRoot,
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: map.size.x,
      height: map.size.y
    },
    scene
  });
}

function leaveGame(): void {
  activeRoomClient?.close();
  activeRoomClient = undefined;
  destroyCurrentGame();
  gameShell.hidden = true;
  menu.hidden = false;
  setStatus("已退出。");
}

function destroyCurrentGame(): void {
  currentScene = undefined;
  currentGame?.destroy(true);
  currentGame = undefined;
  gameRoot.innerHTML = "";
}

function updateTheme(themeID: string): void {
  themeSelect.value = themeID;
  hudThemeSelect.value = themeID;
  applyTheme(themeID);
  currentScene?.setTheme(themeID);
}

function applyTheme(themeID: string): void {
  const theme = themeByID(themeID);
  document.documentElement.style.setProperty("--arena-bg", theme.background);
  document.documentElement.style.setProperty("--arena-accent", theme.uiAccent);
  document.documentElement.style.setProperty("--arena-accent-2", theme.remotePlayer);
  document.querySelector("meta[name='theme-color']")?.setAttribute("content", theme.background);
}

function populateSelects(): void {
  for (const map of arenaMaps) {
    mapSelect.add(new Option(map.name, map.id));
  }
  for (const theme of visualThemes) {
    themeSelect.add(new Option(theme.name, theme.id));
    hudThemeSelect.add(new Option(theme.name, theme.id));
  }
}

function nickname(): string {
  return nicknameInput.value.trim().slice(0, 18) || "Player";
}

function playerID(): string {
  const existing = localStorage.getItem("neon-arena-player-id");
  if (existing) {
    return existing;
  }
  const created = crypto.randomUUID();
  localStorage.setItem("neon-arena-player-id", created);
  return created;
}

function setStatus(message: string): void {
  statusText.textContent = message;
}

function randomRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

function difficultyLabel(difficulty: Difficulty): string {
  if (difficulty === "easy") return "简单";
  if (difficulty === "medium") return "中等";
  return "困难";
}

function required<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element as T;
}
