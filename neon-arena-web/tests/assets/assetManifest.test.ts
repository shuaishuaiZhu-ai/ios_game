import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { arenaAssets, characterAssets, mapAssets, weaponAssets } from "../../src/game/assets";

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
    expect(mapAssets.filter((asset) => asset.key.startsWith("map-")).length).toBe(5);
    expect(characterAssets).toHaveLength(4);
    expect(weaponAssets.filter((asset) => asset.key.startsWith("weapon-")).map((asset) => asset.key).sort()).toEqual([
      "weapon-energy-shield-baton",
      "weapon-neon-katana",
      "weapon-pulse-bow",
      "weapon-ray-pistol"
    ].sort());
  });
});
