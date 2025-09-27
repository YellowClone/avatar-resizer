# AGENTS.md

## General Guidelines

- Keep the code simple and maintainable.
- If you find yourself writing a lot of code, stop and think if there's a simpler way to achieve the same goal.
- Less code is better than more — aim for the smallest, clearest solution that works.
- When creating new functionality, scan the project existing files and think about all of the existing functionality that could be updated to support the same use case. Avoid creating new functionality unless absolutely necessary.
- Don't use comments at all. Never. Never ever. If you feel the need to add a comment, stop and carry on with your given task.

## JavaScript

- Don't use ESM modules at all.
- Use vanilla JavaScript only. No frameworks or libraries except the ones explicitly allowed below.
- Explicitly declare all variables. Use `let` and `const` instead of `var`.
- Use simple, clear and minimal variable and function names. Favour brevity over descriptiveness.
- Prefer single-letter names for loop indices.
- Create utility functions for repeated code patterns.
- Always use `$` for accessing DOM elements by ID. THIS IS IMPARATIVE
- Always use `$$` for accessing DOM elements by CSS selector. THIS IS IMPARATIVE
- Always use `$$$` for accessing multiple DOM elements by CSS selector. THIS IS IMPARATIVE
- Don't create HTML elements using JavaScript DOM methods or string concatenation. THIS IS IMPARATIVE.
- Don't create intermediate variables unless they improve code clarity or performance.
- If a variable is only used once and its purpose is clear from the context, it's better to use the expression directly.

```javascript
  // Right: items is used multiple times, so caching it in a variable improves performance
  const items = getItems();
  for (let i = 0; i < items.length; i++) {
    process(items[i]);
  }

  // Wrong: getItems() function is called multiple times, which can be inefficient depending on its implementation
  for (let i = 0; i < getItems().length; i++) {
    process(getItems()[i]);
  }

  // Right: corner-radius-group is only used once, using the expression directly reduces unnecessary code
  $('corner-radius-group').style.display = shape === 'rounded' ? 'block' : 'none';

  // Wrong: creating an unnecessary variable for a single use
  const cornerRadiusGroup = $('corner-radius-group');
  corner-radius-group.style.display = shape === 'rounded' ? 'block' : 'none';
```

- Don't check if an HTML element exists before accessing it. If the element is missing, it's better to let the code fail loudly so the issue can be detected and fixed.

```javascript
  // Right: let the code fail if the element is missing
  const element = $('my-element');
  element.addEventListener('click', () => { ... });

  // Wrong: check is not needed
  const element = $('my-element');
  if (element) {
    element.addEventListener('click', () => { ... });
  }
```

Do not prefix window. or document. when accessing global objects or functions.

```javascript
  // Right: no need to prefix with window.
  const element = $('my-element');
  const now = Date.now();

  // Wrong: unnecessary prefixing
  const element = window.$('my-element');
  const now = window.Date.now();

  // Right: no need to prefix with window.
  class Downloader { ... }
  window.Downloader = Downloader;

  class App {
  constructor() {
    this.downloader = new Downloader();
  }

  // Wrong: unnecessary prefixing
  class Downloader { ... }
  window.Downloader = Downloader;

  class App {
  constructor() {
    this.downloader = new window.Downloader();
  }
```

### Logical OR vs Nullish Coalescing (|| vs ??)

BEFORE using || or ?? operators, ALWAYS ask these questions:

1. **Is 0 a valid value for this property?** If YES, use ??
2. **Is false a valid value for this property?** If YES, use ??
3. **Is empty string ("") a valid value for this property?** If YES, use ??
4. **Do I want ALL falsy values (0, false, "", null, undefined, NaN) to trigger the default?** If YES, use ||
5. **Do I want ONLY null/undefined to trigger the default?** If YES, use ??

EXAMPLES:

- `width = value || 400` ✓ (0 width is invalid)
- `horizontalOffset = value ?? 50` ✓ (0 offset is valid - left edge)
- `transparentBackground = value ?? false` ✓ (false is valid)
- `name = value || "Default"` ✓ (empty string should default)
- `quality = value ?? 0` ✓ (0 quality is valid)

NEVER assume || is correct. ALWAYS verify the logic first.

### Classes

Seperate code into classes where appropriate. Each class should encapsulate related functionality and state.

### Libraries

Use `get-library-docs` tool to look up documentation for the following libraries. The library IDs are:

- `Pica`: /nodeca/pica
- `PhotoSwipe`: /dimsemenov/photoswipe
- `JSZip`: /stuk/jszip
