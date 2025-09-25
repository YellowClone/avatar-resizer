const $ = (id) => document.getElementById(id);
const $$ = (selector) => document.querySelector(selector);
const $$$ = (selector) => document.querySelectorAll(selector);

const DEFAULT_SIZES = [
  { name: 'Tiny', width: 100, height: 100 },
  { name: 'Small', width: 200, height: 200 },
  { name: 'Medium', width: 400, height: 400 },
  { name: 'Large', width: 800, height: 800 },
];

const DEFAULT_SETTINGS = {
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

const SUPPORTED_FORMATS = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/gif': 'GIF',
  'image/webp': 'WebP',
  'image/bmp': 'BMP',
  'image/avif': 'AVIF',
};

const OUTPUT_FORMATS = {
  png: {
    name: 'PNG',
    ext: 'png',
    mime: 'image/png',
  },
  jpeg: {
    name: 'JPEG',
    ext: 'jpg',
    mime: 'image/jpeg',
  },
  webp: {
    name: 'WebP',
    ext: 'webp',
    mime: 'image/webp',
  },
  /*gif: {
    name: 'GIF',
    ext: 'gif',
    mime: 'image/gif',
  },*/
  ico: {
    name: 'ICO',
    ext: 'ico',
    mime: 'image/vnd.microsoft.icon',
  },
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

const MAX_FILE_SIZE = 200 * 1024 * 1024;

const picaInstance = pica();

const generateId = () => Math.random().toString(36).slice(2, 11);

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function getContrastColor(hexColor) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 'inherit';
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 155 ? '#inherit' : '#ffffff';
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  return pattern.replace(/{([^}:]+)(?::(['"]?)([^}]+)\2)?}/g, (match, key, quote, format) => {
    let value = placeholders[key];
    if (value === undefined) return match;

    if (format) {
      if ((key === 'date' || key === 'time' || key === 'timestamp') && context.dateObj) {
        return formatDateTime(context.dateObj, format);
      } else if (typeof value === 'number') {
        const padding = parseInt(format, 10);
        if (!isNaN(padding)) {
          value = value.toString().padStart(padding, '0');
        }
      } else if (typeof value === 'string') {
        if (format === 'upper') value = value.toUpperCase();
        else if (format === 'lower') value = value.toLowerCase();
      }
    }

    return value;
  });
}

function formatDateTime(date, format) {
  return dayjs(date).format(format);
}

class ImageUploader {
  constructor(app) {
    this.app = app;
    this.dragCounter = 0;
    this.setupEventListeners();
  }

  setupEventListeners() {
    const uploadArea = $('upload-area-section');
    const fileInput = $('file-input');
    const changeImageBtn = $('add-image-btn');

    uploadArea.addEventListener('click', () => fileInput.click());
    changeImageBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));

    document.addEventListener('dragenter', (e) => {
      if (e.dataTransfer.types.includes('Files')) {
        e.preventDefault();
        this.dragCounter++;
        if (this.dragCounter === 1) {
          document.body.classList.add('global-drag-over');
        }
      }
    });

    document.addEventListener('dragleave', (e) => {
      if (e.dataTransfer.types.includes('Files')) {
        e.preventDefault();
        this.dragCounter--;
        if (this.dragCounter === 0) {
          document.body.classList.remove('global-drag-over');
        }
      }
    });

    document.addEventListener('dragover', (e) => {
      if (e.dataTransfer.types.includes('Files')) {
        e.preventDefault();
      }
    });

    document.addEventListener('drop', (e) => {
      if (e.dataTransfer.types.includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
        this.dragCounter = 0;
        document.body.classList.remove('global-drag-over');

        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter((file) => file.type.startsWith('image/'));
        if (imageFiles.length > 0) {
          this.handleFileSelect(imageFiles);
        }
      }
    });

    document.addEventListener('mouseleave', () => {
      this.dragCounter = 0;
      document.body.classList.remove('global-drag-over');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.dragCounter = 0;
        document.body.classList.remove('global-drag-over');
      }
    });

    document.addEventListener('click', () => {
      this.dragCounter = 0;
      document.body.classList.remove('global-drag-over');
    });

    document.addEventListener('contextmenu', () => {
      this.dragCounter = 0;
      document.body.classList.remove('global-drag-over');
    });
  }

  handleFileSelect(files) {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((file) => this.validateFile(file));
    if (validFiles.length === 0) return;

    if (validFiles.length === 1) {
      this.loadImage(validFiles[0]);
    } else {
      this.loadImagesBatch(validFiles);
    }
  }

  validateFile(file) {
    if (!SUPPORTED_FORMATS[file.type]) {
      this.showError('Unsupported file format. Please select a JPEG, PNG, GIF, WebP, or BMP image.');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      return confirm(`File ${file.name} is larger than the maximum size of ${formatBytes(MAX_FILE_SIZE)}. Add anyway?`);
    }

    return true;
  }

  loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      const blob = new Blob([arrayBuffer], { type: file.type });
      const blobUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        img.blobUrl = blobUrl;
        this.app.addImage(img, file);
      };
      img.onerror = () => {
        this.showError('Failed to load image. Please try a different file.');
      };
      img.src = blobUrl;
    };
    reader.onerror = () => {
      this.showError('Failed to read file. Please try again.');
    };
    reader.readAsArrayBuffer(file);
  }

  loadImageAsync(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        const blob = new Blob([arrayBuffer], { type: file.type });
        const blobUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          img.blobUrl = blobUrl;
          resolve({ img, file });
        };
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        img.src = blobUrl;
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsArrayBuffer(file);
    });
  }

  async loadImagesBatch(files) {
    const loadPromises = files.map((file) => this.loadImageAsync(file));
    try {
      const images = await Promise.all(loadPromises);
      this.app.addImages(images);
    } catch (error) {
      this.showError('Failed to load one or more images.');
    }
  }

  showError(message) {
    this.app.showMessage(message, 'error');
  }
}

class SizeConfiguration {
  constructor(settings = {}) {
    this.id = settings.id ?? generateId();
    this.name = settings.name ?? DEFAULT_SETTINGS.name;
    this.width = settings.width ?? DEFAULT_SETTINGS.width;
    this.height = settings.height ?? DEFAULT_SETTINGS.height;
    this.cropMode = settings.cropMode ?? DEFAULT_SETTINGS.cropMode;
    this.horizontalOffset = settings.horizontalOffset ?? DEFAULT_SETTINGS.horizontalOffset;
    this.verticalOffset = settings.verticalOffset ?? DEFAULT_SETTINGS.verticalOffset;
    this.quality = settings.quality ?? DEFAULT_SETTINGS.quality;
    this.format = settings.format ?? DEFAULT_SETTINGS.format;
    this.jpegQuality = settings.jpegQuality ?? DEFAULT_SETTINGS.jpegQuality;
    this.webpQuality = settings.webpQuality ?? DEFAULT_SETTINGS.webpQuality;
    this.gifColors = settings.gifColors ?? DEFAULT_SETTINGS.gifColors;
    this.pngCompressionLevel = settings.pngCompressionLevel ?? DEFAULT_SETTINGS.pngCompressionLevel;
    this.shape = settings.shape ?? DEFAULT_SETTINGS.shape;
    this.cornerRadius = settings.cornerRadius ?? DEFAULT_SETTINGS.cornerRadius;
    this.backgroundColor = settings.backgroundColor ?? DEFAULT_SETTINGS.backgroundColor;
    this.transparentBackground = settings.transparentBackground ?? DEFAULT_SETTINGS.transparentBackground;
    this.maintainAspectRatio = settings.maintainAspectRatio ?? DEFAULT_SETTINGS.maintainAspectRatio;
    this.filenamePattern = settings.filenamePattern ?? DEFAULT_SETTINGS.filenamePattern;
  }

  clone() {
    return new SizeConfiguration(this);
  }

  getCenteringPreset() {
    const key = `${this.horizontalOffset},${this.verticalOffset}`;
    return CENTERING_MAP[key] ?? 'custom';
  }

  getResizeQualityText() {
    return QUALITY_NAMES[this.quality];
  }

  getFormatQualityText() {
    if (this.format === 'jpeg') return `${this.jpegQuality}%`;
    if (this.format === 'webp') return `${this.webpQuality}%`;
    if (this.format === 'png') return `C${this.pngCompressionLevel}`;
    if (this.format === 'gif') return `${this.gifColors} colors`;
    return null;
  }

  getFormatNameText() {
    return OUTPUT_FORMATS[this.format].name;
  }

  getBackgroundText() {
    return this.transparentBackground ? 'Transparent' : this.backgroundColor.replace(/^#/, '');
  }

  getCropModeText() {
    return CROP_MODES[this.cropMode];
  }

  getShapeText() {
    return this.shape === 'rectangle' ? 'Rectangle' : this.shape === 'circle' ? 'Circle' : 'Rounded';
  }

  getMaintainAspectRatioText() {
    return this.maintainAspectRatio ? 'Maintain' : 'Ignore';
  }

  supportsTransparency() {
    return ['png', 'webp', 'gif', 'ico'].includes(this.format);
  }
}

class SizeManager {
  constructor(app) {
    this.app = app;
    this.sizes = [];
    this.isCompactView = false;
    this.setupEventListeners();
    this.loadSizes();
  }

  setupEventListeners() {
    $('add-size-btn').addEventListener('click', () => this.addSize());
    $('compact-view-toggle').addEventListener('click', () => this.toggleCompactView());
    $('export-config-btn').addEventListener('click', () => this.exportConfig());
    $('import-config-btn').addEventListener('click', () => $('config-file-input').click());
    $('config-file-input').addEventListener('change', (e) => this.importConfig(e.target.files));
  }

  loadSizes() {
    try {
      const saved = localStorage.getItem('avatarResizer_sizes');
      if (saved) {
        const data = JSON.parse(saved);
        this.sizes = Array.isArray(data) ? data.map((s) => new SizeConfiguration(s)) : [];
      }
    } catch (e) {
      this.sizes = [];
    }

    if (!this.sizes || this.sizes.length === 0) this.loadDefaultSizes();

    this.render();
  }

  loadDefaultSizes() {
    this.sizes = DEFAULT_SIZES.map((size) => new SizeConfiguration(size));
  }

  canDeleteSize() {
    return this.sizes.length > 1;
  }

  saveSizes() {
    localStorage.setItem('avatarResizer_sizes', JSON.stringify(this.sizes));
  }

  addSize(settings = {}) {
    const size = new SizeConfiguration(settings);
    this.sizes.push(size);
    this.saveSizes();
    this.render();
    this.editSize(size.id);
  }

  editSize(id) {
    const size = this.sizes.find((s) => s.id === id);
    if (size) {
      this.app.sizeEditor.open(size);
    }
  }

  duplicateSize(id) {
    const size = this.sizes.find((s) => s.id === id);
    if (size) {
      const duplicate = size.clone();
      duplicate.id = generateId();
      duplicate.name = `${size.name} (Copy)`;
      this.sizes.push(duplicate);
      this.saveSizes();
      this.render();
    }
  }

  deleteSize(id) {
    if (!this.canDeleteSize()) {
      return;
    }

    this.sizes = this.sizes.filter((s) => s.id !== id);
    this.saveSizes();
    this.render();
  }

  updateSize(size) {
    const index = this.sizes.findIndex((s) => s.id === size.id);
    if (index !== -1) {
      this.sizes[index] = size;
      this.saveSizes();
      this.render();
    }
  }

  toggleCompactView() {
    this.isCompactView = !this.isCompactView;
    this.applyCompactView();
    this.app.saveSettings();
  }

  setCompactView(isCompact) {
    this.isCompactView = isCompact;
    this.applyCompactView();
  }

  applyCompactView() {
    const container = $('sizes-list');
    const button = $('compact-view-toggle');

    if (this.isCompactView) {
      container.classList.add('compact');
      button.classList.add('active');
    } else {
      container.classList.remove('compact');
      button.classList.remove('active');
    }
    this.render();
  }

  exportConfig() {
    const config = {
      version: '1.0',
      timestamp: Date.now(),
      sizes: this.sizes,
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avatar-resizer-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.app.showMessage('Configuration exported successfully');
  }

  importConfig(files) {
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      let config;
      try {
        config = JSON.parse(e.target.result);
      } catch (err) {
        this.app.showMessage('Invalid configuration file', 'error');
        return;
      }

      if (!config || !Array.isArray(config.sizes)) {
        this.app.showMessage('Invalid configuration file', 'error');
        return;
      }

      if (!confirm('This will replace all current size configurations. Continue?')) return;

      this.sizes = config.sizes.map((settings) => new SizeConfiguration(settings));

      if (this.sizes.length === 0) {
        this.loadDefaultSizes();
        this.app.showMessage(
          'Configuration imported successfully. Default sizes loaded because imported config was empty.'
        );
      } else {
        this.app.showMessage('Configuration imported successfully');
      }

      this.saveSizes();
      this.render();
    };

    reader.readAsText(file);
  }

  render() {
    const container = $('sizes-list');
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    if (this.isCompactView) {
      container.classList.add('compact');
    } else {
      container.classList.remove('compact');
    }

    this.sizes.forEach((size) => {
      const item = this.createSizeItem(size);
      container.appendChild(item);
    });

    this.app.updateStatus();
  }

  createSizeItem(size) {
    const template = $('size-item-tpl');
    const item = template.content.cloneNode(true).firstElementChild;
    const tagsEl = item.querySelector('.size-tags');

    item.dataset.id = size.id;
    item.draggable = true;

    item.querySelector('.size-name').textContent = size.name;
    item.querySelector('.size-dimensions').textContent = `${size.width}x${size.height}`;

    if (this.isCompactView) {
      tagsEl.style.display = 'none';
    } else {
      while (tagsEl.firstChild) {
        tagsEl.removeChild(tagsEl.firstChild);
      }
      const tags = this.createTags(size);
      tags.forEach((tag) => tagsEl.appendChild(tag));
    }

    this.setupItemEventListeners(item, size);
    this.setupDragListeners(item, size);

    if (!this.canDeleteSize()) {
      const deleteBtn = item.querySelector('.delete-btn');
      deleteBtn.style.opacity = '0.5';
      deleteBtn.style.cursor = 'not-allowed';
      deleteBtn.title = 'Cannot delete the last size';
    }

    return item;
  }

  createTags(size) {
    const formatQuality = size.getFormatQualityText();
    const bgColor = size.transparentBackground && size.supportsTransparency() ? 'transparent' : size.backgroundColor;
    const bgStyle = bgColor === 'transparent' ? `background-color: --color-surface` : `background-color: ${bgColor}`;
    const textColor =
      bgColor === 'transparent' ? getContrastColor(DEFAULT_SETTINGS.backgroundColor) : getContrastColor(bgColor);

    const tags = [];

    const createTag = (text, style = '') => {
      const tag = $('size-tag-tpl').content.cloneNode(true).firstElementChild;
      tag.textContent = text;
      if (style) tag.style.cssText = style;
      return tag;
    };

    tags.push(createTag(size.getMaintainAspectRatioText()));
    tags.push(createTag(size.getCropModeText()));
    tags.push(createTag(size.getCenteringPreset()));
    tags.push(createTag(size.getResizeQualityText()));
    tags.push(createTag(size.getFormatNameText()));
    if (formatQuality) {
      tags.push(createTag(formatQuality));
    }
    tags.push(createTag(size.getShapeText()));
    tags.push(createTag(size.getBackgroundText(), `${bgStyle}; color: ${textColor};`));

    return tags;
  }

  setupItemEventListeners(item, size) {
    item.querySelector('.edit-btn').addEventListener('click', () => this.editSize(size.id));
    item.querySelector('.duplicate-btn').addEventListener('click', () => this.duplicateSize(size.id));
    item.querySelector('.delete-btn').addEventListener('click', () => {
      if (!this.canDeleteSize()) {
        alert('Cannot delete the last size. At least one size configuration must remain.');
        return;
      }

      if (confirm(`Delete "${size.name}" configuration?`)) {
        this.deleteSize(size.id);
      }
    });

    item.addEventListener('dblclick', () => this.editSize(size.id));
  }

  setupDragListeners(item, size) {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', size.id);
      item.classList.add('dragging');
      $('sizes-list').classList.add('drag-active');
    });

    item.addEventListener('dragend', (e) => {
      item.classList.remove('dragging');
      $('sizes-list').classList.remove('drag-active');
      $$$('.size-item').forEach((el) => el.classList.remove('drag-over'));
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      item.classList.add('drag-over');
    });

    item.addEventListener('dragleave', (e) => {
      item.classList.remove('drag-over');
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      const draggedId = e.dataTransfer.getData('text/plain');
      const targetId = size.id;

      if (draggedId !== targetId) {
        this.reorderSizes(draggedId, targetId);
      }
    });
  }

  reorderSizes(draggedId, targetId) {
    const draggedIndex = this.sizes.findIndex((s) => s.id === draggedId);
    const targetIndex = this.sizes.findIndex((s) => s.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const draggedSize = this.sizes.splice(draggedIndex, 1)[0];
    this.sizes.splice(targetIndex, 0, draggedSize);

    this.saveSizes();
    this.render();
  }
}

class SizeEditor {
  constructor(app) {
    this.app = app;
    this.currentSize = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    $('modal-close-btn').addEventListener('click', () => this.close());
    $('modal-cancel-btn').addEventListener('click', () => this.close());
    $('modal-save-btn').addEventListener('click', () => this.save());

    $('format-select').addEventListener('change', () => this.updateFormatSettings());
    $('shape-select').addEventListener('change', () => this.updateShapeSettings());
    $('crop-mode-select').addEventListener('change', () => this.updateCenteringVisibility());
    $('centering-preset-select').addEventListener('change', () => this.updateCenteringSettings());

    this.setupSliders();

    $('edit-size-modal').addEventListener('click', (e) => {
      if (e.target === $('edit-size-modal')) this.close();
    });
  }

  setupSliders() {
    const sliders = ['jpeg-quality-input', 'webp-quality-input', 'horizontal-offset-input', 'vertical-offset-input'];

    sliders.forEach((id) => {
      const slider = $(id);
      const value = $(id.replace('Input', 'Value'));
      slider.addEventListener('input', () => {
        const suffix = id.includes('Quality') ? '%' : id.includes('Offset') ? '%' : '';
        value.textContent = slider.value + suffix;
      });
    });

    /*$('pngCompressionInput').addEventListener('input', () => {
      $('pngCompressionValue').textContent = $('pngCompressionInput').value;
    });

    $('gifColorsInput').addEventListener('input', () => {
      $('gifColorsValue').textContent = $('gifColorsInput').value;
    });*/
  }

  open(size) {
    this.currentSize = size;
    this.populateForm(size);
    $('modal-title').textContent = size ? 'Edit Size' : 'Add Size';
    $('edit-size-modal').style.display = 'flex';
  }

  close() {
    $('edit-size-modal').style.display = 'none';
    this.currentSize = null;
  }

  populateForm(size) {
    if (!size) size = new SizeConfiguration();

    $('size-name-input').value = size.name;
    $('width-input').value = size.width;
    $('height-input').value = size.height;
    $('crop-mode-select').value = size.cropMode;
    $('quality-select').value = size.quality;
    $('format-select').value = size.format;
    $('jpeg-quality-input').value = size.jpegQuality;
    $('webp-quality-input').value = size.webpQuality;
    $('shape-select').value = size.shape;
    $('corner-radius-input').value = size.cornerRadius;
    $('background-color-input').value = size.backgroundColor;
    $('transparent-background-toggle').checked = size.transparentBackground;
    $('maintain-aspect-ratio-toggle').checked = size.maintainAspectRatio;
    $('filename-pattern-input').value = size.filenamePattern;
    $('horizontal-offset-input').value = size.horizontalOffset;
    $('vertical-offset-input').value = size.verticalOffset;
    $('centering-preset-select').value = size.getCenteringPreset().toLowerCase();

    this.updateFormatSettings();
    this.updateShapeSettings();
    this.updateCenteringVisibility();
    this.updateCenteringSettings();
    this.updateSliderValues();
  }

  updateSliderValues() {
    $('jpeg-quality-value').textContent = $('jpeg-quality-input').value + '%';
    $('webp-quality-value').textContent = $('webp-quality-input').value + '%';
    $('horizontal-offset-value').textContent = $('horizontal-offset-input').value + '%';
    $('vertical-offset-value').textContent = $('vertical-offset-input').value + '%';
  }

  updateFormatSettings() {
    $$$('.format-setting').forEach((setting) => (setting.style.display = 'none'));

    const format = $('format-select').value;
    const transparencySetting = $$('.transparency-setting');

    if (['png', 'webp', 'ico'].includes(format)) {
      transparencySetting.style.display = 'block';
    } else {
      transparencySetting.style.display = 'none';
    }

    const formatSetting = $$(`.${format}-setting`);
    if (formatSetting) {
      formatSetting.style.display = 'block';
    }
  }

  updateShapeSettings() {
    const shape = $('shape-select').value;
    const cornerRadiusGroup = $('corner-radius-group');
    cornerRadiusGroup.style.display = shape === 'rounded' ? 'block' : 'none';
  }

  updateCenteringSettings() {
    const preset = $('centering-preset-select').value;
    const customRow = $('custom-centering-row');

    if (preset === 'custom') {
      customRow.style.display = 'flex';
    } else {
      customRow.style.display = 'none';
      const offsets = CENTERING_PRESETS[preset];
      if (offsets) {
        $('horizontal-offset-input').value = offsets.h;
        $('vertical-offset-input').value = offsets.v;
        $('horizontal-offset-value').textContent = offsets.h + '%';
        $('vertical-offset-value').textContent = offsets.v + '%';
      }
    }
  }

  updateCenteringVisibility() {
    const centeringGroup = $('centering-preset-select')?.closest('.form-group');
    if (!centeringGroup) return;

    if ($('crop-mode-select').value === 'fill') {
      centeringGroup.style.display = 'block';
    } else {
      centeringGroup.style.display = 'none';
      $('custom-centering-row').style.display = 'none';
    }
  }

  save() {
    let width = parseInt($('width-input').value) ?? DEFAULT_SETTINGS.width;
    let height = parseInt($('height-input').value) ?? DEFAULT_SETTINGS.height;

    if (!width && !height) width = DEFAULT_SETTINGS.width;

    const settings = {
      id: this.currentSize?.id ?? generateId(),
      name: $('size-name-input').value || 'Resize',
      width,
      height,
      cropMode: $('crop-mode-select').value,
      horizontalOffset: parseInt($('horizontal-offset-input').value),
      verticalOffset: parseInt($('vertical-offset-input').value),
      quality: parseInt($('quality-select').value),
      format: $('format-select').value,
      jpegQuality: parseInt($('jpeg-quality-input').value),
      webpQuality: parseInt($('webp-quality-input').value),
      shape: $('shape-select').value,
      cornerRadius: parseInt($('corner-radius-input').value),
      backgroundColor: $('background-color-input').value,
      transparentBackground: $('transparent-background-toggle').checked,
      maintainAspectRatio: $('maintain-aspect-ratio-toggle').checked,
      filenamePattern: $('filename-pattern-input').value || '{original_name}_{width}x{height}.{format_ext}',
    };

    if (this.currentSize) {
      const size = new SizeConfiguration(settings);
      this.app.sizeManager.updateSize(size);
    } else {
      this.app.sizeManager.addSize(settings);
    }

    this.close();
  }
}

class ImageProcessor {
  constructor(app) {
    this.app = app;
    this.processedImages = [];
    this.isProcessing = false;
  }

  async renderImage(file, image, canvas, size) {
    const outputCanvas = await this.createOutputCanvas(canvas, size);
    const filename = this.generateFilename(file, image, size, outputCanvas.width, outputCanvas.height);
    const blob = await this.canvasToBlob(outputCanvas, size);

    return {
      size,
      canvas: outputCanvas,
      blob,
      filename,
      url: URL.createObjectURL(blob),
    };
  }

  async renderImages(image, file, sizes, progressCb) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0);

    for (const size of sizes) {
      try {
        progressCb(image, size);
        const result = await this.renderImage(file, image, canvas, size);
        this.processedImages.push(result);
      } catch (err) {
        console.error(`Failed to process ${size.name}:`, err);
      }
    }

    return [...this.processedImages];
  }

  async processImages(images, sizes, progressCb) {
    this.isProcessing = true;
    this.processedImages = [];

    try {
      for (const data of images) {
        const { img, file } = data;
        try {
          await this.renderImages(img, file, sizes, progressCb);
        } catch (err) {
          console.error(`Failed to process image ${file.name}:`, err);
        }
      }

      const results = [...this.processedImages];

      this.app.showProcessedImages(results);
      this.app.showMessage(`Successfully processed ${results.length} images from ${images.length} source images`);

      return results;
    } finally {
      this.isProcessing = false;
    }
  }

  async createOutputCanvas(sourceCanvas, size) {
    const { outputWidth, outputHeight } = this.calculateOutputSize(sourceCanvas.width, sourceCanvas.height, size);

    const outputCanvas = document.createElement('canvas');
    const outputCtx = outputCanvas.getContext('2d');

    outputCanvas.width = Math.max(1, Math.round(outputWidth));
    outputCanvas.height = Math.max(1, Math.round(outputHeight));

    if (!size.transparentBackground || !size.supportsTransparency()) {
      outputCtx.fillStyle = size.backgroundColor;
      outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
    }

    const rects = this.prepareRects(
      sourceCanvas.width,
      sourceCanvas.height,
      outputCanvas.width,
      outputCanvas.height,
      size
    );

    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');

    croppedCanvas.width = Math.max(1, Math.round(rects.sourceWidth));
    croppedCanvas.height = Math.max(1, Math.round(rects.sourceHeight));

    croppedCtx.drawImage(
      sourceCanvas,
      rects.sourceX,
      rects.sourceY,
      rects.sourceWidth,
      rects.sourceHeight,
      0,
      0,
      croppedCanvas.width,
      croppedCanvas.height
    );

    const resizedCanvas = document.createElement('canvas');

    resizedCanvas.width = Math.max(1, Math.round(rects.targetWidth));
    resizedCanvas.height = Math.max(1, Math.round(rects.targetHeight));

    await picaInstance.resize(croppedCanvas, resizedCanvas, {
      quality: size.quality,
      unsharpAmount: 0,
    });

    outputCtx.drawImage(resizedCanvas, rects.targetX, rects.targetY);

    if (size.shape === 'circle') this.applyCircleMask(outputCtx, outputCanvas, size);
    else if (size.shape === 'rounded') this.applyRoundedMask(outputCtx, outputCanvas, size);

    return outputCanvas;
  }

  calculateOutputSize(originalWidth, originalHeight, size) {
    const maintain = size.maintainAspectRatio && size.format !== 'ico';
    if (!maintain) {
      return {
        outputWidth: size.width ? size.width : originalWidth,
        outputHeight: size.height ? size.height : originalHeight,
      };
    }

    const aspectRatio = originalWidth / originalHeight;
    const maxWidth = size.width || undefined;
    const maxHeight = size.height || undefined;

    let newWidth = originalWidth;
    let newHeight = originalHeight;

    if (maxWidth && maxHeight) {
      if (maxWidth / maxHeight > aspectRatio) {
        newHeight = maxHeight;
        newWidth = Math.round(newHeight * aspectRatio);
      } else {
        newWidth = maxWidth;
        newHeight = Math.round(newWidth / aspectRatio);
      }
    } else if (maxWidth) {
      newWidth = maxWidth;
      newHeight = Math.round(newWidth / aspectRatio);
    } else if (maxHeight) {
      newHeight = maxHeight;
      newWidth = Math.round(newHeight * aspectRatio);
    } else {
      if (maxWidth && !maxHeight) {
        newWidth = maxWidth;
        newHeight = Math.round(newWidth / aspectRatio);
      } else if (maxHeight && !maxWidth) {
        newHeight = maxHeight;
        newWidth = Math.round(newHeight * aspectRatio);
      }
    }

    return { outputWidth: Math.round(newWidth), outputHeight: Math.round(newHeight) };
  }

  prepareRects(srcW, srcH, outW, outH, size) {
    const sourceAspect = srcW / srcH;
    const targetAspect = outW / outH;

    let sourceX = 0,
      sourceY = 0,
      sourceWidth = srcW,
      sourceHeight = srcH;
    let targetX = 0,
      targetY = 0,
      targetWidth = outW,
      targetHeight = outH;

    if (size.cropMode === 'fill') {
      if (sourceAspect > targetAspect) {
        sourceWidth = srcH * targetAspect;
        sourceX = (srcW - sourceWidth) * (size.horizontalOffset / 100);
      } else {
        sourceHeight = srcW / targetAspect;
        sourceY = (srcH - sourceHeight) * (size.verticalOffset / 100);
      }
    } else if (size.cropMode === 'fit') {
      if (sourceAspect > targetAspect) {
        targetHeight = outW / sourceAspect;
        targetY = (outH - targetHeight) * (size.verticalOffset / 100);
      } else {
        targetWidth = outH * sourceAspect;
        targetX = (outW - targetWidth) * (size.horizontalOffset / 100);
      }
    }

    return {
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      targetX,
      targetY,
      targetWidth,
      targetHeight,
    };
  }

  applyCircleMask(ctx, canvas, size) {
    const radius = Math.min(canvas.width, canvas.height) / 2;
    const centerX = size.width / 2;
    const centerY = size.height / 2;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > radius) {
          const index = (y * canvas.width + x) * 4;
          if (size.transparentBackground && size.supportsTransparency()) {
            data[index + 3] = 0;
          } else {
            const rgb = hexToRgb(size.backgroundColor);
            data[index] = rgb.r;
            data[index + 1] = rgb.g;
            data[index + 2] = rgb.b;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  applyRoundedMask(ctx, canvas, size) {
    const radius = Math.min(size.cornerRadius, canvas.width / 2, canvas.height / 2);

    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, radius);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  async canvasToBlob(canvas, size) {
    const format = OUTPUT_FORMATS[size.format];

    let quality;
    if (size.format === 'jpeg') {
      quality = size.jpegQuality / 100;
    } else if (size.format === 'webp') {
      quality = size.webpQuality / 100;
    } else if (size.format === 'ico') {
      const ua = navigator.userAgent || '';
      const isFirefox =
        ua.toLowerCase().includes('firefox') ||
        ua.toLowerCase().includes('seamonkey') ||
        ua.toLowerCase().includes('gecko/');

      // Only Firefox supports canvas.toBlob() for ICO output natively
      if (!isFirefox) {
        return this.canvasToIco(canvas);
      }

      quality = '-moz-parse-options:format=png;bpp=32';
    }

    return picaInstance.toBlob(canvas, format.mime, quality);
  }

  async canvasToIco(canvas) {
    const size = Math.min(canvas.width, canvas.height);
    const icoCanvas = document.createElement('canvas');
    icoCanvas.width = size;
    icoCanvas.height = size;

    const ctx = icoCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, 0, size, size);

    // Get PNG bytes
    const pngBlob = await new Promise((resolve) => icoCanvas.toBlob(resolve, 'image/png'));
    const pngBuf = await pngBlob.arrayBuffer();
    const pngLen = pngBuf.byteLength;

    // ICO header (6 bytes) + directory entry (16 bytes)
    const headerSize = 6 + 16;
    const totalSize = headerSize + pngLen;
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    let offset = 0;

    // Reserved (2 bytes)
    view.setUint16(offset, 0, true); // 0
    offset += 2;
    // Type (2 bytes) 1 = icon
    view.setUint16(offset, 1, true);
    offset += 2;
    // Count (2 bytes)
    view.setUint16(offset, 1, true);
    offset += 2;

    // Directory entry (16 bytes)
    // Width (1 byte) - 0 means 256
    view.setUint8(offset++, size >= 256 ? 0 : size);
    // Height (1 byte)
    view.setUint8(offset++, size >= 256 ? 0 : size);
    // Color count (1 byte)
    view.setUint8(offset++, 0);
    // Reserved (1 byte)
    view.setUint8(offset++, 0);
    // Planes (2 bytes)
    view.setUint16(offset, 1, true);
    offset += 2;
    // Bit count (2 bytes) - use 32 for RGBA PNG
    view.setUint16(offset, 32, true);
    offset += 2;
    // Bytes in resource (4 bytes)
    view.setUint32(offset, pngLen, true);
    offset += 4;
    // Image offset (4 bytes) - header + dir
    view.setUint32(offset, headerSize, true);
    offset += 4;

    // Copy PNG bytes after header
    const uint8 = new Uint8Array(buffer);
    uint8.set(new Uint8Array(pngBuf), headerSize);

    return new Blob([uint8], { type: 'image/vnd.microsoft.icon' });
  }

  generateFilename(originalFile, originalImage, size, actualWidth, actualHeight) {
    const now = new Date();
    const originalName = originalFile.name.replace(/\.[^/.]+$/, '');
    const originalExt = originalFile.name.split('.').pop().toLowerCase();

    const width = actualWidth || size.width;
    const height = actualHeight || size.height;

    const context = {
      originalName,
      originalExt,
      originalFormat: SUPPORTED_FORMATS[originalFile.type] || 'Unsupported',
      originalWidth: originalImage.width,
      originalHeight: originalImage.height,
      name: size.name,
      width: width,
      height: height,
      cropMode: size.getCropModeText(),
      resizeQuality: size.getResizeQualityText(),
      format: OUTPUT_FORMATS[size.format].name,
      formatExt: OUTPUT_FORMATS[size.format].ext,
      formatQuality: size.getFormatQualityText(),
      shape: size.getShapeText(),
      centering: size.getCenteringPreset(),
      background: size.getBackgroundText(),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].replace(/:/g, ''),
      timestamp: Math.floor(now.getTime() / 1000),
      maintainAspectRatio: size.getMaintainAspectRatioText(),
      dateObj: now,
    };

    return formatFilename(size.filenamePattern, context);
  }
}

class Gallery {
  constructor(app) {
    this.app = app;
    this.lightbox = null;
    this.setupLightbox();
  }

  setupLightbox() {
    this.processedLightbox = new PhotoSwipeLightbox({
      gallery: '#processed-images-grid',
      children: '.processed-image-link',
      pswpModule: PhotoSwipe,
    });

    this.processedLightbox.on('uiRegister', () => {
      this.processedLightbox.pswp.ui.registerElement({
        name: 'download-button',
        order: 8,
        isButton: true,
        html: '📥',
        title: 'Download',
        onClick: (event, el, pswp) => {
          const currSlide = pswp.currSlide;
          const index = currSlide.index;
          const processedImage = this.app.processor.processedImages[index];
          if (processedImage) {
            this.downloadImage(processedImage);
          }
        },
      });
    });

    this.processedLightbox.init();
  }

  show(processedImages) {
    const container = $('processed-images-grid');
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    processedImages.forEach((result, index) => {
      const template = $('processed-image-tpl');
      const item = template.content.cloneNode(true).firstElementChild;

      item.dataset.index = index;

      const link = item.querySelector('.processed-image-link');
      const img = item.querySelector('.processed-image');

      link.href = result.url;
      link.dataset.pswpWidth = result.canvas.width;
      link.dataset.pswpHeight = result.canvas.height;

      img.src = result.url;
      img.alt = result.filename;

      const nameEl = item.querySelector('.processed-image-name');
      const dimensionsEl = item.querySelector('.processed-image-dimensions');
      const sizeEl = item.querySelector('.processed-image-size');
      const formatEl = item.querySelector('.processed-image-format');

      nameEl.textContent = result.filename;
      dimensionsEl.textContent = `${result.canvas.width} x ${result.canvas.height} pixels`;
      sizeEl.textContent = formatBytes(result.blob.size);
      formatEl.textContent = OUTPUT_FORMATS[result.size.format].name;

      const downloadBtn = item.querySelector('.processed-image-download');
      downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.downloadImage(result);
      });

      container.appendChild(item);
    });

    $('processed-images-section').style.display = 'block';
    $('processed-info').textContent = `${processedImages.length} processed images`;
  }

  downloadImage(result) {
    // Create a transient object URL from the Blob to force download behavior
    // (some browsers may navigate to certain mime types instead of
    // downloading when using existing object URLs). Creating a fresh URL from
    // the Blob and using the download attribute ensures the file is saved.
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke the transient URL after a short timeout to allow the download to start
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

class DownloadManager {
  constructor(app) {
    this.app = app;
    this.setupEventListeners();
  }

  setupEventListeners() {
    $('download-zip-btn').addEventListener('click', () => this.downloadAll());
    $('download-ico-btn').addEventListener('click', () => this.downloadIco());
  }

  async downloadAll() {
    const processedImages = this.app.processor.processedImages;
    if (processedImages.length === 0) return;

    try {
      const zip = new JSZip();

      for (const result of processedImages) {
        zip.file(result.filename, result.blob);
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `avatar-resizer-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
      this.app.showMessage('ZIP file downloaded successfully');
    } catch (err) {
      this.app.showMessage('Failed to create ZIP file', 'error');
    }
  }

  async downloadIco() {
    const processedImages = this.app.processor.processedImages;
    if (!processedImages || processedImages.length === 0) return;

    try {
      // First, collect PNG ArrayBuffers for each image
      const pngBuffers = [];

      for (const result of processedImages) {
        const canvas = result.canvas;
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        const buf = await blob.arrayBuffer();
        pngBuffers.push({ buf: new Uint8Array(buf), width: canvas.width, height: canvas.height });
      }

      // Calculate sizes
      const count = pngBuffers.length;
      const headerSize = 6;
      const dirEntrySize = 16;
      let offset = headerSize + dirEntrySize * count;

      // Calculate total size
      let totalSize = offset;
      for (const p of pngBuffers) totalSize += p.buf.byteLength;

      const outBuf = new ArrayBuffer(totalSize);
      const view = new DataView(outBuf);
      const out8 = new Uint8Array(outBuf);
      let ptr = 0;

      view.setUint16(ptr, 0, true);
      ptr += 2; // Reserved
      view.setUint16(ptr, 1, true);
      ptr += 2; // Type 1 = icon
      view.setUint16(ptr, count, true);
      ptr += 2; // Count

      // Directory entries
      for (let i = 0; i < count; i++) {
        const p = pngBuffers[i]; // Width (1 byte) - 0 means 256

        out8[ptr++] = p.width >= 256 ? 0 : p.width; // Height (1 byte)
        out8[ptr++] = p.height >= 256 ? 0 : p.height; // Color count
        out8[ptr++] = 0; // Reserved
        out8[ptr++] = 0; // Planes (2 bytes)

        view.setUint16(ptr, 1, true);
        ptr += 2; // Bit count (2 bytes) - 32 for PNG with alpha
        view.setUint16(ptr, 32, true);
        ptr += 2; // Bytes in resource (4 bytes)
        view.setUint32(ptr, p.buf.byteLength, true);
        ptr += 4; // Image offset (4 bytes)
        view.setUint32(ptr, offset, true);
        ptr += 4;

        offset += p.buf.byteLength;
      }

      // Copy image data
      let dataPtr = headerSize + dirEntrySize * count;
      for (const p of pngBuffers) {
        out8.set(p.buf, dataPtr);
        dataPtr += p.buf.byteLength;
      }

      const icoBlob = new Blob([out8], { type: 'image/vnd.microsoft.icon' });
      const url = URL.createObjectURL(icoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avatar-resizer-${Date.now()}.ico`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.app.showMessage('ICO file downloaded successfully');
    } catch (err) {
      console.error('downloadIco error', err);
      this.app.showMessage('Failed to create ICO file', 'error');
    }
  }
}

class AvatarResizerApp {
  constructor() {
    this.originalImages = new Map();
    this.currentImageId = null;
    this.autoProcess = true;
    this.theme = 'light';

    this.uploader = new ImageUploader(this);
    this.sizeManager = new SizeManager(this);
    this.sizeEditor = new SizeEditor(this);
    this.processor = new ImageProcessor(this);
    this.gallery = new Gallery(this);
    this.downloadManager = new DownloadManager(this);

    this.setupEventListeners();
    this.loadSettings();
    this.updateStatus();
  }

  setupEventListeners() {
    $('process-btn').addEventListener('click', () => this.processImages());
    $('auto-process-toggle').addEventListener('change', (e) => {
      this.autoProcess = e.target.checked;
      this.saveSettings();
    });
    $('theme-toggle').addEventListener('click', () => {
      this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
    });
  }

  getCurrentImage() {
    return this.currentImageId ? this.originalImages.get(this.currentImageId) : null;
  }

  setCurrentImage(id) {
    this.currentImageId = id;
    const current = this.getCurrentImage();
    if (!current) return;

    $('image-preview').src = current.img.src;

    const infoContainer = $('image-preview-info');
    while (infoContainer.firstChild) {
      infoContainer.removeChild(infoContainer.firstChild);
    }

    const template = $('image-info-tpl');
    const infoElement = template.content.cloneNode(true);

    const dimensionsEl = infoElement.querySelector('.image-dimensions');
    const sizeEl = infoElement.querySelector('.image-size');
    const formatEl = infoElement.querySelector('.image-format');

    dimensionsEl.textContent = `${current.img.width} x ${current.img.height} pixels`;
    sizeEl.textContent = formatBytes(current.file.size);
    formatEl.textContent = SUPPORTED_FORMATS[current.file.type] || 'Unsupported';

    infoContainer.appendChild(infoElement);

    $('upload-area-section').style.display = 'none';
    $('image-preview-section').style.display = 'flex';

    $$$('.image-gallery-item').forEach((item) => item.classList.remove('active'));
    const activeItem = $(`image-gallery-item-${id}`);
    if (activeItem) activeItem.classList.add('active');
  }

  addImage(img, file) {
    this.addImages([{ img, file }]);
  }

  addImages(images) {
    if (this.processor && this.processor.isProcessing) return;

    images.forEach(({ img, file }) => {
      const id = generateId();
      this.originalImages.set(id, { img, file });
      this.addToGallery(id, img);
    });

    if (images.length > 0) {
      const lastId = Array.from(this.originalImages.keys()).pop();
      this.setCurrentImage(lastId);
    }

    this.updateStatus();

    if (this.autoProcess && this.sizeManager.sizes.length > 0) {
      this.processImages();
    }
  }

  removeImage(id) {
    if (this.processor && this.processor.isProcessing) return;

    const image = this.originalImages.get(id);
    if (image && image.img.blobUrl) {
      URL.revokeObjectURL(image.img.blobUrl);
    }

    this.originalImages.delete(id);

    const itemEl = $(`image-gallery-item-${id}`);
    if (itemEl) {
      itemEl.remove();
    }

    if (this.currentImageId === id) {
      const remainingIds = Array.from(this.originalImages.keys());
      if (remainingIds.length > 0) {
        this.setCurrentImage(remainingIds[0]);
      } else {
        this.currentImageId = null;
        $('upload-area-section').style.display = 'block';
        $('image-preview-section').style.display = 'none';
        $('image-gallery-section').style.display = 'none';
      }
    }

    this.updateStatus();
  }

  async processImages() {
    const sizes = this.sizeManager.sizes;
    if (sizes.length === 0) return;

    let processed = 0;

    const images = Array.from(this.originalImages.values());
    const total = sizes.length * images.length;

    const iconEl = $$('#process-btn .process-icon');
    const textEl = $$('#process-btn .process-text');

    iconEl.textContent = '⏳';
    textEl.textContent = ` Processing... (0/${total})`;

    const updateProgress = () => {
      textEl.textContent = ` Processing... (${++processed}/${total})`;
    };

    this.processor.isProcessing = true;
    this.updateStatus();

    try {
      await this.processor.processImages(images, this.sizeManager.sizes, updateProgress);
    } finally {
      iconEl.textContent = '🔄';
      textEl.textContent = ' Process Images';
      this.processor.isProcessing = false;
      this.updateStatus();
    }
  }

  addToGallery(id, img) {
    const data = this.originalImages.get(id);
    const item = $('image-gallery-item-tpl').content.cloneNode(true);
    const image = item.querySelector('.image-gallery-img');

    image.src = img.src;
    image.alt = `Image ${id}`;

    item.querySelector('.image-gallery-name').textContent = data.file.name;
    item.querySelector('.image-gallery-size').textContent = formatBytes(data.file.size);
    item.querySelector('.image-gallery-format').textContent = SUPPORTED_FORMATS[data.file.type] || 'Unsupported';
    item.querySelector('.image-gallery-dimensions').textContent = `${img.naturalWidth} x ${img.naturalHeight} pixels`;

    const itemEl = item.querySelector('.image-gallery-item');
    itemEl.id = `image-gallery-item-${id}`;
    itemEl.addEventListener('click', (e) => {
      if (!e.target.classList.contains('image-gallery-close')) {
        this.setCurrentImage(id);
      }
    });

    const closeBtn = item.querySelector('.image-gallery-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeImage(id);
    });

    $('image-gallery-content').appendChild(item);
    $('image-gallery-section').style.display = 'block';
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('avatarResizer_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.autoProcess = settings.autoProcess ?? true;
        $('auto-process-toggle').checked = this.autoProcess;
        this.sizeManager.setCompactView(settings.isCompactView ?? false);
        this.theme = settings.theme;
        this.setTheme(this.theme);
      }
    } catch (e) {
      this.autoProcess = true;
    }
  }

  saveSettings() {
    const settings = {
      autoProcess: this.autoProcess,
      isCompactView: this.sizeManager.isCompactView,
      theme: this.theme,
    };
    localStorage.setItem('avatarResizer_settings', JSON.stringify(settings));
  }

  setTheme(theme) {
    if (theme) this.theme = theme || 'light';

    if (this.theme === 'light') {
      document.body.removeAttribute('data-theme');
    } else {
      document.body.setAttribute('data-theme', this.theme);
    }

    $('theme-toggle-icon').textContent = this.theme === 'dark' ? '🌙' : '🌞';
    $('theme-toggle').setAttribute('aria-pressed', this.theme === 'dark' ? 'true' : 'false');
    $('theme-toggle').title = this.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';

    this.saveSettings();
  }

  updateStatus() {
    if (!this.sizeManager || !this.processor) return;

    const hasImages = this.originalImages.size > 0;
    const hasSizes = this.sizeManager.sizes.length > 0;
    const hasProcessed = !this.processor.isProcessing;
    const hasResults = this.processor.processedImages.length > 0;

    $('process-btn').disabled = !hasImages || !hasSizes || !hasProcessed;
    $('download-zip-btn').disabled = !hasResults || !hasProcessed;
    $('download-ico-btn').disabled = !hasResults || !hasProcessed;
    $('add-image-btn').disabled = !hasProcessed;
  }

  showProcessedImages(results) {
    this.gallery.show(results);
  }

  showMessage(text, type = 'success') {
    const existingMessage = $$('.app-message');
    if (existingMessage) existingMessage.remove();

    const message = $('message-tpl').content.cloneNode(true).firstElementChild;

    message.className = `app-message ${type}`;
    message.textContent = text;

    document.body.appendChild(message);

    setTimeout(() => {
      message.classList.add('show');
    }, 10);

    setTimeout(() => {
      message.classList.remove('show');
      setTimeout(() => {
        if (message.parentNode) {
          message.parentNode.removeChild(message);
        }
      }, 300);
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AvatarResizerApp();
});
