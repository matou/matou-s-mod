const MODULE_ID = "matou-s-mod";

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
