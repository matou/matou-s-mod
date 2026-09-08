import assert from "node:assert/strict";
import test from "node:test";

const onceHooks = new Map();
const hooks = new Map();
const settings = new Map();

globalThis.Hooks = {
  once: (name, callback) => onceHooks.set(name, callback),
  on: (name, callback) => hooks.set(name, callback)
};

globalThis.game = {
  user: null,
  settings: {
    register: (_moduleId, key, config) => settings.set(key, config),
    get: () => false
  }
};

const dockedTracker = { rendered: true, renderCount: 0, render() { this.renderCount += 1; } };
const popoutTracker = { rendered: true, renderCount: 0, render() { this.renderCount += 1; } };
dockedTracker.popout = popoutTracker;
globalThis.ui = { combat: dockedTracker };

class TestElement {
  constructor(elementsBySelector = {}) {
    this.elementsBySelector = elementsBySelector;
  }

  querySelectorAll(selector) {
    return this.elementsBySelector[selector] ?? [];
  }
}

globalThis.HTMLElement = TestElement;

await import("../scripts/main.js");

test("registers and applies a GM-only, default-on combat tracker setting", () => {
  const init = onceHooks.get("init");
  init();

  const setting = settings.get("showCombatTrackerHp");
  assert.equal(setting.scope, "world");
  assert.equal(setting.config, true);
  assert.equal(setting.type, Boolean);
  assert.equal(setting.default, true);

  game.user = { isGM: true };
  setting.onChange(false);
  assert.equal(dockedTracker.renderCount, 1);
  assert.equal(popoutTracker.renderCount, 1);
});

test("removes tracker additions and skips actor refreshes while disabled", () => {
  game.user.isGM = true;
  const hp = { removed: false, remove() { this.removed = true; } };
  const classList = {
    removed: [],
    remove(className) { this.removed.push(className); }
  };
  const row = { classList };
  const root = new TestElement({
    ".matou-s-mod-combat-hp": [hp],
    ".matou-s-mod-defeat-threshold": [row]
  });

  hooks.get("renderCombatTracker")({}, root);
  assert.equal(hp.removed, true);
  assert.deepEqual(classList.removed, ["matou-s-mod-defeat-threshold"]);

  dockedTracker.renderCount = 0;
  popoutTracker.renderCount = 0;
  hooks.get("updateActor")(
    { id: "actor-id" },
    { system: { attributes: { hp: { value: 3 } } } }
  );
  assert.equal(dockedTracker.renderCount, 0);
  assert.equal(popoutTracker.renderCount, 0);
});
