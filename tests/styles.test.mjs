import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../styles/main.css", import.meta.url), "utf8");

test("combat HP backgrounds yield to Foundry's token-hover highlight", () => {
  for (const phase of ["defeat-threshold", "average-threshold"]) {
    assert.match(
      css,
      new RegExp(
        `\\.combatant\\.matou-s-mod-${phase}:not\\(\\.hover\\):not\\(:hover\\)\\s*\\{`
      )
    );
  }
});
