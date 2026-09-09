const HP_PATH = "system.attributes.hp";

/**
 * Calculate the combat tracker text for an actor with a rollable HP formula.
 *
 * @param {Actor} actor The combatant's actor.
 * @param {typeof Roll} RollClass Foundry's configured Roll implementation.
 * @returns {Promise<{
 *   current: number,
 *   maximum: number,
 *   threshold: number,
 *   averageThreshold: number,
 *   isAtOrBelowThreshold: boolean,
 *   isAtOrBelowAverageThreshold: boolean,
 *   text: string
 * } | null>}
 */
export async function getCombatHpDisplay(actor, RollClass = globalThis.Roll) {
  const hp = actor?.system?.attributes?.hp;
  const formula = hp?.formula?.trim();
  const current = Number(hp?.value);
  const maximumHp = Number(hp?.max);

  if (!formula || !Number.isFinite(current) || !Number.isFinite(maximumHp)
      || typeof RollClass !== "function") return null;

  try {
    const rollData = actor.getRollData?.() ?? {};
    const minimumRoll = new RollClass(formula, rollData);
    const maximumRoll = new RollClass(formula, rollData);
    const [minimumRollResult, maximumRollResult] = await Promise.all([
      minimumRoll.evaluate({ minimize: true }),
      maximumRoll.evaluate({ maximize: true })
    ]);
    const maximumRollTotal = Number(maximumRollResult.total);
    const threshold = maximumRollTotal - Number(minimumRollResult.total);
    // Statblocks round fractional average HP down, so the distance from the
    // formula maximum to that average rounds up.
    const averageThreshold = Math.ceil(threshold / 2);

    if (!Number.isFinite(threshold) || !Number.isFinite(averageThreshold)) return null;
    return {
      current,
      maximum: maximumHp,
      threshold,
      averageThreshold,
      isAtOrBelowThreshold: current <= threshold,
      isAtOrBelowAverageThreshold: current <= averageThreshold,
      text: `${current}/${maximumHp} (${threshold})`
    };
  } catch (_error) {
    // A system can expose an HP formula that Foundry's Roll class cannot evaluate.
    return null;
  }
}

/**
 * Test whether an Actor update can change its tracker HP display.
 *
 * @param {object} changes Actor update data.
 * @returns {boolean}
 */
export function changesCombatHp(changes) {
  if (Object.hasOwn(changes ?? {}, `${HP_PATH}.value`)
      || Object.hasOwn(changes ?? {}, `${HP_PATH}.max`)
      || Object.hasOwn(changes ?? {}, `${HP_PATH}.formula`)) return true;

  const hp = changes?.system?.attributes?.hp;
  if (!hp || typeof hp !== "object") return false;
  return Object.hasOwn(hp, "value") || Object.hasOwn(hp, "max") || Object.hasOwn(hp, "formula");
}
