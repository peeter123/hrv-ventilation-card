# Backlog

Ideas for later OpenSpec changes, outside the change in progress. Pick one up with `/opsx:propose`.

- **Translations.** The cards' own texts (titles, legends, the status strip's labels, the editor and the config
  errors) are English only. Numbers and entity states already follow Home Assistant's locale. All texts are in
  `src/strings.ts`, with `test/strings.test.ts` keeping display text out of other files, so a language is one more
  table: choose it from `hass.language` with English as the fallback, and test that every language has every key.
  Dutch first.
- **Device auto-fill.** Pick a ComfoAir device in the editor and fill in all its entities.
