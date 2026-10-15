# Design

## Context

See proposal.md for the motivation. The facts below come from the code and the live dashboard on 2026-10-15.

- `HrvCard.setConfig` (`src/cards/base-card.ts`) runs `check` (missing roles, then invalid options), `configure`,
  builds the calculator and records `configuredEntityIds` for the re-render rule. `getStubConfig()` returns `{}`,
  so a card from the picker throws the missing-entities error. That is why `CARD_ENTRIES` in `src/index.ts` sets
  `preview: false`.
- HA's card picker has no image field for custom cards. With `preview: true` it renders the card itself, from
  `getStubConfig`, with the user's `hass`. It gives the card no flag saying it is in the picker.
- `invalidOptions` only checks the options a card lists. Unknown keys are ignored. So the v0.1 bundle accepts a
  config that carries the new v0.2 keys.
- `scripts/check-ids.mjs` fails the build on any `<domain>.<name>` string for the listed HA domains (`sensor`,
  `binary_sensor`, ...).
- Label icons: `.label ha-icon { vertical-align: -0.2em }` leaves the icon's centre 2 px below the label's centre
  at 14 px text (measured on the live card).
- Recovery bar lanes: `.lane { flex: 1 1 0 }` plus `.lane + .lane { border-top: 1px }` in a 28 px bar gives
  rendered lanes of 12.5 px and 13.5 px (measured), because the border sits outside the flex basis.
- The badge's `data-entity` is the supply air temperature (`ventilation-card.ts`, `badge()`). The status grid and
  the top row only show the roles in `STATUS_ROLES` and `TOP_ROLES` (`src/diagram/labels.ts`). So a new role in the
  `status` group does not become a grid cell unless it is added there.

## Goals / Non-Goals

**Goals:**

- One sample-mode code path in the shared base card, used by all three cards.
- Keep every v0.1 config valid and rendering the same, apart from the deliberate visual fixes.
- Each new behaviour gets a unit test on a pure function, and each layout fix a browser test that measures it.

**Non-Goals:**

- No change to the recovery calculation, its vectors or the smoothing.
- No per-unit presets or automatic entity discovery.

## Decisions

### Sample mode lives in the base card, decided by "no entity role set"

`setConfig` checks first whether the config sets any entity role (`configuredEntityIds(config).length === 0`). If
none is set, the card runs only the option check. It then configures itself with a sample config: the user's
options merged over `SAMPLE_CONFIG`, with smoothing forced to 0 so no history is requested. It sets a
`sample` flag. When rendering, the card passes a `hass` whose `states` are the real states plus `SAMPLE_STATES`.
The sample config and states live in a new `src/lib/sample.ts`, shared by the three cards so their figures match.
The preview page (`dev/`) also gets a slot that shows the cards with no entities.

- *Why not detect the picker?* HA gives no reliable flag for it, and a card added and saved with no entities
  would then show an error. With this rule, the picker, a fresh editor preview and a bare YAML card behave alike.
- *Why not stub entities from the user's installation?* That is the backlog's Device auto-fill. It also gives
  nothing in an installation without a ventilation unit, which is exactly when someone browses the picker.

Sample entity IDs use a made-up domain, `hrv_sample.<role>` (for example `hrv_sample.outdoor_temperature`). That
form passes the card's own entity-ID shape check. It is not an HA domain, so `check-ids` stays strict with no
exemption, and the IDs cannot collide with real entities. `hass.formatEntityState` formats these state objects like
any sensor (number, unit, raw text states). The fallback in `formatState` covers versions without it.

In sample mode the cards render no `data-entity`, `role="button"` or `tabindex` on labels, the badge or the
season icon, so nothing opens a dialog. The note "Sample values" is a small muted line at the bottom right of each
card (`.sample-note`, shared style), with its text in `src/strings.ts`.

The sample operating point is a heating day: outdoor 2 °C / 85 %, supply 18.5 °C / 45 %, extract 21.5 °C / 50 %,
exhaust 5.5 °C / 90 %, flows 200 m³/h, bypass 0 %, fan level 2, heating season on, power 38 W, RMOT 4.5 °C, plain
status texts ("Auto", "Normal"), 120 filter days. With these values the house is drying and the moisture recovery
is positive. The values are checked once by a unit test that runs the calculation on the sample: heating mode, a
saving above the badge threshold, and positive extracted and recovered moisture.

### Exchanger type is a diagram option that only changes the drawing

`exchanger_type` is a choice option (`hrv` default, `erv`) in `DIAGRAM_OPTIONS`, so the shared validator reports a
bad value. `drawing()` gets the type and sets a class on the exchanger polygon. The fills are CSS on the card:

- HRV: `var(--secondary-background-color)`, as now.
- ERV: `color-mix(in srgb, var(--secondary-background-color) 75%, #4f86b8)`, a blue-grey derived from the theme
  so it stays light in light themes and dark in dark ones. The bypass position and the moisture figure sit on this
  fill. The browser test checks their contrast against the text colour in both themes (at least 4.5:1).

The type does not change the calculation or the bar cards. An HRV with humidity sensors still gets latent figures
in the recovery bar, as now.

In the editor, `exchanger_type` is the first field, a basic (not advanced) choice with the labels "Heat recovery
(HRV)" and "Energy recovery (ERV)".

### The moisture recovery figure is computed like the badge

A pure `moistureFigure(result, options, locale)` next to `savingBadge` in `src/diagram/badge.ts` returns the signed
rate through a new `DIAGRAM.moisture` string (NBSP before g/h), negative ("−418 g/h") while moisture is kept out,
and the tooltip, which names the direction with the magnitude ("Moisture kept out: 418 g/h"). It returns nothing
when the type is HRV or the config lacks the badge inputs. For no result, it returns the same hidden or "n/a"
outcome as the badge. The card places it in an `.on-drawing.moisture-recovery` box at `bottom: 24%` (bottom edge at
y 152 of 200), under the crossing streams. It is shown in both layouts. A figure that opens no entity has
`role="img"`, so its label is still read out.

- *Why no icon, and why 24 %?* The first implementation had a drop icon (crossed out while kept out) at
  `bottom: 20.5%`, mirroring the bypass position. At 11 px text below 400 px card width, a four-digit rate then put
  the icon on the exchanger's slanted outline (measured). The user chose (2026-10-15) to drop the icon and move the
  text up. Without the icon the sign carries the direction. Measured from 20.5 to 26 %: every position fits a
  three-digit rate; from 23 % a four-digit kept-out rate keeps its text between the slanted sides from 300 px (at
  280 px only the empty corners of its line box reach past them); at 26 % it touches the streams.

### Badge and moisture figure open optional roles

`status.saving` and `status.moisture_recovery` join `RolePath`, `ROLE_LABELS` and the editor's status section as
advanced sensor pickers ("Saved power", "Moisture recovery rate"). They are not in `STATUS_ROLES` or `TOP_ROLES`,
so they never get a label or a grid cell. The badge and the figure set `data-entity`, `role="button"` and
`tabindex` only while their role is configured.

- *Why not fall back to power or supply temperature?* Neither is the figure the user tapped. A tap that opens
  something unrelated is the bug being fixed. The backlog integration will provide sensors for these two roles.

Because the roles are part of the config, `configuredEntityIds` includes them, and their state changes re-render
the card. That is harmless, and it keeps the re-render rule simple.

### Icon alignment: labels become inline flex boxes

`.label` becomes `display: inline-flex; align-items: center; gap: 3px; max-width: 100%`. The icon is a fixed
`1.15em` box with no `vertical-align`. The value goes in a `.value` span with `min-width: 0; overflow: hidden;
text-overflow: ellipsis`. A flex container does not apply `text-overflow` to its children, so the ellipsis moves
from the cell to that span.

- *Why not `vertical-align: middle`?* It centres the icon on the lowercase x-height, not on digits and capitals,
  which leaves an offset of about 1 px that depends on the font.

The status cells become `display: flex; justify-content: center`, which centres each value in its column. The grid
itself stays `justify-content: center` with the same column widths. The corner stacks keep their left or right
alignment, and their labels have no icons.

### Equal lanes: the divider is a row of its own, in a 29 px bar

`.lane + .lane` loses its border. The bar draws a 1 px `.divider` element as a flex item between the lanes
(`flex: none`), and the two-lane bar grows from 28 to 29 px, so its 27 px inner height is 13 + 1 + 13. The
one-lane bar stays 22 px. The user confirmed (2026-10-15) that the reported unequal height was the heat bar's two
lanes, not the outer heights of the heat and moisture bars.

- *Why not an overlay at `top: 50%` in the 28 px bar?* It was the first implementation. It makes the lane boxes
  13 px each, but a 26 px inner height minus a 1 px line leaves 25 pixel rows, so at device pixel ratio 1 the line
  covers a row of one lane and the painted lanes stay 13 and 12 rows (measured on a screenshot). The user chose the
  29 px bar (2026-10-15). The browser test counts the painted rows of each lane, not only the boxes.

### Recovery legend and moisture header

`recoveryView` stops adding the water entry. `RECOVERY.water` and `RECOVERY.waterKeptOut` are removed with
their tests, so no unused text stays in `src/strings.ts`. `MoistureView` gets a
`subtitle?: string`. The titles collapse to `MOISTURE.title = 'Moisture Recovery'`, and `MOISTURE.subtitles`
holds the three sentence-case direction texts. The moisture card renders the title and subtitle stacked in a
`.title-block` on the left of `.head`. The `.subtitle` style (13 px, secondary text colour) lives in `barStyles`,
so the recovery card can use it later.

### Picker entries

`CARD_ENTRIES` sets `preview: true` for all three. The comment about the empty stub is replaced by a pointer to
sample mode. `getStubConfig()` stays `{}`, so a card added from the picker opens in sample mode with an empty
editor.

## Risks / Trade-offs

- [A user saves a card with no entities and mistakes the sample for live data] → the "Sample values" note is
  always visible in sample mode, and the README says how to leave it (pick any entity).
- [The ERV fill is too faint or too strong in some themes] → it is derived from the theme's own colour. The
  browser test checks the contrast of the text on it in the light and dark preview themes. The live check covers
  the user's theme.
- [A future HA validates entity domains in `formatEntityState` and the fake domain renders oddly] → `formatState`
  falls back to the raw state with its unit. A unit test covers the sample through that fallback as well.
- [The inline-flex label changes the label widths that the layout tests at 280 to 600 px measure] → those
  no-overlap browser tests run unchanged and must stay green. Any change in a cell's width is absorbed by the
  fixed grid columns.
- [The moisture figure and the bypass position crowd the exchanger at 280 px] → there is a spec scenario and a
  browser test at 280 px with the bypass at 50 %, the badge and the figure all shown.

## Migration Plan

1. Release: `npm run release`, version `0.2.0` in `package.json`, commit `dist/`.
2. Deploy `dist/` with the workspace's deploy script and bump the Lovelace resource `?v=` (number in
   `private/installation.md`). Existing configs render the same apart from the visual fixes. The diagram stays HRV
   grey until step 3.
3. On both dashboards' diagram cards, add `exchanger_type: erv`, plus `status.saving` and
   `status.moisture_recovery` pointing at the installation's thermal saving and moisture recovery template sensors
   (IDs in `private/installation.md`). Use `python_transform` with the latest `config_hash`, locating the cards by
   type.
4. Check with Playwright (service workers blocked): blue-grey exchanger, moisture figure at the bottom, badge
   opening the saving sensor, equal lanes, no water entry, moisture subtitle, centred icons and cells. Check the
   picker previews from "Add card".
5. Push `main` and the tag `v0.2.0` to `peeter123/hrv-ventilation-card`, with the user's confirmation. The user
   publishes the release in the GitHub UI.

Rollback: point the resource back at the v0.1.0 bundle (`git show v0.1.0:dist/hrv-ventilation-card.js`, deployed
under a new `?v=`). The v0.1.0 bundle ignores the new config keys, so the dashboards need no change to roll back.
