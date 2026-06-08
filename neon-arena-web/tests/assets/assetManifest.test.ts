import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { arenaAssets, characterAssets, characterPortraitAssets, characterSheetAssets, hudAssets, mapAssets, propAssets, vfxAssets, weaponAssets } from "../../src/game/assets";

describe("asset manifest", () => {
  it("references files that exist in public", () => {
    for (const asset of arenaAssets) {
      const relative = asset.path.replace(/^\//, "");
      const full = path.join(process.cwd(), "public", relative.replace(/^assets\//, "assets/"));
      expect(fs.existsSync(full), `${asset.key} -> ${asset.path}`).toBe(true);
      expect(asset.path.endsWith(".svg")).toBe(false);
    }
  });

  it("contains all required maps, characters and weapons", () => {
    expect(mapAssets.filter((asset) => asset.key.startsWith("map-")).length).toBe(6);
    expect(mapAssets.some((asset) => asset.key === "map-map06_foundry_lava_arena")).toBe(true);
    expect(characterAssets).toHaveLength(4);
    expect(characterSheetAssets).toHaveLength(4);
    expect(characterPortraitAssets).toHaveLength(4);
    for (const sheet of characterSheetAssets) {
      expect(sheet.kind).toBe("spritesheet");
      expect(sheet.frameWidth).toBe(256);
      expect(sheet.frameHeight).toBe(256);
    }
    expect(propAssets.length).toBeGreaterThanOrEqual(6);
    expect(vfxAssets.length).toBeGreaterThanOrEqual(8);
    expect(hudAssets.filter((asset) => asset.key.startsWith("hud-button-")).length).toBeGreaterThanOrEqual(5);
    expect(weaponAssets.filter((asset) => asset.key.startsWith("weapon-")).map((asset) => asset.key).sort()).toEqual([
      "weapon-energy-shield-baton",
      "weapon-neon-katana",
      "weapon-pulse-bow",
      "weapon-ray-pistol"
    ].sort());
  });
});
