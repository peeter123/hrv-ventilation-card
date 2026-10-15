// Registers a custom element once. The module may be loaded twice (for example under two resource URLs), and
// defining a tag a second time throws.

/**
 * Defines `tag` as `element` unless the tag is already defined. When another class already holds the tag (an
 * older copy of the bundle loaded under another URL), that class stays in use; the warning says so, because the
 * new code then seems not to be deployed.
 */
export function defineOnce(tag: string, element: CustomElementConstructor): void {
  const existing = customElements.get(tag);
  if (existing === undefined) {
    customElements.define(tag, element);
  } else if (existing !== element) {
    console.warn(`${tag} is already defined by another copy of the module; that copy stays in use.`);
  }
}
