import { rect, vec } from "./geometry";
import type { MapDefinition, SafeZoneConfig } from "./models";

export function safeZoneState(config: SafeZoneConfig, elapsedTime: number) {
  const rawPhase = Math.floor(elapsedTime / config.phaseDuration);
  const phase = Math.min(Math.max(rawPhase, 0), config.phaseRadii.length - 1);
  const nextShrinkTime = phase === config.phaseRadii.length - 1 ? config.phaseRadii.length * config.phaseDuration : (phase + 1) * config.phaseDuration;

  return {
    phase,
    center: config.center,
    radius: config.phaseRadii[phase]!,
    nextShrinkTime,
    outsideDamagePerSecond: config.outsideDamagePerSecond
  };
}

export const neonGrid: MapDefinition = {
  id: "neon-grid",
  name: "Neon Grid",
  size: vec(900, 620),
  walls: [
    { id: "center-short-a", rect: rect(405, 210, 90, 24) },
    { id: "center-short-b", rect: rect(405, 386, 90, 24) },
    { id: "left-cover", rect: rect(210, 275, 32, 70) },
    { id: "right-cover", rect: rect(658, 275, 32, 70) }
  ],
  spawnPoints: [vec(120, 120), vec(780, 500), vec(120, 500), vec(780, 120)],
  weaponSpawnPoints: [
    { id: "grid-melee-a", position: vec(310, 310), allowedTypes: ["melee"] },
    { id: "grid-ranged-a", position: vec(450, 140), allowedTypes: ["ranged"] },
    { id: "grid-melee-b", position: vec(590, 310), allowedTypes: ["melee"] },
    { id: "grid-ranged-b", position: vec(450, 480), allowedTypes: ["ranged"] }
  ],
  safeZone: { center: vec(450, 310), phaseRadii: [430, 285, 150], phaseDuration: 45, outsideDamagePerSecond: 9 }
};

export const foundryLanes: MapDefinition = {
  id: "foundry-lanes",
  name: "Foundry Lanes",
  size: vec(900, 620),
  walls: [
    { id: "lane-top-left", rect: rect(180, 160, 280, 28) },
    { id: "lane-top-right", rect: rect(540, 160, 180, 28) },
    { id: "lane-bottom-left", rect: rect(180, 432, 180, 28) },
    { id: "lane-bottom-right", rect: rect(440, 432, 280, 28) },
    { id: "vertical-choke-a", rect: rect(315, 250, 32, 120) },
    { id: "vertical-choke-b", rect: rect(553, 250, 32, 120) }
  ],
  spawnPoints: [vec(112, 310), vec(788, 310), vec(450, 88), vec(450, 532)],
  weaponSpawnPoints: [
    { id: "foundry-melee-a", position: vec(240, 310), allowedTypes: ["melee"] },
    { id: "foundry-melee-b", position: vec(660, 310), allowedTypes: ["melee"] },
    { id: "foundry-ranged-a", position: vec(450, 222), allowedTypes: ["ranged"] },
    { id: "foundry-ranged-b", position: vec(450, 398), allowedTypes: ["ranged"] }
  ],
  safeZone: { center: vec(450, 310), phaseRadii: [420, 260, 135], phaseDuration: 45, outsideDamagePerSecond: 10 }
};

export const skylineRuins: MapDefinition = {
  id: "skyline-ruins",
  name: "Skyline Ruins",
  size: vec(900, 620),
  walls: [
    { id: "ruin-a", rect: rect(260, 180, 52, 118) },
    { id: "ruin-b", rect: rect(598, 322, 52, 118) },
    { id: "ruin-c", rect: rect(392, 288, 126, 28) },
    { id: "ruin-d", rect: rect(150, 438, 126, 28) },
    { id: "ruin-e", rect: rect(624, 154, 126, 28) }
  ],
  spawnPoints: [vec(130, 130), vec(770, 490), vec(160, 500), vec(740, 120)],
  weaponSpawnPoints: [
    { id: "sky-ranged-a", position: vec(448, 118), allowedTypes: ["ranged"] },
    { id: "sky-ranged-b", position: vec(448, 502), allowedTypes: ["ranged"] },
    { id: "sky-melee-a", position: vec(350, 310), allowedTypes: ["melee"] },
    { id: "sky-melee-b", position: vec(570, 310), allowedTypes: ["melee"] }
  ],
  safeZone: { center: vec(450, 310), phaseRadii: [435, 295, 165], phaseDuration: 45, outsideDamagePerSecond: 8 }
};

export const arenaMaps = [neonGrid, foundryLanes, skylineRuins] as const;

export function mapByID(id: string): MapDefinition {
  return arenaMaps.find((map) => map.id === id) ?? neonGrid;
}
