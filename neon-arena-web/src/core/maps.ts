import { rect, vec } from "./geometry";
import type { MapDefinition, SafeZoneConfig } from "./models";

export function safeZoneState(config: SafeZoneConfig, elapsedTime: number) {
  const rawPhase = Math.floor(elapsedTime / config.phaseDuration);
  const phase = Math.min(Math.max(rawPhase, 0), config.phaseRadii.length - 1);
  const nextShrinkTime = phase === config.phaseRadii.length - 1 ? config.phaseRadii.length * config.phaseDuration : (phase + 1) * config.phaseDuration;
  return { phase, center: config.center, radius: config.phaseRadii[phase]!, nextShrinkTime, outsideDamagePerSecond: config.outsideDamagePerSecond };
}

export const map01_skyline_garden_ruins: MapDefinition = {
  id: "map01_skyline_garden_ruins",
  name: "Skyline Garden Ruins",
  size: vec(1600, 1100),
  art: {
    backgroundKey: "map-map01_skyline_garden_ruins",
    thumbnailKey: "thumb-map01_skyline_garden_ruins",
    accent: "#38f5d4",
    mood: "cyber botanical rooftop"
  },
  walls: [
    { id: "map01_skyline_garden_ruins-c1", kind: "solid", rect: rect(615, 420, 260, 82) },
    { id: "map01_skyline_garden_ruins-c2", kind: "solid", rect: rect(1055, 390, 230, 98) },
    { id: "map01_skyline_garden_ruins-c3", kind: "solid", rect: rect(455, 704, 210, 76) },
    { id: "map01_skyline_garden_ruins-c4", kind: "solid", rect: rect(250, 362, 120, 160) },
    { id: "map01_skyline_garden_ruins-c5", kind: "solid", rect: rect(1005, 700, 250, 76) },
    { id: "map01_skyline_garden_ruins-c6", kind: "solid", rect: rect(735, 205, 250, 64) },
    { id: "map01_skyline_garden_ruins-c7", kind: "softCover", rect: rect(522, 304, 210, 62) },
    { id: "map01_skyline_garden_ruins-c8", kind: "softCover", rect: rect(330, 800, 260, 70) },
    { id: "map01_skyline_garden_ruins-c9", kind: "softCover", rect: rect(958, 260, 230, 72) },
    { id: "map01_skyline_garden_ruins-c10", kind: "softCover", rect: rect(1160, 800, 180, 60) },
    { id: "map01_skyline_garden_ruins-c11", kind: "softCover", rect: rect(190, 620, 170, 64) },
  ],
  spawnPoints: [
    vec(378, 280),
    vec(1210, 315),
    vec(302, 842),
    vec(1105, 832),
  ],
  weaponSpawnPoints: [
    { id: "map01_skyline_garden_ruins-w1", position: vec(438, 444), allowedTypes: ["melee"], weaponIDs: ["neon-katana"] },
    { id: "map01_skyline_garden_ruins-w2", position: vec(965, 432), allowedTypes: ["ranged"], weaponIDs: ["ray-pistol", "pulse-bow"] },
    { id: "map01_skyline_garden_ruins-w3", position: vec(790, 705), allowedTypes: ["ranged"], weaponIDs: ["ray-pistol", "pulse-bow"] },
    { id: "map01_skyline_garden_ruins-w4", position: vec(1050, 822), allowedTypes: ["utility"], weaponIDs: ["energy-shield-baton"] },
    { id: "map01_skyline_garden_ruins-w5", position: vec(590, 252), allowedTypes: ["melee"], weaponIDs: ["neon-katana"] },
  ],
  safeZone: { center: vec(800, 550), phaseRadii: [500, 322, 145], phaseDuration: 45, outsideDamagePerSecond: 9 }
};

export const map02_transit_skybridge_hydroponics: MapDefinition = {
  id: "map02_transit_skybridge_hydroponics",
  name: "Transit Skybridge Hydroponics",
  size: vec(1600, 1100),
  art: {
    backgroundKey: "map-map02_transit_skybridge_hydroponics",
    thumbnailKey: "thumb-map02_transit_skybridge_hydroponics",
    accent: "#38f5d4",
    mood: "cyber botanical rooftop"
  },
  walls: [
    { id: "map02_transit_skybridge_hydroponics-c1", kind: "solid", rect: rect(480, 230, 130, 270) },
    { id: "map02_transit_skybridge_hydroponics-c2", kind: "solid", rect: rect(800, 242, 420, 66) },
    { id: "map02_transit_skybridge_hydroponics-c3", kind: "solid", rect: rect(810, 752, 390, 72) },
    { id: "map02_transit_skybridge_hydroponics-c4", kind: "solid", rect: rect(374, 700, 110, 200) },
    { id: "map02_transit_skybridge_hydroponics-c5", kind: "solid", rect: rect(1220, 514, 130, 220) },
    { id: "map02_transit_skybridge_hydroponics-c6", kind: "softCover", rect: rect(215, 330, 190, 62) },
    { id: "map02_transit_skybridge_hydroponics-c7", kind: "softCover", rect: rect(650, 420, 160, 58) },
    { id: "map02_transit_skybridge_hydroponics-c8", kind: "softCover", rect: rect(645, 610, 230, 62) },
    { id: "map02_transit_skybridge_hydroponics-c9", kind: "softCover", rect: rect(1050, 320, 200, 62) },
    { id: "map02_transit_skybridge_hydroponics-c10", kind: "softCover", rect: rect(213, 815, 260, 74) },
  ],
  spawnPoints: [
    vec(338, 250),
    vec(1255, 250),
    vec(328, 930),
    vec(1220, 850),
  ],
  weaponSpawnPoints: [
    { id: "map02_transit_skybridge_hydroponics-w1", position: vec(700, 300), allowedTypes: ["ranged"], weaponIDs: ["ray-pistol", "pulse-bow"] },
    { id: "map02_transit_skybridge_hydroponics-w2", position: vec(758, 548), allowedTypes: ["utility"], weaponIDs: ["energy-shield-baton"] },
    { id: "map02_transit_skybridge_hydroponics-w3", position: vec(321, 705), allowedTypes: ["melee"], weaponIDs: ["neon-katana"] },
    { id: "map02_transit_skybridge_hydroponics-w4", position: vec(1160, 575), allowedTypes: ["ranged"], weaponIDs: ["ray-pistol", "pulse-bow"] },
    { id: "map02_transit_skybridge_hydroponics-w5", position: vec(1024, 858), allowedTypes: ["melee"], weaponIDs: ["neon-katana"] },
  ],
  safeZone: { center: vec(800, 560), phaseRadii: [520, 332, 145], phaseDuration: 45, outsideDamagePerSecond: 9 }
};

export const map03_reactor_orchid_courtyard: MapDefinition = {
  id: "map03_reactor_orchid_courtyard",
  name: "Reactor Orchid Courtyard",
  size: vec(1600, 1100),
  art: {
    backgroundKey: "map-map03_reactor_orchid_courtyard",
    thumbnailKey: "thumb-map03_reactor_orchid_courtyard",
    accent: "#38f5d4",
    mood: "cyber botanical rooftop"
  },
  walls: [
    { id: "map03_reactor_orchid_courtyard-c1", kind: "solid", rect: rect(635, 312, 330, 75) },
    { id: "map03_reactor_orchid_courtyard-c2", kind: "solid", rect: rect(640, 715, 325, 75) },
    { id: "map03_reactor_orchid_courtyard-c3", kind: "solid", rect: rect(386, 480, 90, 230) },
    { id: "map03_reactor_orchid_courtyard-c4", kind: "solid", rect: rect(1120, 455, 92, 240) },
    { id: "map03_reactor_orchid_courtyard-c5", kind: "solid", rect: rect(252, 742, 245, 70) },
    { id: "map03_reactor_orchid_courtyard-c6", kind: "solid", rect: rect(1105, 230, 230, 64) },
    { id: "map03_reactor_orchid_courtyard-c7", kind: "softCover", rect: rect(570, 472, 110, 150) },
    { id: "map03_reactor_orchid_courtyard-c8", kind: "softCover", rect: rect(920, 470, 110, 150) },
    { id: "map03_reactor_orchid_courtyard-c9", kind: "softCover", rect: rect(708, 445, 180, 64) },
    { id: "map03_reactor_orchid_courtyard-c10", kind: "softCover", rect: rect(716, 626, 175, 64) },
    { id: "map03_reactor_orchid_courtyard-c11", kind: "softCover", rect: rect(265, 244, 205, 65) },
    { id: "map03_reactor_orchid_courtyard-c12", kind: "softCover", rect: rect(1070, 795, 230, 70) },
  ],
  spawnPoints: [
    vec(438, 335),
    vec(1152, 333),
    vec(430, 835),
    vec(1162, 775),
  ],
  weaponSpawnPoints: [
    { id: "map03_reactor_orchid_courtyard-w1", position: vec(800, 548), allowedTypes: ["utility"], weaponIDs: ["energy-shield-baton"] },
    { id: "map03_reactor_orchid_courtyard-w2", position: vec(519, 610), allowedTypes: ["ranged"], weaponIDs: ["ray-pistol", "pulse-bow"] },
    { id: "map03_reactor_orchid_courtyard-w3", position: vec(1065, 596), allowedTypes: ["melee"], weaponIDs: ["neon-katana"] },
    { id: "map03_reactor_orchid_courtyard-w4", position: vec(705, 270), allowedTypes: ["ranged"], weaponIDs: ["ray-pistol", "pulse-bow"] },
    { id: "map03_reactor_orchid_courtyard-w5", position: vec(892, 827), allowedTypes: ["melee"], weaponIDs: ["neon-katana"] },
  ],
  safeZone: { center: vec(800, 550), phaseRadii: [500, 322, 145], phaseDuration: 45, outsideDamagePerSecond: 9 }
};

export const map04_rainmarket_terrace_grove: MapDefinition = {
  id: "map04_rainmarket_terrace_grove",
  name: "Rainmarket Terrace Grove",
  size: vec(1600, 1100),
  art: {
    backgroundKey: "map-map04_rainmarket_terrace_grove",
    thumbnailKey: "thumb-map04_rainmarket_terrace_grove",
    accent: "#38f5d4",
    mood: "cyber botanical rooftop"
  },
  walls: [
    { id: "map04_rainmarket_terrace_grove-c1", kind: "solid", rect: rect(280, 285, 270, 78) },
    { id: "map04_rainmarket_terrace_grove-c2", kind: "solid", rect: rect(650, 235, 115, 250) },
    { id: "map04_rainmarket_terrace_grove-c3", kind: "solid", rect: rect(960, 250, 120, 245) },
    { id: "map04_rainmarket_terrace_grove-c4", kind: "solid", rect: rect(1050, 685, 290, 78) },
    { id: "map04_rainmarket_terrace_grove-c5", kind: "solid", rect: rect(475, 780, 280, 70) },
    { id: "map04_rainmarket_terrace_grove-c6", kind: "solid", rect: rect(280, 530, 170, 75) },
    { id: "map04_rainmarket_terrace_grove-c7", kind: "softCover", rect: rect(570, 506, 310, 80) },
    { id: "map04_rainmarket_terrace_grove-c8", kind: "softCover", rect: rect(825, 520, 120, 190) },
    { id: "map04_rainmarket_terrace_grove-c9", kind: "softCover", rect: rect(205, 760, 180, 62) },
    { id: "map04_rainmarket_terrace_grove-c10", kind: "softCover", rect: rect(1165, 332, 160, 58) },
    { id: "map04_rainmarket_terrace_grove-c11", kind: "softCover", rect: rect(1035, 827, 200, 58) },
  ],
  spawnPoints: [
    vec(360, 235),
    vec(1190, 300),
    vec(405, 820),
    vec(1275, 815),
  ],
  weaponSpawnPoints: [
    { id: "map04_rainmarket_terrace_grove-w1", position: vec(610, 400), allowedTypes: ["melee"], weaponIDs: ["neon-katana"] },
    { id: "map04_rainmarket_terrace_grove-w2", position: vec(930, 415), allowedTypes: ["ranged"], weaponIDs: ["ray-pistol", "pulse-bow"] },
    { id: "map04_rainmarket_terrace_grove-w3", position: vec(758, 674), allowedTypes: ["utility"], weaponIDs: ["energy-shield-baton"] },
    { id: "map04_rainmarket_terrace_grove-w4", position: vec(1120, 800), allowedTypes: ["ranged"], weaponIDs: ["ray-pistol", "pulse-bow"] },
    { id: "map04_rainmarket_terrace_grove-w5", position: vec(355, 655), allowedTypes: ["melee"], weaponIDs: ["neon-katana"] },
  ],
  safeZone: { center: vec(800, 560), phaseRadii: [515, 330, 145], phaseDuration: 45, outsideDamagePerSecond: 9 }
};

export const map05_cloud_spire_arboretum: MapDefinition = {
  id: "map05_cloud_spire_arboretum",
  name: "Cloud Spire Arboretum",
  size: vec(1600, 1100),
  art: {
    backgroundKey: "map-map05_cloud_spire_arboretum",
    thumbnailKey: "thumb-map05_cloud_spire_arboretum",
    accent: "#38f5d4",
    mood: "cyber botanical rooftop"
  },
  walls: [
    { id: "map05_cloud_spire_arboretum-c1", kind: "solid", rect: rect(545, 250, 240, 70) },
    { id: "map05_cloud_spire_arboretum-c2", kind: "solid", rect: rect(880, 250, 260, 70) },
    { id: "map05_cloud_spire_arboretum-c3", kind: "solid", rect: rect(700, 472, 190, 150) },
    { id: "map05_cloud_spire_arboretum-c4", kind: "solid", rect: rect(1060, 570, 235, 75) },
    { id: "map05_cloud_spire_arboretum-c5", kind: "solid", rect: rect(300, 602, 240, 80) },
    { id: "map05_cloud_spire_arboretum-c6", kind: "solid", rect: rect(520, 805, 160, 70) },
    { id: "map05_cloud_spire_arboretum-c7", kind: "solid", rect: rect(890, 802, 230, 72) },
    { id: "map05_cloud_spire_arboretum-c8", kind: "softCover", rect: rect(270, 260, 165, 64) },
    { id: "map05_cloud_spire_arboretum-c9", kind: "softCover", rect: rect(1160, 280, 190, 68) },
    { id: "map05_cloud_spire_arboretum-c10", kind: "softCover", rect: rect(492, 467, 140, 160) },
    { id: "map05_cloud_spire_arboretum-c11", kind: "softCover", rect: rect(958, 455, 140, 165) },
    { id: "map05_cloud_spire_arboretum-c12", kind: "softCover", rect: rect(255, 812, 215, 64) },
    { id: "map05_cloud_spire_arboretum-c13", kind: "softCover", rect: rect(1170, 760, 170, 64) },
  ],
  spawnPoints: [
    vec(382, 200),
    vec(1210, 250),
    vec(362, 785),
    vec(1220, 873),
  ],
  weaponSpawnPoints: [
    { id: "map05_cloud_spire_arboretum-w1", position: vec(919, 548), allowedTypes: ["utility"], weaponIDs: ["energy-shield-baton"] },
    { id: "map05_cloud_spire_arboretum-w2", position: vec(423, 365), allowedTypes: ["ranged"], weaponIDs: ["ray-pistol", "pulse-bow"] },
    { id: "map05_cloud_spire_arboretum-w3", position: vec(1168, 395), allowedTypes: ["melee"], weaponIDs: ["neon-katana"] },
    { id: "map05_cloud_spire_arboretum-w4", position: vec(383, 706), allowedTypes: ["melee"], weaponIDs: ["neon-katana"] },
    { id: "map05_cloud_spire_arboretum-w5", position: vec(1080, 718), allowedTypes: ["ranged"], weaponIDs: ["ray-pistol", "pulse-bow"] },
  ],
  safeZone: { center: vec(805, 550), phaseRadii: [510, 328, 145], phaseDuration: 45, outsideDamagePerSecond: 9 }
};

export const arenaMaps = [
  map01_skyline_garden_ruins,
  map02_transit_skybridge_hydroponics,
  map03_reactor_orchid_courtyard,
  map04_rainmarket_terrace_grove,
  map05_cloud_spire_arboretum,
] as const;

export function mapByID(id: string): MapDefinition {
  return arenaMaps.find((map) => map.id === id) ?? arenaMaps[0]!;
}