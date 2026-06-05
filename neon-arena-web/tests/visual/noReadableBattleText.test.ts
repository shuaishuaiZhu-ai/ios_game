import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("battle screen text policy", () => {
  it("does not render battle overlay text from ArenaScene", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/game/ArenaScene.ts"), "utf8");
    expect(source).not.toMatch(/add\.text/);
    expect(source).not.toMatch(/[\u4e00-\u9fff]/);
  });
});
