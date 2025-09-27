function $(id) {
  return document.getElementById(id);
}

function $$(selector) {
  return document.querySelector(selector);
}

function $$$(selector) {
  return document.querySelectorAll(selector);
}

const DEFAULT_PRESET_SETTINGS = {
  id: null,
  name: 'Resize',
  width: 400,
  height: 400,
  cropMode: 'fit',
  horizontalOffset: 50,
  verticalOffset: 50,
  quality: 3,
  format: 'png',
  jpegQuality: 90,
  webpQuality: 90,
  gifColors: 256,
  pngCompressionLevel: 6,
  shape: 'rectangle',
  cornerRadius: 10,
  backgroundColor: '#ffffff',
  transparentBackground: false,
  maintainAspectRatio: true,
  filenamePattern: '{original_name}_{width}x{height}.{format_ext}',
};

const DEFAULT_PRESETS = [
  { name: 'Tiny', width: 100, height: 100 },
  { name: 'Small', width: 200, height: 200 },
  { name: 'Medium', width: 400, height: 400 },
  { name: 'Large', width: 800, height: 800 },
];

const SUPPORTED_FORMATS = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/gif': 'GIF',
  'image/webp': 'WebP',
  'image/bmp': 'BMP',
  'image/avif': 'AVIF',
};

const OUTPUT_FORMATS = {
  png: { name: 'PNG', ext: 'png', mime: 'image/png' },
  jpeg: { name: 'JPEG', ext: 'jpg', mime: 'image/jpeg' },
  webp: { name: 'WebP', ext: 'webp', mime: 'image/webp' },
  ico: { name: 'ICO', ext: 'ico', mime: 'image/vnd.microsoft.icon' },
};

const QUALITY_NAMES = {
  0: 'Fastest',
  1: 'Low',
  2: 'Medium',
  3: 'High',
};

const CENTERING_PRESETS = {
  'top-left': { h: 0, v: 0 },
  'top-center': { h: 50, v: 0 },
  'top-right': { h: 100, v: 0 },
  'center-left': { h: 0, v: 50 },
  center: { h: 50, v: 50 },
  'center-right': { h: 100, v: 50 },
  'bottom-left': { h: 0, v: 100 },
  'bottom-center': { h: 50, v: 100 },
  'bottom-right': { h: 100, v: 100 },
};

const CENTERING_MAP = {
  '0,0': 'Top-Left',
  '50,0': 'Top-Center',
  '100,0': 'Top-Right',
  '0,50': 'Center-Left',
  '50,50': 'Center',
  '100,50': 'Center-Right',
  '0,100': 'Bottom-Left',
  '50,100': 'Bottom-Center',
  '100,100': 'Bottom-Right',
};

const CROP_MODES = {
  fit: 'Fit',
  fill: 'Fill',
  stretch: 'Stretch',
};

const SHAPE_NAMES = {
  rectangle: 'Rectangle',
  circle: 'Circle',
  rounded: 'Rounded',
};

const STORAGE_KEYS = {
  presets: 'avatarResizer_presets',
  legacySizes: 'avatarResizer_sizes',
  autoProcess: 'avatarResizer_autoProcess',
  compactView: 'avatarResizer_compactView',
  theme: 'avatarResizer_theme',
};

const MAX_FILE_SIZE = 200 * 1024 * 1024;

function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

function hexToRgb(hex) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return null;
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

function getContrastColor(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 'inherit';
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  if (brightness > 155) return '#000000';
  return '#ffffff';
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const base = 1024;
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(base)), units.length - 1);
  const value = bytes / Math.pow(base, index);
  return `${value.toFixed(2).replace(/\.00$/, '')} ${units[index]}`;
}

function formatDateTime(date, format) {
  return dayjs(date).format(format);
}

function formatFilename(pattern, context) {
  const placeholders = {
    original_name: context.originalName,
    original_ext: context.originalExt,
    original_format: context.originalFormat,
    original_width: context.originalWidth,
    original_height: context.originalHeight,
    name: context.name,
    width: context.width,
    height: context.height,
    crop_mode: context.cropMode,
    resize_quality: context.resizeQuality,
    format: context.format,
    format_ext: context.formatExt,
    format_quality: context.formatQuality,
    shape: context.shape,
    centering: context.centering,
    background: context.background,
    date: context.date,
    time: context.time,
    timestamp: context.timestamp,
    maintain_aspect_ratio: context.maintainAspectRatio,
  };

  return pattern.replace(/{([^}:]+)(?::(['"]?)([^}]+)\2)?}/g, function (match, key, quote, fmt) {
    let value = placeholders[key];
    if (value === undefined) return match;
    if (fmt) {
      if ((key === 'date' || key === 'time' || key === 'timestamp') && context.dateObj) {
        return formatDateTime(context.dateObj, fmt);
      }
      if (typeof value === 'number') {
        const padding = parseInt(fmt, 10);
        if (!isNaN(padding)) value = value.toString().padStart(padding, '0');
      } else if (typeof value === 'string') {
        if (fmt === 'upper') value = value.toUpperCase();
        else if (fmt === 'lower') value = value.toLowerCase();
      }
    }
    return value;
  });
}

function extractNameAndExt(filename) {
  const index = filename.lastIndexOf('.');
  if (index <= 0) return { name: filename, ext: '' };
  return { name: filename.slice(0, index), ext: filename.slice(index + 1).toLowerCase() };
}

function formatPackagingName(ext) {
  const stamp = dayjs().format('YYYYMMDDHHmmss');
  return `avatar-resizer-${stamp}.${ext}`;
}

async function createIco(canvases) {
  const entries = [];
  for (let i = 0; i < canvases.length; i++) {
    const source = canvases[i];
    if (!source) continue;
    const size = Math.min(256, Math.min(source.width, source.height));
    let target = source;
    if ((source.width !== size || source.height !== size) && typeof OffscreenCanvas !== 'undefined') {
      const offscreen = new OffscreenCanvas(size, size);
      const ctx = offscreen.getContext('2d');
      ctx.drawImage(source, 0, 0, size, size);
      target = offscreen;
    }
    const blob = await new Promise(function (resolve) {
      target.convertToBlob
        ? target.convertToBlob({ type: 'image/png' }).then(resolve)
        : target.toBlob(resolve, 'image/png');
    });
    if (!blob) continue;
    const buffer = await blob.arrayBuffer();
    entries.push({ size, buffer });
  }
  if (entries.length === 0) return null;
  let length = 6 + entries.length * 16;
  for (let i = 0; i < entries.length; i++) length += entries[i].buffer.byteLength;
  const data = new ArrayBuffer(length);
  const view = new DataView(data);
  let offset = 0;
  view.setUint16(offset, 0, true);
  offset += 2;
  view.setUint16(offset, 1, true);
  offset += 2;
  view.setUint16(offset, entries.length, true);
  offset += 2;
  let pngOffset = 6 + entries.length * 16;
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    view.setUint8(offset++, entry.size >= 256 ? 0 : entry.size);
    view.setUint8(offset++, entry.size >= 256 ? 0 : entry.size);
    view.setUint8(offset++, 0);
    view.setUint8(offset++, 0);
    view.setUint16(offset, 1, true);
    offset += 2;
    view.setUint16(offset, 32, true);
    offset += 2;
    view.setUint32(offset, entry.buffer.byteLength, true);
    offset += 4;
    view.setUint32(offset, pngOffset, true);
    offset += 4;
    pngOffset += entry.buffer.byteLength;
  }
  const out = new Uint8Array(data);
  let writeOffset = 6 + entries.length * 16;
  for (let i = 0; i < entries.length; i++) {
    out.set(new Uint8Array(entries[i].buffer), writeOffset);
    writeOffset += entries[i].buffer.byteLength;
  }
  return new Blob([out], { type: 'image/vnd.microsoft.icon' });
}

const exportedUtils = {
  $,
  $$,
  $$$,
  DEFAULT_PRESET_SETTINGS,
  DEFAULT_PRESETS,
  SUPPORTED_FORMATS,
  OUTPUT_FORMATS,
  QUALITY_NAMES,
  CENTERING_PRESETS,
  CENTERING_MAP,
  CROP_MODES,
  SHAPE_NAMES,
  STORAGE_KEYS,
  MAX_FILE_SIZE,
  clamp,
  generateId,
  hexToRgb,
  getContrastColor,
  formatBytes,
  formatDateTime,
  formatFilename,
  extractNameAndExt,
  formatPackagingName,
  createIco,
};

Object.keys(exportedUtils).forEach(function (key) {
  window[key] = exportedUtils[key];
});
