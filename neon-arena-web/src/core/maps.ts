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

const standardSafeZone = (centerX: number, centerY: number, radii: [number, number, number], damage = 9): SafeZoneConfig => ({
  center: vec(centerX, centerY),
  phaseRadii: radii,
  phaseDuration: 58,
  outsideDamagePerSecond: damage
});

export const neonGrid: MapDefinition = {
  id: "neon-grid",
  name: "Ion Rooftop Circuit",
  size: vec(1600, 1100),
  art: { backgroundKey: "map-ion-rooftop", wallKey: "wall-ion", accent: "#00e5ff", mood: "rooftop circuit" },
  walls: [
    { id: "north-loop-cover", rect: rect(520, 210, 360, 42) },
    { id: "south-loop-cover", rect: rect(680, 848, 360, 42) },
    { id: "left-core-cover", rect: rect(300, 432, 54, 250) },
    { id: "right-core-cover", rect: rect(1246, 432, 54, 250) },
    { id: "center-bridge-a", rect: rect(680, 470, 250, 42) },
    { id: "center-bridge-b", rect: rect(590, 608, 250, 42) },
    { id: "vent-a", rect: rect(430, 700, 120, 60) },
    { id: "vent-b", rect: rect(1050, 340, 120, 60) }
  ],
  spawnPoints: [vec(160, 160), vec(1440, 940), vec(170, 930), vec(1430, 170)],
  weaponSpawnPoints: [
    { id: "grid-blade-a", position: vec(448, 548), allowedTypes: ["melee"], weaponIDs: ["energy-blade"] },
    { id: "grid-blade-b", position: vec(1152, 548), allowedTypes: ["melee"], weaponIDs: ["energy-blade"] },
    { id: "grid-hammer-a", position: vec(800, 320), allowedTypes: ["melee"], weaponIDs: ["shock-hammer"] },
    { id: "grid-hammer-b", position: vec(800, 780), allowedTypes: ["melee"], weaponIDs: ["shock-hammer"] },
    { id: "grid-rifle-a", position: vec(512, 300), allowedTypes: ["ranged"], weaponIDs: ["pulse-rifle"] },
    { id: "grid-rifle-b", position: vec(1088, 800), allowedTypes: ["ranged"], weaponIDs: ["pulse-rifle"] },
    { id: "grid-carbine-a", position: vec(1050, 550), allowedTypes: ["ranged"], weaponIDs: ["laser-carbine"] },
    { id: "grid-carbine-b", position: vec(550, 550), allowedTypes: ["ranged"], weaponIDs: ["laser-carbine"] }
  ],
  safeZone: standardSafeZone(800, 550, [780, 520, 290], 9)
};

export const foundryLanes: MapDefinition = {
  id: "foundry-lanes",
  name: "Foundry Overpass Chase",
  size: vec(1600, 1100),
  art: { backgroundKey: "map-foundry-overpass", wallKey: "wall-foundry", accent: "#ff5a2e", mood: "industrial overpass" },
  walls: [
    { id: "foundry-north-lane", rect: rect(250, 190, 610, 46) },
    { id: "foundry-north-gap", rect: rect(1030, 190, 330, 46) },
    { id: "foundry-south-left", rect: rect(250, 854, 340, 46) },
    { id: "foundry-south-right", rect: rect(760, 854, 610, 46) },
    { id: "foundry-choke-a", rect: rect(520, 360, 58, 280) },
    { id: "foundry-choke-b", rect: rect(1022, 460, 58, 280) },
    { id: "foundry-crane-a", rect: rect(690, 405, 250, 42) },
    { id: "foundry-crane-b", rect: rect(600, 680, 250, 42) }
  ],
  spawnPoints: [vec(150, 550), vec(1450, 550), vec(800, 120), vec(800, 980)],
  weaponSpawnPoints: [
    { id: "foundry-hammer-a", position: vec(382, 550), allowedTypes: ["melee"], weaponIDs: ["shock-hammer"] },
    { id: "foundry-hammer-b", position: vec(1218, 550), allowedTypes: ["melee"], weaponIDs: ["shock-hammer"] },
    { id: "foundry-blade-a", position: vec(800, 330), allowedTypes: ["melee"], weaponIDs: ["energy-blade"] },
    { id: "foundry-blade-b", position: vec(800, 770), allowedTypes: ["melee"], weaponIDs: ["energy-blade"] },
    { id: "foundry-carbine-a", position: vec(500, 760), allowedTypes: ["ranged"], weaponIDs: ["laser-carbine"] },
    { id: "foundry-carbine-b", position: vec(1100, 300), allowedTypes: ["ranged"], weaponIDs: ["laser-carbine"] },
    { id: "foundry-rifle-a", position: vec(620, 550), allowedTypes: ["ranged"], weaponIDs: ["pulse-rifle"] },
    { id: "foundry-rifle-b", position: vec(980, 550), allowedTypes: ["ranged"], weaponIDs: ["pulse-rifle"] }
  ],
  safeZone: standardSafeZone(800, 550, [760, 500, 270], 10)
};

export const skylineRuins: MapDefinition = {
  id: "skyline-ruins",
  name: "Skyline Garden Ruins",
  size: vec(1600, 1100),
  art: { backgroundKey: "map-skyline-garden", wallKey: "wall-garden", accent: "#38f5d4", mood: "botanical ruins" },
  walls: [
    { id: "glasshouse-a", rect: rect(380, 250, 70, 260) },
    { id: "glasshouse-b", rect: rect(1150, 590, 70, 260) },
    { id: "pool-bridge-a", rect: rect(650, 390, 310, 44) },
    { id: "pool-bridge-b", rect: rect(610, 680, 310, 44) },
    { id: "hedge-a", rect: rect(230, 780, 280, 46) },
    { id: "hedge-b", rect: rect(1090, 224, 280, 46) },
    { id: "ruin-column-a", rect: rect(540, 560, 90, 90) },
    { id: "ruin-column-b", rect: rect(980, 460, 90, 90) }
  ],
  spawnPoints: [vec(170, 170), vec(1430, 930), vec(180, 930), vec(1420, 160)],
  weaponSpawnPoints: [
    { id: "sky-blade-a", position: vec(570, 540), allowedTypes: ["melee"], weaponIDs: ["energy-blade"] },
    { id: "sky-blade-b", position: vec(1110, 560), allowedTypes: ["melee"], weaponIDs: ["energy-blade"] },
    { id: "sky-hammer-a", position: vec(800, 250), allowedTypes: ["melee"], weaponIDs: ["shock-hammer"] },
    { id: "sky-hammer-b", position: vec(800, 850), allowedTypes: ["melee"], weaponIDs: ["shock-hammer"] },
    { id: "sky-rifle-a", position: vec(380, 610), allowedTypes: ["ranged"], weaponIDs: ["pulse-rifle"] },
    { id: "sky-rifle-b", position: vec(1220, 490), allowedTypes: ["ranged"], weaponIDs: ["pulse-rifle"] },
    { id: "sky-carbine-a", position: vec(630, 830), allowedTypes: ["ranged"], weaponIDs: ["laser-carbine"] },
    { id: "sky-carbine-b", position: vec(970, 270), allowedTypes: ["ranged"], weaponIDs: ["laser-carbine"] }
  ],
  safeZone: standardSafeZone(800, 550, [790, 540, 310], 8)
};

export const dockyardSprawl: MapDefinition = {
  id: "dockyard-sprawl",
  name: "Orbital Dockyard Sprawl",
  size: vec(1700, 1120),
  art: { backgroundKey: "map-dockyard-sprawl", wallKey: "wall-ion", accent: "#7dd3fc", mood: "orbital cargo dock" },
  walls: [
    { id: "cargo-a", rect: rect(330, 240, 300, 54) },
    { id: "cargo-b", rect: rect(1030, 826, 360, 54) },
    { id: "container-a", rect: rect(260, 520, 64, 300) },
    { id: "container-b", rect: rect(1380, 250, 64, 300) },
    { id: "dock-core-a", rect: rect(690, 470, 130, 64) },
    { id: "dock-core-b", rect: rect(880, 586, 130, 64) },
    { id: "cargo-c", rect: rect(700, 230, 240, 44) },
    { id: "cargo-d", rect: rect(720, 870, 240, 44) }
  ],
  spawnPoints: [vec(160, 180), vec(1540, 940), vec(180, 940), vec(1520, 180)],
  weaponSpawnPoints: [
    { id: "dock-blade-a", position: vec(480, 560), allowedTypes: ["melee"], weaponIDs: ["energy-blade"] },
    { id: "dock-blade-b", position: vec(1220, 560), allowedTypes: ["melee"], weaponIDs: ["energy-blade"] },
    { id: "dock-hammer-a", position: vec(850, 360), allowedTypes: ["melee"], weaponIDs: ["shock-hammer"] },
    { id: "dock-hammer-b", position: vec(850, 760), allowedTypes: ["melee"], weaponIDs: ["shock-hammer"] },
    { id: "dock-rifle-a", position: vec(390, 880), allowedTypes: ["ranged"], weaponIDs: ["pulse-rifle"] },
    { id: "dock-rifle-b", position: vec(1310, 240), allowedTypes: ["ranged"], weaponIDs: ["pulse-rifle"] },
    { id: "dock-carbine-a", position: vec(620, 790), allowedTypes: ["ranged"], weaponIDs: ["laser-carbine"] },
    { id: "dock-carbine-b", position: vec(1080, 330), allowedTypes: ["ranged"], weaponIDs: ["laser-carbine"] }
  ],
  safeZone: standardSafeZone(850, 560, [820, 560, 320], 9)
};

export const marketCrossfire: MapDefinition = {
  id: "market-crossfire",
  name: "Night Market Crossfire",
  size: vec(1600, 1100),
  art: { backgroundKey: "map-market-crossfire", wallKey: "wall-market", accent: "#f472b6", mood: "neon market" },
  walls: [
    { id: "market-stall-a", rect: rect(280, 300, 260, 48) },
    { id: "market-stall-b", rect: rect(1060, 300, 260, 48) },
    { id: "market-stall-c", rect: rect(280, 752, 260, 48) },
    { id: "market-stall-d", rect: rect(1060, 752, 260, 48) },
    { id: "center-kiosk-a", rect: rect(700, 470, 80, 210) },
    { id: "center-kiosk-b", rect: rect(820, 420, 80, 210) },
    { id: "sign-wall-a", rect: rect(550, 220, 280, 42) },
    { id: "sign-wall-b", rect: rect(770, 838, 280, 42) }
  ],
  spawnPoints: [vec(170, 550), vec(1430, 550), vec(800, 140), vec(800, 960)],
  weaponSpawnPoints: [
    { id: "market-blade-a", position: vec(600, 550), allowedTypes: ["melee"], weaponIDs: ["energy-blade"] },
    { id: "market-blade-b", position: vec(1000, 550), allowedTypes: ["melee"], weaponIDs: ["energy-blade"] },
    { id: "market-hammer-a", position: vec(430, 500), allowedTypes: ["melee"], weaponIDs: ["shock-hammer"] },
    { id: "market-hammer-b", position: vec(1170, 600), allowedTypes: ["melee"], weaponIDs: ["shock-hammer"] },
    { id: "market-rifle-a", position: vec(560, 820), allowedTypes: ["ranged"], weaponIDs: ["pulse-rifle"] },
    { id: "market-rifle-b", position: vec(1040, 280), allowedTypes: ["ranged"], weaponIDs: ["pulse-rifle"] },
    { id: "market-carbine-a", position: vec(520, 430), allowedTypes: ["ranged"], weaponIDs: ["laser-carbine"] },
    { id: "market-carbine-b", position: vec(1080, 670), allowedTypes: ["ranged"], weaponIDs: ["laser-carbine"] }
  ],
  safeZone: standardSafeZone(800, 550, [770, 510, 285], 9)
};

export const arenaMaps = [neonGrid, foundryLanes, skylineRuins, dockyardSprawl, marketCrossfire] as const;

export function mapByID(id: string): MapDefinition {
  return arenaMaps.find((map) => map.id === id) ?? neonGrid;
}
