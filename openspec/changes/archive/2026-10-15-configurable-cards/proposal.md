# Proposal

## Why

The three ventilation cards only work on the installation they were built for: every entity ID, including the
unit's serial-based prefix, is hard-coded, `setConfig` ignores its input and there is no visual editor. To share
the cards on GitHub, other people must be able to point them at their own sensors from the dashboard UI, and
the code must be in a shape that others can build, test and extend. The bar cards also need about twenty derived
sensors (template helpers on a Jinja macro, plus humidity filter helpers) that only exist on this installation, so
they are useless to anyone else even with configurable entities.

## What Changes

- Rewrite the card module in TypeScript with Lit, built by a bundler into one ES module in `dist/`. The source
  moves to `src/`; `dist/` becomes build output.
- **BREAKING** All three cards (`custom:hrv-ventilation-card`, `custom:hrv-recovery-balance-card`,
  `custom:hrv-moisture-balance-card`) read their entities from the card config. No installation-specific
  entity IDs remain in the code. A card without its required entities shows a configuration error.
- **BREAKING** The cards compute the recovery and moisture figures themselves, live, from the unit's raw
  sensors (outdoor, supply and extract temperature and humidity, supply flow, bypass position), with the formulas
  of `comfoair_q450.jinja` ported to TypeScript. The bar cards and the picture card's saving badge no longer read
  derived sensors. Absolute humidity comes from an absolute humidity entity, or is computed from temperature and
  relative humidity. The cards smooth it over a time window (default 10 minutes, seeded from HA history), as the
  filter helpers do today. Without humidity sensors the cards work sensible-only.
- Each card gets a visual editor in the dashboard UI (HA's own form with entity pickers, in a thin editor of
  ours), a stub config for the card picker and sections-view grid sizing. An "Advanced settings" switch in the
  editor reveals the advanced options (smoothing, air density, scales, thresholds, colours, layout, unavailable
  values, niche status roles) inside their own sections; it is not saved in the config.
- Cards are generic and entity-based: any HRV/ERV that exposes the needed sensors works. Optional entities
  that are not configured are simply not shown.
- Cards read units from the entities (W or kW, g/h or kg/h) instead of assuming the units of this installation.
- Display options that are now constants become optional config (colours, neutral humidity threshold, minimum
  bar scale).
- The picture card no longer overlays labels on two fixed PNG images (forced 150 px height, fixed font sizes,
  labels overlapping on narrow cards, white background in dark themes). It draws the unit itself as a scalable
  vector diagram: it scales to the card width, switches to a compact layout on narrow cards, follows the theme,
  shows the bypass as a path around the exchanger, animates the air flow along the paths (speed from the fan
  flows, the bypass share visible as moving air on each route; can be switched off and respects reduced motion)
  and colours the streams by their temperatures. The module
  becomes one self-contained file without image assets.
- ESLint (TypeScript, Lit and web component rules) and Prettier, one `npm run check` command, a Claude Code hook
  that formats, lints, type-checks and tests every edited source file, and a code review at the end of every task
  group.
- Unit tests for the calculations (recovery calculation against golden vectors rendered from the macro, smoothing,
  segment layout, scale, unit conversion, config checks), and browser tests for the diagram's layout.
- Migrate the live installation: add full entity configs to every use of the three cards on its dashboards,
  then deploy the new bundle, without a period where a card is broken.
- Rewrite `README.md` as a user-facing page modelled on the power-flow-card-plus README: hero GIF and screenshots,
  features, installation, UI editor usage, option tables per card, minimal and full examples. Update
  `docs/hrv-ventilation.md` (installation notes).
- Publish the cards through HACS: the public GitHub repository `peeter123/hrv-ventilation-card` (its name is what
  HACS matches against `dist/hrv-ventilation-card.js`), `hacs.json` with the display name "HRV Ventilation Card",
  an MIT licence, README installation through a HACS custom repository next to the manual resource, and a first
  release `v0.1.0`. Each outward step (pushing, releasing) is confirmed with the user first. Before publishing,
  `docs/hrv-ventilation.md` is split: the general explanation stays public, the installation notes and the
  formula macro move to a git-ignored `private/` folder kept in the workspace.

### Out of scope

- **History and energy statistics.** The cards only show live values. The energy totals, the effectiveness
  sensors and the charts on the live dashboards keep using the existing template, filter and Riemann helpers and
  the `comfoair_q450.jinja` macro, which this change leaves untouched. Replacing those helpers with a custom
  integration that creates power, energy, effectiveness and moisture sensors from the raw unit sensors, with the
  same formulas and the same test vectors as the cards, is the follow-up change (integration). The cards do not
  depend on it.
- **Further packaging:** HACS default-repository inclusion, README badges, release automation, and whether the
  integration ships the cards. Follow-up change (packaging), after the integration change has settled the repo
  layout.
- **Device auto-fill** (pick a ComfoAir device and fill all entities). Possible later change.
- **Translations.** UI strings stay English; they are kept in one place so a later change can add languages.

## Capabilities

### New Capabilities

- `card-bundle`: the single self-contained module that registers all cards, lists them in the card picker and
  shares unit handling and availability rules between the cards.
- `recovery-calculation`: the live calculation shared by the cards: enthalpy, heating or cooling mode,
  sensible/latent recovered and lost power, moisture extracted, recovered and put outside, absolute humidity from
  relative humidity, and humidity smoothing.
- `airflow-diagram-card`: the card (type `hrv-ventilation-card`) that draws the unit's four air streams, bypass,
  fans, saving badge and status labels as a responsive, theme-aware diagram, with every entity configurable.
- `recovery-balance-card`: the diverging bar of sensible/latent heat recovered and lost for the active mode
  (heating or cooling), with configurable entities.
- `moisture-balance-card`: the diverging bar of moisture extracted, recovered and put outside, with the bypass
  strip, neutral band and configurable entities.

### Modified Capabilities

None (no specs exist yet).

## Impact

- **Code:** `dist/hrv-ventilation-card.js` is replaced by TypeScript sources in `src/` and a built bundle. New
  `package.json`, `tsconfig.json`, bundler config and test setup; `node_modules/` ignored by git.
- **Dependencies:** Node.js tooling for development only (Lit, TypeScript, bundler, test runner, ESLint,
  Prettier). The built
  bundle has no runtime dependencies besides what it bundles.
- **Images:** `ventilation.png` and `ventilation-bypass.png` are no longer used by the cards. They move to
  `docs/reference/` as the visual reference for the diagram (later to the git-ignored `private/reference/`, since
  they are the manufacturer's artwork) and are removed from the host after migration.
- **Look:** the picture card's appearance changes on the live dashboards (intended); the values shown stay the
  same.
- **Card configs:** every existing use of the three cards needs entity configuration (breaking for the live
  dashboards, handled by the migration). The bar cards point at raw unit sensors instead of derived sensors.
- **Values:** the live figures on the cards come from the card's own calculation. They match the template
  helpers within a small tolerance (the smoothing windows are not aligned), not exactly.
- **Deploy:** development builds go to a git-ignored `build/` folder, so a work-in-progress bundle can never be
  uploaded from `dist/`. Only the release step writes `dist/`, and deploying it needs an explicit run of the
  deploy script and a bump of the Lovelace resource version.
- **Publishing:** new `hacs.json` and `LICENSE` in the repository root; the repository's history becomes public on
  GitHub as `peeter123/hrv-ventilation-card`.
- **Unchanged:** the template helpers, the macro, entity IDs in Home Assistant, and the other cards on the
  dashboards.
