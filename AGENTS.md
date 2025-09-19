# AGENTS.md

## Implementation Details

- Keep the code simple and maintainable.
- Do not add comments unless absolutely necessary, the code should be self-explanatory.
- Don't create HTML elements using JavaScript DOM methods. Add an HTML template to the HTML file and clone them in JavaScript.
- Don't create HTML elements using string concatenation. Use HTML template literals for generating HTML content.
- Create utility functions for repeated code patterns. THIS IS IMPARATIVE

## Coding Standards

- When creating new functionality, scan the project existing files and think about all of the existing functionality that could be updated to support the same use case. Avoid creating new functionality unless absolutely necessary.
- If you find yourself writing a lot of code, stop and think if there's a simpler way to achieve the same goal.
- Less code is better than more — aim for the smallest, clearest solution that works.
- Keep the code simple and maintainable.
- Do not add comments unless absolutely necessary, the code should be self-explanatory.
- Never use null, always use undefined for optional values.

## JavaScript

- Don't use ESM modules at all.
- Use vanilla JavaScript only. No frameworks or libraries except the ones explicitly allowed below.
- Explicitly declare all variables. Use `let` and `const` instead of `var`.
- Use simple, clear and minimal variable and function names. Favour brevity over descriptiveness.
- Prefer single-letter names for short-lived variables in small scopes (e.g. loop indices).
- Create utility functions for repeated code patterns. THIS IS IMPARATIVE
- Always use `$` for accessing DOM elements by ID. THIS IS IMPARATIVE
- Always use `$$` for accessing DOM elements by CSS selector. THIS IS IMPARATIVE
- Don't create HTML elements using JavaScript DOM methods or string concatenation. THIS IS IMPARATIVE.

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