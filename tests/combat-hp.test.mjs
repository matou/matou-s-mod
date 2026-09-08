import assert from "node:assert/strict";
import test from "node:test";

import { changesCombatHp, getCombatHpDisplay } from "../scripts/combat-hp.mjs";

class TestRoll {
  constructor(formula, data) {
    this.formula = formula;
    this.data = data;
  }

  async evaluate(options) {
    assert.equal(this.formula, "2d6 + @bonus");
    this.total = options.minimize ? 2 + this.data.bonus : 12 + this.data.bonus;
    return this;
  }
}

test("formats current HP with the difference between maximum and minimum rolls", async () => {
  const actor = {
    system: { attributes: { hp: { value: 18, max: 18, formula: "2d6 + @bonus" } } },
    getRollData: () => ({ bonus: 6 })
  };

  assert.deepEqual(await getCombatHpDisplay(actor, TestRoll), {
    current: 18,
    maximum: 18,
    threshold: 10,
    isAtOrBelowThreshold: false,
    text: "18/18 (10)"
  });
});

test("marks HP at or below the defeat threshold", async () => {
  const actor = {
    system: { attributes: { hp: { value: 10, max: 18, formula: "2d6 + @bonus" } } },
    getRollData: () => ({ bonus: 6 })
  };

  const atThreshold = await getCombatHpDisplay(actor, TestRoll);
  assert.equal(atThreshold.isAtOrBelowThreshold, true);

  actor.system.attributes.hp.value = 9;
  const belowThreshold = await getCombatHpDisplay(actor, TestRoll);
  assert.equal(belowThreshold.isAtOrBelowThreshold, true);
});

test("returns no display when HP or its formula is unavailable", async () => {
  assert.equal(await getCombatHpDisplay({}, TestRoll), null);
  assert.equal(await getCombatHpDisplay({ system: { attributes: { hp: { value: 4, max: 4, formula: "" } } } }, TestRoll), null);
  assert.equal(await getCombatHpDisplay({ system: { attributes: { hp: { value: 4, formula: "1d4" } } } }, TestRoll), null);
});

test("returns no display for an invalid formula", async () => {
  class InvalidRoll {
    async evaluate() {
      throw new Error("Invalid formula");
    }
  }

  const actor = { system: { attributes: { hp: { value: 4, max: 4, formula: "invalid" } } } };
  assert.equal(await getCombatHpDisplay(actor, InvalidRoll), null);
});

test("recognizes only relevant Actor HP updates", () => {
  assert.equal(changesCombatHp({ system: { attributes: { hp: { value: 7 } } } }), true);
  assert.equal(changesCombatHp({ system: { attributes: { hp: { max: 12 } } } }), true);
  assert.equal(changesCombatHp({ system: { attributes: { hp: { formula: "2d6+6" } } } }), true);
  assert.equal(changesCombatHp({ "system.attributes.hp.value": 7 }), true);
  assert.equal(changesCombatHp({ "system.attributes.hp.max": 12 }), true);
  assert.equal(changesCombatHp({ system: { attributes: { hp: { temp: 3 } } } }), false);
  assert.equal(changesCombatHp({ name: "Goblin" }), false);
});
