import { changesCombatHp, getCombatHpDisplay } from "./combat-hp.mjs";

const MODULE_ID = "matou-s-mod";
const COMBATANT_SELECTOR = ".combatant[data-combatant-id]";

function getCombatTrackerRoot(app, element) {
  if (element instanceof HTMLElement) return element;
  if (element?.[0] instanceof HTMLElement) return element[0];
  return app?.element instanceof HTMLElement ? app.element : null;
}

async function addCombatHpToTracker(app, element) {
  if (!game.user.isGM) return;

  const root = getCombatTrackerRoot(app, element);
  const combat = app.viewed ?? game.combat;
  if (!root || !combat) return;

  const rows = root.querySelectorAll(COMBATANT_SELECTOR);
  await Promise.all(Array.from(rows, async (row) => {
    const combatant = combat.combatants.get(row.dataset.combatantId);
    const display = await getCombatHpDisplay(combatant?.actor);
    const existing = row.querySelector(".matou-s-mod-combat-hp");
    row.classList.toggle("matou-s-mod-defeat-threshold", display?.isAtOrBelowThreshold ?? false);

    if (!display) {
      existing?.remove();
      return;
    }

    const name = row.querySelector(".token-name, .combatant-name");
    if (!name) return;

    const hp = existing ?? document.createElement("span");
    hp.classList.add("matou-s-mod-combat-hp");
    hp.title = "Current HP / Maximum HP (earliest defeat threshold)";
    hp.textContent = display.text;
    if (!existing) name.append(hp);
  }));
}

function refreshCombatTrackerHp(actor, changes) {
  if (!game.user.isGM || !changesCombatHp(changes)) return;

  const trackers = [ui.combat, ui.combat?.popout].filter(Boolean);
  for (const tracker of trackers) {
    const combat = tracker.viewed ?? game.combat;
    const includesActor = combat?.combatants.some((combatant) => combatant.actor?.id === actor.id);
    if (includesActor && tracker.rendered) tracker.render();
  }
}

function applyHotbarOffset() {
  const offset = game.settings.get(MODULE_ID, "hotbarOffset");
  // Inherited by the hotbar, including when Foundry renders it again.
  document.documentElement.style.setProperty("--matou-s-mod-hotbar-offset", `${offset}px`);
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "hotbarOffset", {
    name: "Hotbar horizontal offset",
    hint: "Offset in pixels for your user. Negative moves left, positive moves right, and 0 restores the default position. Applies when saved.",
    scope: "user",
    config: true,
    type: Number,
    default: -150,
    onChange: applyHotbarOffset
  });
});

Hooks.once("ready", applyHotbarOffset);
Hooks.on("renderCombatTracker", (app, element) => {
  void addCombatHpToTracker(app, element);
});
Hooks.on("updateActor", refreshCombatTrackerHp);
