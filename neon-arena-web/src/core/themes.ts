export interface VisualTheme {
  id: string;
  name: string;
  background: string;
  wallFill: string;
  wallStroke: string;
  localPlayer: string;
  remotePlayer: string;
  meleePickup: string;
  rangedPickup: string;
  projectile: string;
  safeZone: string;
  uiAccent: string;
}

export const visualThemes: VisualTheme[] = [
  {
    id: "ion-circuit",
    name: "Ion Circuit",
    background: "#04131f",
    wallFill: "#092332",
    wallStroke: "#00e5ff",
    localPlayer: "#00e5ff",
    remotePlayer: "#ff2bd6",
    meleePickup: "#ff2bd6",
    rangedPickup: "#ffe66d",
    projectile: "#9effff",
    safeZone: "#00e5ff",
    uiAccent: "#00e5ff"
  },
  {
    id: "foundry-glow",
    name: "Foundry Glow",
    background: "#120b10",
    wallFill: "#301620",
    wallStroke: "#ff5a2e",
    localPlayer: "#ffd166",
    remotePlayer: "#ef476f",
    meleePickup: "#ff477e",
    rangedPickup: "#f8d66d",
    projectile: "#ff9f1c",
    safeZone: "#ff5a2e",
    uiAccent: "#ff5a2e"
  },
  {
    id: "skyline-ruins",
    name: "Skyline Ruins",
    background: "#08111f",
    wallFill: "#17243a",
    wallStroke: "#7dd3fc",
    localPlayer: "#38bdf8",
    remotePlayer: "#a78bfa",
    meleePickup: "#f472b6",
    rangedPickup: "#bef264",
    projectile: "#e0f2fe",
    safeZone: "#38bdf8",
    uiAccent: "#a78bfa"
  }
];

export function themeByID(id: string): VisualTheme {
  return visualThemes.find((theme) => theme.id === id) ?? visualThemes[0]!;
}
