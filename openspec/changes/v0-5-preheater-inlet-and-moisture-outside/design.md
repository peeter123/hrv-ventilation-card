# Design

## Context

The recovery calculation (`src/calc/recovery.ts`) is pure: numbers in, figures out. `src/calc/inputs.ts` turns a card
config and `hass` into its inputs, with the streams' absolute humidities smoothed by the smoothing store. Both the
recovery balance card and the airflow card use it; the moisture balance card uses only `calculateMoisture`, which this
change does not touch. The ComfoAir Q reports the air after the pre-heater as T21 / H21 (PDO 277 / 293); on the
author's unit these read the same as T20 / H20 (monthly means from January to October 2026 agree to 0.001 K, minimum
-4.3 °C), and the pre-heater has never run (0 kWh since start). So the pre-heater path can only be checked with
synthetic vectors and the preview page, not with live data.

On the drawing (`src/diagram/drawing.ts`, viewBox 400 x 200) the recovered moisture figure sits at x 299.5, y 100, in
the 89-unit wedge between the exchanger (right vertex x 255) and the house symbol (left edge x 344). On the left the
bypass leaves the outdoor lead at the split (x 120, y 62) and drops steeply: its centreline is at about x 129 at
y 75, x 134 at y 100 and x 139 at y 127, so with its 14-unit stroke its left edge is at about x 127 at y 100. The
outdoor symbol's right edge is x 56, the outdoor lead's lower edge y 69 (the coil and its glow reach y 75), the
exhaust lead's upper edge y 131. The free box on the left is therefore about x 56 to 127 and y 75 to 131.

## Goals / Non-Goals

**Goals:**

- One place decides whether the pre-heater runs and what the inlet is, so the badge, the rings, the bar and (later)
  the integration agree.
- The calculation stays pure; entity reading stays in `inputs.ts`.
- Without the new roles every figure, test and vector stays as it is.

**Non-Goals:**

- A pre-heater figure on the airflow diagram (see proposal, Out of scope).
- Changing how the moisture rates or the moisture effectiveness are computed.

## Decisions

### Running rule and inlet in the calculation, entity reading in `inputs.ts`

`RecoveryInputs` gets an optional `preHeater` block: `on` (true, false, or undefined when there is no power entity or
it has no value), `temperatureAfter` (°C or undefined) and, only when `pre_heater.humidity_after` is configured,
`absoluteHumidityAfter` (g/m³, smoothed, or undefined). The block is present only when `pre_heater.temperature_after`
is configured. `calculateRecovery` decides, after the mode:

```
running = heating && block present && (on ?? (T21 defined && T21 - T20 >= 0.5))
if running and T21 undefined                         -> no figures (on was true)
if running and humidity_after configured and AH21 undefined -> no figures
inlet = running ? air(T21, AH21 ?? AH_out) : outdoor
heating: recovered = diff(supply, inlet); lost = diff(extract, supply); preHeater = diff(inlet, outdoor)
cooling: unchanged; preHeater = 0
total effectiveness: recovered.total over (extract.h - inlet.h), gated on |extract.h - inlet.h|
```

`RecoveryResult` gets `preHeater: PowerSplit` (zeros while not running), so every view reads the part the same way.
`recoveryTotals` stays recovered plus lost; the pre-heater part is outside the potential.

Alternative considered: deciding "running" in `inputs.ts` and passing only an inlet. Rejected because the rule needs
the mode, which the calculation determines, and the vectors test the calculation, not the config reader.

The 0.5 K gate is a constant next to the existing gradient gates (`MIN_PRE_HEATER_RISE_K`).

### The power entity's on state moves to `src/lib/`

`preHeaterOn` lives in `src/diagram/preheater.ts`; `src/calc/` must not import from `src/diagram/`. Move the state
reading to `src/lib/preheater.ts` as a tri-state `preHeaterRunning(state): boolean | undefined` (a power above 0 W or
`on` is true, 0 W or `off` false, unavailable, unknown, text or a missing entity undefined), and have
`preHeaterLevel` / `preHeaterOn` in the diagram use it, so the coil and the calculation agree on "on". Undefined lets
the temperature gate decide, as the spec requires for a power entity without a value.

### After humidity smoothed like a stream

The after AH comes from the relative humidity and the after temperature (Magnus), through the smoothing store with a
derived key `derived:<rh>|<t>`, exactly as `humiditySource` does for a stream with relative humidity. The entities go
into `used` so the smoothing time follows them. Smoothing it differently from the outdoor AH would make the latent
recovered part jump when the pre-heater switches on.

### Pre-heater part split into both lanes

The part is `diff(inlet, outdoor)`: its latent part is `2501 × (AH21 - AH_out)`, which is 0 with only the after
temperature and sensor disagreement otherwise. Splitting it like every other part keeps recovered + lost + pre-heater
equal to the load in each lane. Alternative considered: a sensible-only pre-heater part. Rejected because the latent
lane would then not sum to the load whenever the two humidity sensors disagree.

### Recovery bar: a third value per lane

Each lane's values become `[recovered, lost, preHeater]` with backgrounds `[colour, hatch(colour), preHeaterColour]`;
`layoutSegments` and `barScale` already take any number of values. The pre-heater segment comes last, so the solid
recovered segment keeps starting at the zero line and recovered plus lost stay adjacent, as the header's percentage
reads them. The legend gets a plain entry kind with one swatch, shown while the pre-heater total rounds to 1 W or
more. The colour option is `pre_heater.glow_color` (default `#ff9800`), an advanced field in a new pre-heater section of the
recovery editor, next to the shared `pre_heater` power, `temperature_after` and `humidity_after` pickers.

Alternative considered: the pre-heater segment first (the physical order outdoor, pre-heater, exchanger, house).
Rejected for now because it moves the recovered segment off the zero line; the feedback round can revisit it.

### Moisture put-outside figure: centred in the left box, not mirrored

The figure sits at about x 91 (22.75 %), y 100 (50 %), the height of the exchanger's centre and of the recovered
figure, so the pair lines up (the free box's own centre, y 103, was tried and showed as an offset), leaving about 34 units on each
side. The mirrored spot (x 100.5) leaves only 26 units to the bypass edge, which a two-line figure at 280 px (about
50 units wide) would touch. `moistureFigure` in `src/diagram/badge.ts` gets a sibling for the outside rate (or one
function with a kind), with its own icons, tooltips and "n/a" text in `src/strings.ts` ("Moisture put outside: X g/h",
"Moisture brought in: X g/h"). The card renders it like the recovered figure with its own class, its own tap role
(`status.moisture_outside`, advanced picker in the status section) and its own container threshold for the two-line
layout, because its box is narrower than the right wedge.

At 280 px the box is only about 49 px wide and 39 px high, and a two-line "1,500 / g/h" with its icon is about 43 px
wide. If the browser test shows an overlap there, the fallback is to put the icon above the number below a second
threshold (three short lines fit 39 px at 11 px text); the font stays at least 11 px.

### Formula macro

The installation's macro takes two more optional inputs: the after temperature and the pre-heater power. It applies
the same running rule (power above 0, else the 0.5 K gate, heating only) and the same inlet with the outdoor AH (it
does not take the after humidity), changes `eff_sensible` to use the inlet, and gets a `heating_pre_heater` kind in
kW. The vectors with only an after temperature are rendered by the macro in Home Assistant, as the existing ones were;
the vectors with an after humidity are computed from the formulas and recorded in the table with a note.

## Risks / Trade-offs

- [The pre-heater path is never exercised on the author's unit] → synthetic vectors (macro-rendered where possible),
  unit tests for every running-rule branch, and the preview page with a pre-heater and an after-temperature control.
- [A unit whose T21 reads a steady offset of 0.5 K or more without a power entity shows a phantom pre-heater] →
  documented; configure the power entity, which then decides.
- [The pre-heater segment shows the full heat, but the supply air only gains about (1 - effectiveness) of it, the
  rest leaving with the exhaust because the exchanger recovers less from a warmer inlet] → explained in
  `docs/hrv-ventilation.md`; the bar is a correct split of where the supply air's heat came from, not a claim that the
  house got that heat.
- [The left box is tight at 280 px] → own container threshold, the icon-above fallback, and a browser test at 280 to
  600 px with the bypass at 100 % and the coil drawn.
- [The bypass path is drawn only while open, so an overlap would show only in summer] → the browser test and the
  feedback screenshots force the bypass to 100 %.

## Migration Plan

1. Release v0.5.0 with the roles optional: existing configs render exactly as before, except that ERV diagram cards
   show the new put-outside figure.
2. Deploy the macro with the two extra inputs; the live pre-heater has never run, so the helpers' values and the
   energy totals do not change. Reload the custom templates.
3. With the user's confirmation, add `pre_heater.temperature_after` and `pre_heater.humidity_after` (and, if the user
   wants, `pre_heater.power` back, which also draws the coil) to the live diagram and recovery cards.
4. Rollback: point the Lovelace resource back at the v0.4.0 bundle and restore the previous macro (`private/` is not
   in git, so keep a copy of it before the deploy); check that v0.4.0 ignores the new roles before relying on that.
