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

test("derives both HP thresholds from the formula", async () => {
  const actor = {
    system: { attributes: { hp: { value: 4, max: 18, formula: "2d6 + @bonus" } } },
    getRollData: () => ({ bonus: 6 })
  };

  assert.deepEqual(await getCombatHpDisplay(actor, TestRoll), {
    current: 4,
    maximum: 18,
    threshold: 10,
    averageThreshold: 5,
    isAtOrBelowThreshold: true,
    isAtOrBelowAverageThreshold: true,
    text: "4/18 (10)"
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

test("marks HP at or below maximum roll minus the formula's average HP", async () => {
  const actor = {
    system: { attributes: { hp: { value: 5, max: 18, formula: "2d6 + @bonus" } } },
    getRollData: () => ({ bonus: 6 })
  };

  const atAverageThreshold = await getCombatHpDisplay(actor, TestRoll);
  assert.equal(atAverageThreshold.averageThreshold, 5);
  assert.equal(atAverageThreshold.isAtOrBelowThreshold, true);
  assert.equal(atAverageThreshold.isAtOrBelowAverageThreshold, true);

  actor.system.attributes.hp.value = 4;
  const belowAverageThreshold = await getCombatHpDisplay(actor, TestRoll);
  assert.equal(belowAverageThreshold.isAtOrBelowThreshold, true);
  assert.equal(belowAverageThreshold.isAtOrBelowAverageThreshold, true);
});

test("rounds fractional formula averages down like a statblock", async () => {
  class OddRangeRoll {
    async evaluate(options) {
      this.total = options.minimize ? 10 : 45;
      return this;
    }
  }

  const actor = {
    system: { attributes: { hp: { value: 17, max: 45, formula: "5d8 + 5" } } }
  };

  const display = await getCombatHpDisplay(actor, OddRangeRoll);
  assert.equal(display.averageThreshold, 18);
  assert.equal(display.isAtOrBelowAverageThreshold, true);
});

test("keeps the threshold phase until average damage has been taken", async () => {
  class DruidHpRoll {
    async evaluate(options) {
      this.total = options.minimize ? 16 : 72;
      return this;
    }
  }

  const actor = {
    system: { attributes: { hp: { value: 29, max: 72, formula: "8d8 + 8" } } }
  };

  const aboveAverageDamage = await getCombatHpDisplay(actor, DruidHpRoll);
  assert.equal(aboveAverageDamage.averageThreshold, 28);
  assert.equal(aboveAverageDamage.isAtOrBelowThreshold, true);
  assert.equal(aboveAverageDamage.isAtOrBelowAverageThreshold, false);

  actor.system.attributes.hp.value = 28;
  const atAverageDamage = await getCombatHpDisplay(actor, DruidHpRoll);
  assert.equal(atAverageDamage.isAtOrBelowAverageThreshold, true);
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
