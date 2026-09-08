# Matou's Mod

A minimal Foundry VTT 14 module. Each user can configure their hotbar's
horizontal offset, defaulting to 150 pixels left. GMs also see current HP and
an earliest-defeat threshold in the combat tracker for actors that provide a
rollable HP formula.

## Combat tracker HP

For a combatant whose actor exposes `system.attributes.hp.value`,
`system.attributes.hp.max`, and `system.attributes.hp.formula`, the GM sees this
beneath the combatant's name:

```text
<current HP>/<maximum HP> (<earliest-defeat threshold>)
```

The threshold is the maximum possible formula result minus the minimum possible
result. For `2d6 + 6`, those results are 18 and 8, so the threshold is 10. A
creature currently at its maximum therefore appears as `18/18 (10)`. This
lets the GM treat 10 remaining HP as the earliest point at which the creature
may be defeated, after it has taken the minimum possible 8 damage.

When current HP reaches or falls below the threshold, the combatant's tracker
row receives a dark amber background as a visual prompt that it can be called
defeated.

The display is GM-only so creature HP is not disclosed to players. Actors with
no current or maximum HP, no rollable formula, or an invalid formula are left
unchanged. The module does not check the active game system; compatible systems
can use the same data shape.

GMs can turn the feature on or off under **Game Settings → Configure Settings →
Matou's Mod → Show combat tracker HP**. It is a world setting, defaults to on,
and is hidden from non-GM users. Changing it refreshes both the docked and
popped-out combat trackers immediately.

## Configure the hotbar

Open **Game Settings → Configure Settings → Matou's Mod** and change
**Hotbar horizontal offset**, then save. Negative values move left, positive
values move right, and `0` restores the default position. Changes apply on save
without reloading. The setting belongs to your Foundry user in this world and
follows that user across browsers and devices.

To check it, save `-250`, then `0`, and confirm the hotbar moves immediately.
Reload to confirm the value persists. Log in as a different user and confirm
they retain their own offset (initially `-150`).

## Repository layout

```text
module.json       Package identity, compatibility, files to load, and release URLs
scripts/main.js       Registers hooks and the user setting
scripts/combat-hp.mjs Calculates combat HP display values
styles/main.css       Hotbar positioning and combat HP presentation
tests/                Dependency-free Node.js tests for combat HP calculation
LICENSE           BSD 3-Clause license
README.md         Development and release instructions
```

There is no build step or dependency installation. The files you edit are the
files Foundry serves to connected browsers. Run the automated tests with
`node --test`. Later, we can add `templates/` for UI templates, `lang/` for
translations, and `packs/` for compendiums as needed.

The module ID is `matou-s-mod`; its installed folder must have that exact name.
The module version (`0.2.0`) is independent of the Foundry version (`14`).
Compatibility currently permits only Foundry 14. The module has been verified
locally on Foundry **14.367**, recorded in `compatibility.verified`.

## Install locally for development

1. Find your Foundry **User Data Path** in its configuration. Use its `Data/modules`
   directory, not the Foundry application installation directory.
2. With Foundry stopped, create `Data/modules/matou-s-mod/` and copy
   `module.json`, `scripts/`, `styles/`, `LICENSE`, and `README.md` into it.
3. Start Foundry, open a test world, and enable **Matou's Mod** in **Manage Modules**.
4. Save and reload. The hotbar should appear 150 pixels farther left.
   Check the browser developer console for errors.
   The Network panel should show `scripts/main.js` and
   `styles/main.css` loading from `modules/matou-s-mod/`.

For a faster edit/reload loop on macOS or Linux, use a symbolic link instead of
a copy. Replace the example destination with your actual User Data Path, and
only run this if the destination module folder does not already exist:

```sh
ln -s /Users/matou/repositories/matou-s-mod "/actual/user-data/Data/modules/matou-s-mod"
```

With a link, script and CSS edits need a browser reload; manifest edits should
be followed by a Foundry restart. With a copy, recopy changed files first.
Avoid using Foundry's package updater on your linked development installation,
since it can overwrite your working files.

## How deployment works

GitHub stores the source history. A GitHub Release distributes a snapshot of
the module. Foundry installs that snapshot into its own `Data/modules` directory
and serves it during a game. You do not deploy a separate application server.

The manifest has two different release addresses:

- `manifest`: a stable address for the latest released `module.json`. Foundry
  checks this to discover updates.
- `download`: the ZIP for this specific module version. For `0.2.0`, this points
  to the `module.zip` asset attached to GitHub release tag `v0.2.0`.

These addresses are configured for this repository, but will only work after
the first public release and its assets exist. Pushing source code alone does
not publish an installable release. No release automation is configured yet.

## Make a release manually

1. Test the module locally in Foundry 14. Set `compatibility.verified` to the
   Foundry build you tested.
2. For each subsequent release, increase `version` in `module.json` and update
   its `download` URL to the matching tag (for example `v0.2.1`). Keep the
   `manifest` URL stable.
3. Commit and push the intended files to GitHub. Package that same revision
   from the repository root using the following macOS/Linux commands:

   ```sh
   mkdir -p dist
   python3 -m json.tool module.json > /dev/null
   python3 -m zipfile -c dist/module.zip module.json scripts styles LICENSE README.md
   cp module.json dist/module.json
   python3 -m zipfile -l dist/module.zip
   ```

   The ZIP must contain `module.json` at its root. `dist/` is ignored by Git;
   the archive includes only the explicitly listed files. If we add runtime
   folders later, include them in the packaging command too.
4. On GitHub, create a release with tag `v0.2.0` (or your new version) targeting
   the committed revision. Attach **both** `dist/module.json` and
   `dist/module.zip`. Publish it as a regular release, not a prerelease, so the
   `releases/latest` address resolves to it. Assets must be publicly accessible.
5. In a separate Foundry installation, choose **Install Module**, paste the
   manifest URL below, and install. Enable it separately in each world.

   ```text
   https://github.com/matou/matou-s-mod/releases/latest/download/module.json
   ```

For updates, repeat with a higher version and a new tag. Existing installations
can discover it through Foundry's package update controls. Registration in
Foundry's public package directory is a separate step; direct manifest
installation works without it.

## References

- [Foundry module development guide](https://foundryvtt.com/article/module-development/)
- [Foundry V14 manifest reference](https://foundryvtt.com/api/v14/interfaces/foundry.packages.types.ModuleManifestData.html)
