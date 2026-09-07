// Wait until this client's world has finished loading.
Hooks.once("ready", () => {
  const message = "Hello world from Matou's Mod!";
  ui.notifications.info(message);
  console.log(`matou-s-mod | ${message}`);
});
