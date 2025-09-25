# Instructions

Read the feature overview document located at `docs/reports/FEATURE_OVERVIEW.md` think about it step by step.

Implement all the features listed in the document using vanilla JavaScript, HTML, and CSS. Do not add any frameworks or libraries. The only libraries used for this project are:

- [Pica](js/lib/pica/pica.min.js) - image resizing
- [PhotoSwipe](js/lib/photoswipe/photoswipe.umd.min.js) - lightbox viewer
- [JSZip](js/lib/jszip/jszip.min.js) - ZIP generation
- [DayJS](js/lib/dayjs/dayjs.min.js) - date formatting

The existing `index.html` and `css/styles.css` files contains the layout and structure for the application. Build upon this foundation to implement the required features.

Place the core application logic in the `js/app.js` file. This is where you will implement all of application functionality. Do not create additional JavaScript files.

Update `index.html` and `css/styles.css` as needed to support the new features.

## Coding Standards

- When creating new functionality, scan the existing project files and think about all of the existing functionality that could be used to support the same use case. Avoid creating new functionality unless absolutely necessary.
- If you find yourself writing a lot of code, stop and think if there's a simpler way to achieve the same goal.
- Less code is better than more - aim for the smallest, clearest solution that works.
- Keep the code simple and maintainable.
- Do not add comments unless absolutely necessary, the code should be self-explanatory.

## JavaScript

- Don't use ESM modules at all.
- Use vanilla JavaScript only. No frameworks or libraries except the ones explicitly allowed below.
- Explicitly declare all variables. Use `let` and `const` instead of `var`.
- Use simple, clear and minimal variable and function names. Favour brevity over descriptiveness.
- Prefer single-letter names for short-lived variables in small scopes (e.g. loop indices).
- Create utility functions for repeated code patterns. THIS IS IMPARATIVE
- Create a function called `$` for accessing DOM elements by ID. THIS IS IMPARATIVE
- Create a function called `$$` for accessing DOM elements by CSS selector. THIS IS IMPARATIVE
- Create a function called `$$$` for accessing multiple DOM elements by CSS selector. THIS IS IMPARATIVE
- Don't create HTML elements using JavaScript DOM methods. THIS IS IMPARATIVE. Use HTML template literals for generating HTML content.

## HTML

- Use HTML template elements for generating HTML content.
- Don't create HTML elements using JavaScript DOM methods or string concatenation.
- Prefer creating HTML templates elements in the `index.html` file and clone them in JavaScript.

## Libraries

Use `get-library-docs` tool to look up documentation for the following libraries. The library IDs are:

- `Pica`: /nodeca/pica
- `PhotoSwipe`: /dimsemenov/photoswipe
- `JSZip`: /stuk/jszip
- `DayJS`: /iamkun/dayjs

## Implementation Details

- Keep the code simple and maintainable.
- Do not add comments unless absolutely necessary, the code should be self-explanatory.
- Don't create HTML elements using JavaScript DOM methods. Add an HTML template to the HTML file and clone them in JavaScript.
- Don't create HTML elements using string concatenation. Use HTML template literals for generating HTML content.
- Create utility functions for repeated code patterns.

### Classes

Seperate code into classes where appropriate. Each class should encapsulate related functionality and state.

### Drag and Drop

When implementing file drop functionality ensure it doesn't interfere with other drag and drop features of the browser, such as dragging and dropping text or links, or elements in the size list.

### Pica

The Pica object is available globally as `pica`. It does not need to be created.

Wrong:

```javascript
const pica = new Pica();
pica.resize(fromCanvas, toCanvas, options);
```

Correct:

```javascript
const picaInstance = pica();
picaInstance.resize(fromCanvas, toCanvas, options);
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

### Constants and Initialization

Define constants and initialize libraries at the top of `js/app.js`:

```javascript
const $ = id => document.getElementById(id);
const $$ = selector => document.querySelector(selector);

// Default presets only need to define the name, width, and height for each size. Remaining properties will use system defaults.
const DEFAULT_SIZES = [
  { name: 'Tiny', width: 100, height: 100 },
  { name: 'Small', width: 200, height: 200 },
  { name: 'Medium', width: 400, height: 400 },
  { name: 'Large', width: 800, height: 800 },
];

const DEFAULT_SETTINGS = {
  id: generateId(), // create a function to generate unique IDs
  name: 'Resize',
  width: 400,
  height: 400,
  cropMode: 'fit',
  // don't store centeringPreset, infer it from horizontalOffset and verticalOffset instead
  horizontalOffset: 50,
  verticalOffset: 50,
  quality: 3,
  format: 'png',
  jpegQuality: 90,
  webpQuality: 90,
  shape: 'rectangle',
  cornerRadius: 10,
  backgroundColor: '#ffffff',
  transparentBackground: false,
  filenamePattern: 'avatar_{width}x{height}.{ext}'
};

const SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
];

const OUTPUT_FORMATS = {
  png: {
    name: 'PNG',
    ext: 'png',
    mime: 'image/png'
  },
  jpeg: {
    name: 'JPEG',
    ext: 'jpg',
    mime: 'image/jpeg'
  },
  webp: {
    name: 'WebP',
    ext: 'webp',
    mime: 'image/webp'
  },
  gif: {
    name: 'GIF',
    ext: 'gif',
    mime: 'image/gif'
  },
  ico: {
    name: 'ICO',
    ext: 'ico',
    mime: 'image/vnd.microsoft.icon'
  }
};

const QUALITY_NAMES = [
  0: 'Fastest',
  1: 'Low',
  2: 'Medium',
  3: 'High'
];

const CENTERING_PRESETS = {
  'top-left': { h: 0, v: 0 },
  'top-center': { h: 50, v: 0 },
  'top-right': { h: 100, v: 0 },
  'center-left': { h: 0, v: 50 },
  'center': { h: 50, v: 50 },
  'center-right': { h: 100, v: 50 },
  'bottom-left': { h: 0, v: 100 },
  'bottom-center': { h: 50, v: 100 },
  'bottom-right': { h: 100, v: 100 }
};

// For reverse lookup of centering presets
const CENTERING_MAP = {
  "0,0": 'top-left',
  "50,0": 'top-center',
  "100,0": 'top-right',
  "0,50": 'center-left',
  "50,50": 'center',
  "100,50": 'center-right',
  "0,100": 'bottom-left',
  "50,100": 'bottom-center',
  "100,100": 'bottom-right'
};

const CROP_MODES = {
  fit: 'Fit',
  fill: 'Fill',
  stretch: 'Stretch'
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

... other constants ...
... other initialization code ...
```
