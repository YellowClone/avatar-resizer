# Avatar Resizer

Browser based client‑side image resizing with multiple target sizes.

## Features

- 100% client-side: no uploads, works offline in the browser
- Batch processing: produce many target sizes from one or multiple source images
- Flexible crop modes: Fit, Fill (cover/crop), Stretch (ignore aspect ratio)
- Shapes: Rectangle, Circle, Rounded Rectangle with configurable corner radius
- Output formats: PNG, JPEG, WebP, and ICO
- Input formats supported: JPG/JPEG, PNG, GIF, WebP, AVIF, BMP
- Filename templating with placeholders
- Export/import size configurations as JSON for sharing presets
- Download processed images as a ZIP or as a multi-resolution ICO for Windows icons

## Quickstart

### Hosted version

A hosted version is available at: <https://yellowcone.github.io/avatar-resizer/>

### Local usage

1. Clone the repository or download it as a zip file.
2. Open `src/index.html` in a web browser.

## Usage

1. Drag & drop one or more images onto the page or use the file browser
2. Configure output sizes in the sidebar
3. Click "Process Images" to generate outputs
4. Download individual images, a ZIP of all outputs, or a multi-resolution ICO file

## Default presets

- **Tiny**: 100x100px
- **Small**: 200x200px
- **Medium**: 400x400px
- **Large**: 800x800px

## Options

- Preset name
- Target sizes: Width and height (px)
- Maintain aspect ratio: Toggle to keep original aspect ratio when resizing
- Crop modes: Fit (contain), Fill (cover/crop), Stretch (ignore aspect)
- Centering: Aligns the image in fill mode
- Resize algorithm: High, Medium, Low, Fastest (Bicubic/Bilinear/Box/Nearest)
- Output formats: PNG, JPEG, WebP, ICO
  - Set quality and compression settings for JPEG and WebP
- Shapes: Rectangle, Circle, Rounded rectangle
- Background color and optional transparency for shaped outputs
- Corner radius: Set corner radius for rounded rectangle shapes
- Filename pattern with placeholders: `{original_name}`, `{original_ext}`, `{original_format}`, `{original_width}`, `{original_height}`, `{name}`, `{width}`, `{height}`, `{crop_mode}`, `{centering}`, `{resize_quality}`, `{format}`, `{format_ext}`, `{format_quality}`, `{shape}`, `{background}`, `{date}`, `{time}`, `{timestamp}`
  - Upper/lower case formatting for text placeholders (e.g. `{name:upper}`, `{format_ext:lower}`)
  - Formatting for timestamps and dates in filename placeholders (e.g. `{timestamp:"YYYY-MM-DD HH:mm:ss"}`, `{date:YYYY-MM-DD}`, `{time:HH-mm-ss}`)
  - Zero-padding for number placeholders (e.g. `{width:4}` for 4-digit width)

## Notes

- Only the first frame of animated GIFs are processed; animations are not preserved
- For transparent backgrounds use PNG/WebP and enable the Transparent Background option in the size editor
- When creating ICO files, include square sizes (e.g., 16, 32, 48, 64, 128) for best compatibility
- ICO files output using PNG format instead of BMP

## Dependencies

All third-party libraries are bundled locally under `js/lib/` so the app runs offline

- [Pica](https://github.com/nodeca/pica) - high-quality browser image resizer
- [PhotoSwipe](https://github.com/dimsemenov/PhotoSwipe) - image lightbox
- [JSZip](https://github.com/Stuk/jszip) - ZIP archive builder
- [DayJS](https://github.com/iamkun/dayjs) - date and time formatting

## License

[MIT](LICENSE)
