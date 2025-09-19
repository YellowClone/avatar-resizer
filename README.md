# Avatar Resizer

Client‑side image resizing with multiple target sizes in the browser.

## Features

- Resize one image into multiple target sizes
- Choose crop mode: Fit, Fill, or Stretch
- Pick output format (PNG, JPEG, WebP) and quality
- Apply shapes: Rectangle, Circle, Rounded rectangle
- Preview results and download files individually or as a ZIP
- Adjust filename patterns with placeholders
- Save, export, and import your size presets
- Works entirely client-side in the browser, no server required

All dependencies are included locally, it works offline without an internet connection.

## Usage

1. Clone or download the repo zip file
2. Open `index.html` in a web browser
3. Drag & drop an image or use the file browser
4. Adjust sizes and options in the sidebar
5. Click "Process Images"
6. Preview results, then download individual images or a ZIP of all files

## Default presets

- Small: 200×200 (square)
- Medium: 600×600 (square)

## Options

- Preset name
- Target sizes: Width and height (px)
- Crop modes: Fit (contain), Fill (cover/crop), Stretch (ignore aspect)
- Fit mode centering: Top-Left, Top-Center, Top-Right, Center-Left, Center, Center-Right, Bottom-Left, Bottom-Center, Bottom-Right
- Resize quality: High, Medium, Low, Fastest (Bicubic/Bilinear/Box/Nearest)
- Output formats: PNG, JPEG, WebP
  - Set quality and compression settings
- Shapes: Rectangle, Circle, Rounded rectangle
- Background color and optional transparency for shaped outputs
- Filename pattern with placeholders: `{original_name}`, `{original_ext}`, `{original_width}`, `{original_height}`, `{name}`,
  `{width}`, `{height}`, `{format_ext}`, `{crop_mode}`, `{shape}`, `{quality_text}`, `{date}`, `{time}`, `{timestamp}`
  - Upper/lower case formatting for text placeholders (e.g. `{name:upper}`, `{format_ext:lower}`)
  - Formatting for timestamps and dates in filename placeholders (e.g. `{timestamp:"YYYY-MM-DD HH:mm:ss"}`, ``{date:YYYY-MM-DD}`, `{time:HH-mm-ss}`)
  - Zero-padding for number placeholders (e.g. `{width:4}` for 4-digit width)

## Dependencies

- [Pica](https://github.com/nodeca/pica) - image resizing
- [PhotoSwipe](https://github.com/dimsemenov/PhotoSwipe) - lightbox viewer
- [JSZip](https://github.com/Stuk/jszip) - ZIP generation
- [DayJS](https://github.com/iamkun/dayjs) - date formatting

## License

[MIT](LICENSE)
