const $ = (id) => document.getElementById(id);
const $$ = (selector) => document.querySelector(selector);

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
  filenamePattern: '{original_name}_{width}x{height}.{format_ext}',
};

const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];

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
  gif: {
    name: 'GIF',
    ext: 'gif',
    mime: 'image/gif',
  },
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
  '100,100': 'bottom-Right',
};

const CROP_MODES = {
  fit: 'Fit',
  fill: 'Fill',
  stretch: 'Stretch',
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const generateId = () => Math.random().toString(36).slice(2, 11);

const picaInstance = pica();

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

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

function formatFilename(pattern, context) {
  const placeholders = {
    original_name: context.originalName,
    original_ext: context.originalExt,
    original_width: context.originalWidth,
    original_height: context.originalHeight,
    name: context.name,
    width: context.width,
    height: context.height,
    crop_mode: context.cropMode,
    resize_quality: context.resizeQuality,
    format: context.format,
    format_ext: context.formatExt,
    quality_text: context.qualityText,
    shape: context.shape,
    centering: context.centering,
    background: context.background,
    date: context.date,
    time: context.time,
    timestamp: context.timestamp,
  };

  // Enhanced regex to support quoted formats: {key:"format"} or {key:'format'} or {key:format}
  return pattern.replace(/{([^}:]+)(?::(['"]?)([^}]+)\2)?}/g, (match, key, quote, format) => {
    let value = placeholders[key];
    if (value === undefined) return match;

    if (format) {
      // Date/time formatting for date, time, and timestamp placeholders
      if ((key === 'date' || key === 'time' || key === 'timestamp') && context.dateObj) {
        return formatDateTime(context.dateObj, format);
      }
      // Number padding
      else if (typeof value === 'number') {
        const padding = parseInt(format, 10);
        if (!isNaN(padding)) {
          value = value.toString().padStart(padding, '0');
        }
      }
      // String transformations
      else if (typeof value === 'string') {
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
    const uploadArea = $('uploadArea');
    const fileInput = $('fileInput');
    const browseBtn = $('browseBtn');
    const changeImageBtn = $('changeImageBtn');

    uploadArea.addEventListener('click', () => fileInput.click());
    changeImageBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadArea.classList.remove('drag-over');

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((file) => file.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        this.handleFileSelect([imageFiles[0]]);
      }
    });

    // Global drag and drop for files only
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
          this.handleFileSelect([imageFiles[0]]);
        }
      }
    });

    // Remove global drag class on mouse leave viewport
    document.addEventListener('mouseleave', () => {
      this.dragCounter = 0;
      document.body.classList.remove('global-drag-over');
    });

    // Remove on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.dragCounter = 0;
        document.body.classList.remove('global-drag-over');
      }
    });

    // Remove on click (left or right)
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

    const file = files[0];
    if (!this.validateFile(file)) return;

    this.loadImage(file);
  }

  validateFile(file) {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      this.showError('Unsupported file format. Please select a JPEG, PNG, GIF, WebP, or BMP image.');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      this.showError(`File too large. Maximum size is ${formatBytes(MAX_FILE_SIZE)}.`);
      return false;
    }

    return true;
  }

  loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.app.setOriginalImage(img, file);
      };
      img.onerror = () => {
        this.showError('Failed to load image. Please try a different file.');
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      this.showError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
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
    this.filenamePattern = settings.filenamePattern ?? DEFAULT_SETTINGS.filenamePattern;
  }

  clone() {
    return new SizeConfiguration(this);
  }

  getCenteringPreset() {
    const key = `${this.horizontalOffset},${this.verticalOffset}`;
    return CENTERING_MAP[key] ?? 'custom';
  }

  getQualityText() {
    const qualityName = QUALITY_NAMES[this.quality];
    if (this.format === 'jpeg') return `${this.jpegQuality}%`;
    if (this.format === 'webp') return `${this.webpQuality}%`;
    if (this.format === 'png') return `C${this.pngCompressionLevel}`;
    if (this.format === 'gif') return `${this.gifColors} colors`;
    return qualityName;
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

  supportsTransparency() {
    return ['png', 'webp', 'gif'].includes(this.format);
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
    $('addSizeBtn').addEventListener('click', () => this.addSize());
    $('compactViewToggle').addEventListener('click', () => this.toggleCompactView());
    $('exportConfigBtn').addEventListener('click', () => this.exportConfig());
    $('importConfigBtn').addEventListener('click', () => $('configFileInput').click());
    $('configFileInput').addEventListener('change', (e) => this.importConfig(e.target.files));
  }

  loadSizes() {
    try {
      const saved = localStorage.getItem('avatarResizer_sizes');
      if (saved) {
        const data = JSON.parse(saved);
        this.sizes = data.map((settings) => new SizeConfiguration(settings));

        // If no sizes loaded, load defaults
        if (this.sizes.length === 0) {
          this.loadDefaultSizes();
        }
      } else {
        this.loadDefaultSizes();
      }
    } catch (e) {
      this.loadDefaultSizes();
    }
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
      duplicate.name = `${size.name} Copy`;
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
    const container = $('sizesList');
    const button = $('compactViewToggle');

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
      try {
        const config = JSON.parse(e.target.result);
        if (!config.sizes || !Array.isArray(config.sizes)) {
          throw new Error('Invalid configuration format');
        }

        if (confirm('This will replace all current size configurations. Continue?')) {
          this.sizes = config.sizes.map((settings) => new SizeConfiguration(settings));

          // If imported config has no sizes, load defaults
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
        }
      } catch (err) {
        this.app.showMessage('Invalid configuration file', 'error');
      }
    };
    reader.readAsText(file);
  }

  render() {
    const container = $('sizesList');
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Sync compact view CSS class
    if (this.isCompactView) {
      container.classList.add('compact');
    } else {
      container.classList.remove('compact');
    }

    this.sizes.forEach((size) => {
      const item = this.createSizeItem(size);
      container.appendChild(item);
    });

    // Always try to update status, but let updateStatus handle the guard
    this.app.updateStatus();
  }

  createSizeItem(size) {
    const template = $('sizeItemTemplate');
    const item = template.content.cloneNode(true).firstElementChild;

    item.dataset.id = size.id;
    item.draggable = true;

    const nameEl = item.querySelector('.size-name');
    const dimensionsEl = item.querySelector('.size-dimensions');
    const tagsEl = item.querySelector('.size-tags');

    nameEl.textContent = size.name;
    dimensionsEl.textContent = `${size.width}×${size.height}`;

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

    // Disable delete button if this is the only size
    if (!this.canDeleteSize()) {
      const deleteBtn = item.querySelector('.delete-btn');
      deleteBtn.style.opacity = '0.5';
      deleteBtn.style.cursor = 'not-allowed';
      deleteBtn.title = 'Cannot delete the last size';
    }

    return item;
  }

  createTags(size) {
    const format = OUTPUT_FORMATS[size.format];
    const cropMode = CROP_MODES[size.cropMode];
    const resizeQuality = size.getResizeQualityText();
    const formatQuality = size.getFormatQualityText();
    const centering = size.getCenteringPreset();
    const shape = size.shape === 'rectangle' ? 'Rectangle' : size.shape === 'circle' ? 'Circle' : 'Rounded';

    const bgColor = size.transparentBackground && size.supportsTransparency() ? 'transparent' : size.backgroundColor;
    const displayBgColor = bgColor === 'transparent' ? DEFAULT_SETTINGS.backgroundColor : bgColor;
    const textColor =
      bgColor === 'transparent' ? getContrastColor(DEFAULT_SETTINGS.backgroundColor) : getContrastColor(bgColor);
    const bgStyle =
      bgColor === 'transparent'
        ? `background-color: ${DEFAULT_SETTINGS.backgroundColor}`
        : `background-color: ${bgColor}`;

    const tagTemplate = $('sizeTagTemplate');
    const tags = [];

    const createTag = (text, style = '') => {
      const tag = tagTemplate.content.cloneNode(true).firstElementChild;
      tag.textContent = text;
      if (style) tag.style.cssText = style;
      return tag;
    };

    tags.push(createTag(cropMode));
    tags.push(createTag(centering));
    tags.push(createTag(resizeQuality));
    tags.push(createTag(format.name));
    if (formatQuality) {
      tags.push(createTag(formatQuality));
    }
    tags.push(createTag(shape));
    tags.push(
      createTag(bgColor === 'transparent' ? 'Transparent' : displayBgColor, `${bgStyle}; color: ${textColor};`)
    );

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
      $('sizesList').classList.add('drag-active');
    });

    item.addEventListener('dragend', (e) => {
      item.classList.remove('dragging');
      $('sizesList').classList.remove('drag-active');
      // Remove drag-over from all items
      document.querySelectorAll('.size-item').forEach((el) => el.classList.remove('drag-over'));
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
    $('modalCloseBtn').addEventListener('click', () => this.close());
    $('modalCancelBtn').addEventListener('click', () => this.close());
    $('modalSaveBtn').addEventListener('click', () => this.save());

    $('formatSelect').addEventListener('change', () => this.updateFormatSettings());
    $('shapeSelect').addEventListener('change', () => this.updateShapeSettings());
    $('centeringPresetSelect').addEventListener('change', () => this.updateCenteringSettings());

    this.setupSliders();

    $('editSizeModal').addEventListener('click', (e) => {
      if (e.target === $('editSizeModal')) this.close();
    });
  }

  setupSliders() {
    const sliders = ['jpegQualityInput', 'webpQualityInput', 'horizontalOffsetInput', 'verticalOffsetInput'];

    sliders.forEach((id) => {
      const slider = $(id);
      const value = $(id.replace('Input', 'Value'));
      slider.addEventListener('input', () => {
        const suffix = id.includes('Quality') ? '%' : id.includes('Offset') ? '%' : '';
        value.textContent = slider.value + suffix;
      });
    });

    $('pngCompressionInput').addEventListener('input', () => {
      $('pngCompressionValue').textContent = $('pngCompressionInput').value;
    });

    $('gifColorsInput').addEventListener('input', () => {
      $('gifColorsValue').textContent = $('gifColorsInput').value;
    });
  }

  open(size) {
    this.currentSize = size;
    this.populateForm(size);
    $('modalTitle').textContent = size ? 'Edit Size' : 'Add Size';
    $('editSizeModal').style.display = 'flex';
  }

  close() {
    $('editSizeModal').style.display = 'none';
    this.currentSize = null;
  }

  populateForm(size) {
    if (!size) size = new SizeConfiguration();

    $('sizeNameInput').value = size.name;
    $('widthInput').value = size.width;
    $('heightInput').value = size.height;
    $('cropModeSelect').value = size.cropMode;
    $('qualitySelect').value = size.quality;
    $('formatSelect').value = size.format;
    $('jpegQualityInput').value = size.jpegQuality;
    $('webpQualityInput').value = size.webpQuality;
    $('pngCompressionInput').value = size.pngCompressionLevel;
    $('gifColorsInput').value = size.gifColors;
    $('shapeSelect').value = size.shape;
    $('cornerRadiusInput').value = size.cornerRadius;
    $('backgroundColorInput').value = size.backgroundColor;
    $('transparentBackgroundToggle').checked = size.transparentBackground;
    $('filenamePatternInput').value = size.filenamePattern;
    $('horizontalOffsetInput').value = size.horizontalOffset;
    $('verticalOffsetInput').value = size.verticalOffset;

    const centeringPreset = size.getCenteringPreset().toLowerCase();
    $('centeringPresetSelect').value = centeringPreset;

    this.updateFormatSettings();
    this.updateShapeSettings();
    this.updateCenteringSettings();
    this.updateSliderValues();
  }

  updateSliderValues() {
    $('jpegQualityValue').textContent = $('jpegQualityInput').value + '%';
    $('webpQualityValue').textContent = $('webpQualityInput').value + '%';
    $('pngCompressionValue').textContent = $('pngCompressionInput').value;
    $('gifColorsValue').textContent = $('gifColorsInput').value;
    $('horizontalOffsetValue').textContent = $('horizontalOffsetInput').value + '%';
    $('verticalOffsetValue').textContent = $('verticalOffsetInput').value + '%';
  }

  updateFormatSettings() {
    const format = $('formatSelect').value;
    const formatSettings = document.querySelectorAll('.format-setting');
    formatSettings.forEach((setting) => (setting.style.display = 'none'));

    const transparencySetting = $$('.transparency-setting');
    if (['png', 'webp', 'gif'].includes(format)) {
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
    const shape = $('shapeSelect').value;
    const cornerRadiusGroup = $('cornerRadiusGroup');
    cornerRadiusGroup.style.display = shape === 'rounded' ? 'block' : 'none';
  }

  updateCenteringSettings() {
    const preset = $('centeringPresetSelect').value;
    const customRow = $('customCenteringRow');

    if (preset === 'custom') {
      customRow.style.display = 'flex';
    } else {
      customRow.style.display = 'none';
      const offsets = CENTERING_PRESETS[preset];
      if (offsets) {
        $('horizontalOffsetInput').value = offsets.h;
        $('verticalOffsetInput').value = offsets.v;
        $('horizontalOffsetValue').textContent = offsets.h + '%';
        $('verticalOffsetValue').textContent = offsets.v + '%';
      }
    }
  }

  save() {
    const settings = {
      id: this.currentSize?.id ?? generateId(),
      name: $('sizeNameInput').value || 'Resize',
      width: parseInt($('widthInput').value) || 400,
      height: parseInt($('heightInput').value) || 400,
      cropMode: $('cropModeSelect').value,
      horizontalOffset: parseInt($('horizontalOffsetInput').value),
      verticalOffset: parseInt($('verticalOffsetInput').value),
      quality: parseInt($('qualitySelect').value),
      format: $('formatSelect').value,
      jpegQuality: parseInt($('jpegQualityInput').value),
      webpQuality: parseInt($('webpQualityInput').value),
      gifColors: parseInt($('gifColorsInput').value),
      pngCompressionLevel: parseInt($('pngCompressionInput').value),
      shape: $('shapeSelect').value,
      cornerRadius: parseInt($('cornerRadiusInput').value),
      backgroundColor: $('backgroundColorInput').value,
      transparentBackground: $('transparentBackgroundToggle').checked,
      filenamePattern: $('filenamePatternInput').value || '{original_name}_{width}x{height}.{format_ext}',
    };

    const size = new SizeConfiguration(settings);

    if (this.currentSize) {
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

  async processImages(originalImage, originalFile, sizes) {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.processedImages = [];

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;
      ctx.drawImage(originalImage, 0, 0);

      const results = [];
      for (const size of sizes) {
        try {
          const result = await this.processImage(canvas, originalFile, size);
          results.push(result);
          this.processedImages.push(result);
        } catch (err) {
          console.error(`Failed to process ${size.name}:`, err);
        }
      }

      this.app.showProcessedImages(results);
      this.app.showMessage(`Successfully processed ${results.length} images`);
      return results;
    } finally {
      this.isProcessing = false;
    }
  }

  async processImage(sourceCanvas, originalFile, size) {
    const outputCanvas = await this.createOutputCanvas(sourceCanvas, size);
    const blob = await this.canvasToBlob(outputCanvas, size);
    const filename = this.generateFilename(originalFile, size);

    return {
      size,
      canvas: outputCanvas,
      blob,
      filename,
      url: URL.createObjectURL(blob),
    };
  }

  async createOutputCanvas(sourceCanvas, size) {
    const outputCanvas = document.createElement('canvas');
    const ctx = outputCanvas.getContext('2d');

    outputCanvas.width = size.width;
    outputCanvas.height = size.height;

    if (!size.transparentBackground || !size.supportsTransparency()) {
      ctx.fillStyle = size.backgroundColor;
      ctx.fillRect(0, 0, size.width, size.height);
    }

    const sourceAspect = sourceCanvas.width / sourceCanvas.height;
    const targetAspect = size.width / size.height;

    let sourceX = 0,
      sourceY = 0,
      sourceWidth = sourceCanvas.width,
      sourceHeight = sourceCanvas.height;
    let targetX = 0,
      targetY = 0,
      targetWidth = size.width,
      targetHeight = size.height;

    // First, prepare the source region based on crop mode
    if (size.cropMode === 'fill') {
      // Crop source to match target aspect ratio
      if (sourceAspect > targetAspect) {
        // Source is wider, crop horizontally
        sourceWidth = sourceCanvas.height * targetAspect;
        sourceX = (sourceCanvas.width - sourceWidth) * (size.horizontalOffset / 100);
      } else {
        // Source is taller, crop vertically
        sourceHeight = sourceCanvas.width / targetAspect;
        sourceY = (sourceCanvas.height - sourceHeight) * (size.verticalOffset / 100);
      }
    } else if (size.cropMode === 'fit') {
      // Calculate target dimensions to maintain aspect ratio
      if (sourceAspect > targetAspect) {
        // Source is wider
        targetHeight = size.width / sourceAspect;
        targetY = (size.height - targetHeight) * (size.verticalOffset / 100);
      } else {
        // Source is taller
        targetWidth = size.height * sourceAspect;
        targetX = (size.width - targetWidth) * (size.horizontalOffset / 100);
      }
    }

    // Create a source canvas with the cropped region
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = sourceWidth;
    croppedCanvas.height = sourceHeight;
    const croppedCtx = croppedCanvas.getContext('2d');
    croppedCtx.drawImage(sourceCanvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);

    // Create target canvas for resizing
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = targetWidth;
    resizedCanvas.height = targetHeight;

    // Use pica to resize
    await picaInstance.resize(croppedCanvas, resizedCanvas, {
      quality: size.quality,
      unsharpAmount: 0,
    });

    // Draw the resized image onto the output canvas
    ctx.drawImage(resizedCanvas, targetX, targetY);

    if (size.shape === 'circle') {
      this.applyCircleMask(ctx, size);
    } else if (size.shape === 'rounded') {
      this.applyRoundedMask(ctx, size);
    }

    return outputCanvas;
  }

  applyCircleMask(ctx, size) {
    const radius = Math.min(size.width, size.height) / 2;
    const centerX = size.width / 2;
    const centerY = size.height / 2;

    const imageData = ctx.getImageData(0, 0, size.width, size.height);
    const data = imageData.data;

    for (let y = 0; y < size.height; y++) {
      for (let x = 0; x < size.width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > radius) {
          const index = (y * size.width + x) * 4;
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

  applyRoundedMask(ctx, size) {
    const radius = Math.min(size.cornerRadius, size.width / 2, size.height / 2);

    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.roundRect(0, 0, size.width, size.height, radius);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  async canvasToBlob(canvas, size) {
    const format = OUTPUT_FORMATS[size.format];

    if (size.format === 'ico') {
      return this.canvasToIco(canvas);
    }

    let quality;
    if (size.format === 'jpeg') {
      quality = size.jpegQuality / 100;
    } else if (size.format === 'webp') {
      quality = size.webpQuality / 100;
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

    return picaInstance.toBlob(icoCanvas, 'image/png');
  }

  generateFilename(originalFile, size) {
    const now = new Date();
    const originalName = originalFile.name.replace(/\.[^/.]+$/, '');
    const originalExt = originalFile.name.split('.').pop().toLowerCase();

    const context = {
      originalName,
      originalExt,
      originalWidth: this.app.originalImage.width,
      originalHeight: this.app.originalImage.height,
      name: size.name,
      width: size.width,
      height: size.height,
      cropMode: CROP_MODES[size.cropMode],
      resizeQuality: size.getResizeQualityText(),
      format: OUTPUT_FORMATS[size.format].name,
      formatExt: OUTPUT_FORMATS[size.format].ext,
      qualityText: size.getQualityText(),
      shape: size.shape === 'rectangle' ? 'Rectangle' : size.shape === 'circle' ? 'Circle' : 'Rounded',
      centering: size.getCenteringPreset(),
      background: size.transparentBackground ? 'Transparent' : size.backgroundColor.replace(/^#/, ''),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].replace(/:/g, ''),
      timestamp: Math.floor(now.getTime() / 1000),
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
    this.lightbox = new PhotoSwipeLightbox({
      gallery: '#processedImagesGrid',
      children: '.processed-image-link',
      pswpModule: PhotoSwipe,
    });

    this.lightbox.on('uiRegister', () => {
      this.lightbox.pswp.ui.registerElement({
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

    this.lightbox.init();
  }

  show(processedImages) {
    const container = $('processedImagesGrid');
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    processedImages.forEach((result, index) => {
      const template = $('processedImageTemplate');
      const item = template.content.cloneNode(true).firstElementChild;

      item.dataset.index = index;

      const link = item.querySelector('.processed-image-link');
      const img = item.querySelector('.processed-image');

      // Set up the link and image for PhotoSwipe
      link.href = result.url;
      link.dataset.pswpWidth = result.size.width;
      link.dataset.pswpHeight = result.size.height;

      img.src = result.url;
      img.alt = result.filename;

      const nameEl = item.querySelector('.processed-image-name');
      const detailsEl = item.querySelector('.processed-image-details');

      nameEl.textContent = result.filename;
      detailsEl.textContent = `${result.size.width}×${result.size.height} • ${OUTPUT_FORMATS[result.size.format].name}`;

      const downloadBtn = item.querySelector('.processed-image-download');
      downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.downloadImage(result);
      });

      container.appendChild(item);
    });

    $('processedImagesSection').style.display = 'block';
    $('processedInfo').textContent = `${processedImages.length} processed images`;
  }

  downloadImage(result) {
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

class DownloadManager {
  constructor(app) {
    this.app = app;
    this.setupEventListeners();
  }

  setupEventListeners() {
    $('downloadBtn').addEventListener('click', () => this.downloadAll());
  }

  async downloadAll() {
    const processedImages = this.app.processor.processedImages;
    if (processedImages.length === 0) return;

    if (processedImages.length === 1) {
      this.app.gallery.downloadImage(processedImages[0]);
      return;
    }

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
}

class AvatarResizerApp {
  constructor() {
    this.originalImage = null;
    this.originalFile = null;
    this.autoProcess = true;

    this.uploader = new ImageUploader(this);
    this.sizeManager = new SizeManager(this);
    this.sizeEditor = new SizeEditor(this);
    this.processor = new ImageProcessor(this);
    this.gallery = new Gallery(this);
    this.downloadManager = new DownloadManager(this);

    this.setupEventListeners();
    this.loadSettings();
    // Move updateStatus after all components are initialized
    this.updateStatus();
  }

  setupEventListeners() {
    $('processBtn').addEventListener('click', () => this.processImages());
    $('autoProcessToggle').addEventListener('change', (e) => {
      this.autoProcess = e.target.checked;
      this.saveSettings();
    });
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('avatarResizer_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.autoProcess = settings.autoProcess ?? true;
        $('autoProcessToggle').checked = this.autoProcess;
      }
    } catch (e) {
      this.autoProcess = true;
    }
  }

  saveSettings() {
    const settings = { autoProcess: this.autoProcess };
    localStorage.setItem('avatarResizer_settings', JSON.stringify(settings));
  }

  setOriginalImage(img, file) {
    this.originalImage = img;
    this.originalFile = file;

    $('originalImage').src = img.src;

    const infoContainer = $('originalImageInfo');
    while (infoContainer.firstChild) {
      infoContainer.removeChild(infoContainer.firstChild);
    }

    const template = $('originalImageInfoTemplate');
    const infoElement = template.content.cloneNode(true);

    const dimensionsEl = infoElement.querySelector('.image-dimensions');
    const sizeEl = infoElement.querySelector('.image-size');
    const formatEl = infoElement.querySelector('.image-format');

    dimensionsEl.textContent = `${img.width} × ${img.height} pixels`;
    sizeEl.textContent = formatBytes(file.size);
    formatEl.textContent = file.type.split('/')[1].toUpperCase();

    infoContainer.appendChild(infoElement);

    $('uploadArea').style.display = 'none';
    $('originalImageSection').style.display = 'block';

    if (this.autoProcess && this.sizeManager.sizes.length > 0) {
      this.processImages();
    } else {
      this.updateStatus();
    }
  }

  async processImages() {
    if (!this.originalImage || this.sizeManager.sizes.length === 0) return;

    $('processBtn').disabled = true;

    const processBtn = $('processBtn');
    while (processBtn.firstChild) {
      processBtn.removeChild(processBtn.firstChild);
    }

    const template = $('processButtonStateTemplate');
    const buttonContent = template.content.cloneNode(true);
    const iconEl = buttonContent.querySelector('.process-icon');
    const textEl = buttonContent.querySelector('.process-text');

    iconEl.textContent = '⏳';
    textEl.textContent = ' Processing...';

    processBtn.appendChild(buttonContent);

    try {
      await this.processor.processImages(this.originalImage, this.originalFile, this.sizeManager.sizes);
    } finally {
      $('processBtn').disabled = false;

      const processBtn = $('processBtn');
      while (processBtn.firstChild) {
        processBtn.removeChild(processBtn.firstChild);
      }

      const template = $('processButtonStateTemplate');
      const buttonContent = template.content.cloneNode(true);
      const iconEl = buttonContent.querySelector('.process-icon');
      const textEl = buttonContent.querySelector('.process-text');

      iconEl.textContent = '🔄';
      textEl.textContent = ' Process Images';

      processBtn.appendChild(buttonContent);

      this.updateStatus();
    }
  }

  showProcessedImages(results) {
    this.gallery.show(results);
  }

  updateStatus() {
    // Guard against calling before initialization is complete
    if (!this.sizeManager || !this.processor) {
      return;
    }

    const hasImage = !!this.originalImage;
    const hasSizes = this.sizeManager.sizes.length > 0;
    const hasProcessed = this.processor.processedImages.length > 0;
    const processedCount = this.processor.processedImages.length;

    $('processBtn').disabled = !hasImage || !hasSizes;
    $('downloadBtn').disabled = !hasProcessed;

    let message;
    if (!hasImage) {
      message = 'Select an image to get started';
    } else if (!hasSizes) {
      message = 'Add size configurations to process';
    } else if (!hasProcessed) {
      message = `Ready to process ${this.sizeManager.sizes.length} sizes`;
    } else {
      message = `${processedCount} images processed`;
    }

    $('actionInfo').textContent = message;
  }

  showMessage(text, type = 'success') {
    const existingMessage = $$('.app-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    const template = $('messageTemplate');
    const message = template.content.cloneNode(true).firstElementChild;
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
