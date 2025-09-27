class Preset {
  constructor(settings) {
    const source = settings || {};
    const defaults = DEFAULT_PRESET_SETTINGS;
    this.id = source.id || generateId();
    this.name = source.name || defaults.name;
    this.width = this.parseDimension(source.width, defaults.width);
    this.height = this.parseDimension(source.height, defaults.height);
    this.cropMode = source.cropMode || defaults.cropMode;
    this.horizontalOffset = this.parsePercent(source.horizontalOffset, defaults.horizontalOffset);
    this.verticalOffset = this.parsePercent(source.verticalOffset, defaults.verticalOffset);
    this.quality = this.parseQuality(source.quality, defaults.quality);
    this.format = source.format || defaults.format;
    this.jpegQuality = this.parsePercent(source.jpegQuality, defaults.jpegQuality, 1, 100);
    this.webpQuality = this.parsePercent(source.webpQuality, defaults.webpQuality, 1, 100);
    this.gifColors = this.parseNumber(source.gifColors, defaults.gifColors);
    this.pngCompressionLevel = this.parseNumber(source.pngCompressionLevel, defaults.pngCompressionLevel);
    this.shape = source.shape || defaults.shape;
    this.cornerRadius = this.parseNumber(source.cornerRadius, defaults.cornerRadius);
    this.backgroundColor = source.backgroundColor || defaults.backgroundColor;
    this.transparentBackground = source.transparentBackground ?? defaults.transparentBackground;
    this.maintainAspectRatio = source.maintainAspectRatio ?? defaults.maintainAspectRatio;
    this.filenamePattern = source.filenamePattern || defaults.filenamePattern;
  }

  parseNumber(value, fallback) {
    const num = parseInt(value, 10);
    if (Number.isNaN(num)) return fallback;
    return num;
  }

  parseDimension(value, fallback) {
    if (value === 0 || value === NaN) return 0;
    return this.parseNumber(value, fallback);
  }

  parsePercent(value, fallback, min, max) {
    const n = this.parseNumber(value, fallback);
    const lo = min ?? 0;
    const hi = max ?? 100;
    return clamp(n, lo, hi);
  }

  parseQuality(value, fallback) {
    return clamp(this.parseNumber(value, fallback), 0, 3);
  }

  getCenteringPreset() {
    const key = `${this.horizontalOffset},${this.verticalOffset}`;
    return CENTERING_MAP[key] || 'Custom';
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
    if (this.transparentBackground && this.supportsTransparency()) return 'Transparent';
    return this.backgroundColor.replace(/^#/, '').toUpperCase();
  }

  getCropModeText() {
    return CROP_MODES[this.cropMode];
  }

  getShapeText() {
    return SHAPE_NAMES[this.shape];
  }

  getMaintainAspectRatioText() {
    return this.maintainAspectRatio ? 'Maintain' : 'Ignore';
  }

  supportsTransparency() {
    return ['png', 'webp', 'gif', 'ico'].includes(this.format);
  }

  clone() {
    return new Preset({
      id: this.id,
      name: this.name,
      width: this.width,
      height: this.height,
      cropMode: this.cropMode,
      horizontalOffset: this.horizontalOffset,
      verticalOffset: this.verticalOffset,
      quality: this.quality,
      format: this.format,
      jpegQuality: this.jpegQuality,
      webpQuality: this.webpQuality,
      gifColors: this.gifColors,
      pngCompressionLevel: this.pngCompressionLevel,
      shape: this.shape,
      cornerRadius: this.cornerRadius,
      backgroundColor: this.backgroundColor,
      transparentBackground: this.transparentBackground,
      maintainAspectRatio: this.maintainAspectRatio,
      filenamePattern: this.filenamePattern,
    });
  }
}

class PresetManager {
  constructor(app) {
    this.app = app;
    this.presets = [];
    this.isCompactView = false;
    this.container = $('presets-list');
    this.template = $('preset-item-tpl');
    this.tagTemplate = $('preset-tag-tpl');
    this.editor = null;
    this.init();
  }

  setEditor(editor) {
    this.editor = editor;
  }

  init() {
    $('add-preset-btn').addEventListener('click', () => this.add());
    $('compact-view-toggle').addEventListener('click', () => this.toggleCompactView());
    $('export-config-btn').addEventListener('click', () => this.exportConfig());
    $('import-config-btn').addEventListener('click', () => $('config-file-input').click());
    $('config-file-input').addEventListener('change', (e) => this.importConfig(e.target.files));
    this.container.addEventListener('dblclick', (e) => {
      const item = e.target.closest('.preset-item');
      if (!item) return;
      const id = item.dataset.id;
      if (id) this.edit(id);
    });
    this.load();
  }

  load() {
    const saved = localStorage.getItem(STORAGE_KEYS.presets);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (Array.isArray(data)) this.presets = data.map((item) => new Preset(item));
      } catch (e) {
        this.presets = [];
      }
    }

    if (this.presets.length === 0) {
      const legacy = localStorage.getItem(STORAGE_KEYS.legacySizes);
      if (legacy) {
        try {
          const data = JSON.parse(legacy);
          if (Array.isArray(data)) this.presets = data.map((item) => new Preset(item));
          localStorage.setItem(STORAGE_KEYS.presets, JSON.stringify(this.presets));
          localStorage.removeItem(STORAGE_KEYS.legacySizes);
        } catch (e) {
          this.presets = [];
        }
      }
    }

    if (this.presets.length === 0) this.loadDefault();

    const compact = localStorage.getItem(STORAGE_KEYS.compactView);
    this.isCompactView = compact === 'true';
    this.applyCompactView();
    this.render();
  }

  loadDefault() {
    this.presets = DEFAULT_PRESETS.map((item) => new Preset(item));
  }

  save() {
    localStorage.setItem(STORAGE_KEYS.presets, JSON.stringify(this.presets));
    localStorage.setItem(STORAGE_KEYS.compactView, this.isCompactView ? 'true' : 'false');
  }

  add(settings) {
    const preset = new Preset(settings);
    this.presets.push(preset);
    this.save();
    this.render();
    if (this.editor) this.editor.open(preset);
  }

  edit(id) {
    const preset = this.presets.find((item) => item.id === id);
    if (preset && this.editor) this.editor.open(preset);
  }

  duplicate(id) {
    const preset = this.presets.find((item) => item.id === id);
    if (!preset) return;
    const clone = preset.clone();
    clone.id = generateId();
    clone.name = `${preset.name} (Copy)`;
    this.presets.push(clone);
    this.save();
    this.render();
    this.app.onPresetsUpdated();
  }

  remove(id) {
    if (!this.canRemove()) {
      this.app.showMessage('At least one preset must remain', 'error');
      return;
    }
    this.presets = this.presets.filter((item) => item.id !== id);
    this.save();
    this.render();
    this.app.onPresetsUpdated();
  }

  update(preset) {
    const index = this.presets.findIndex((item) => item.id === preset.id);
    if (index === -1) return;
    this.presets[index] = new Preset(preset);
    this.save();
    this.render();
    this.app.onPresetsUpdated();
  }

  toggleCompactView() {
    this.isCompactView = !this.isCompactView;
    this.applyCompactView();
    this.save();
    this.render();
  }

  applyCompactView() {
    if (this.isCompactView) {
      this.container.classList.add('compact');
      $('compact-view-toggle').classList.add('active');
    } else {
      this.container.classList.remove('compact');
      $('compact-view-toggle').classList.remove('active');
    }
  }

  exportConfig() {
    const config = {
      version: '1.0',
      timestamp: Date.now(),
      presets: this.presets,
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = formatPackagingName('json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.app.showMessage('Configuration exported');
  }

  importConfig(files) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      let data;
      try {
        data = JSON.parse(e.target.result);
      } catch (err) {
        this.app.showMessage('Invalid configuration file', 'error');
        return;
      }
      const list = Array.isArray(data?.presets) ? data.presets : Array.isArray(data?.sizes) ? data.sizes : null;
      if (!list) {
        this.app.showMessage('Invalid configuration file', 'error');
        return;
      }
      if (!confirm('Replace all presets with imported configuration?')) return;
      this.presets = list.map((item) => new Preset(item));
      if (this.presets.length === 0) this.loadDefault();
      this.save();
      this.render();
      this.app.onPresetsUpdated();
      this.app.showMessage('Configuration imported');
    };
    reader.readAsText(file);
  }

  createItem(preset) {
    const fragment = this.template.content.cloneNode(true);
    const item = fragment.firstElementChild;
    const nameEl = item.querySelector('.preset-name');
    const dimsEl = item.querySelector('.preset-dimensions');
    const tagsEl = item.querySelector('.preset-tags');
    item.dataset.id = preset.id;
    item.draggable = true;
    nameEl.textContent = preset.name;
    dimsEl.textContent = `${preset.width}x${preset.height}`;
    if (this.isCompactView) {
      tagsEl.style.display = 'none';
    } else {
      tagsEl.style.display = '';
      while (tagsEl.firstChild) tagsEl.removeChild(tagsEl.firstChild);
      const tags = this.createTags(preset);
      for (let i = 0; i < tags.length; i++) tagsEl.appendChild(tags[i]);
    }
    this.attachItemEvents(item, preset);
    return item;
  }

  createTags(preset) {
    const tags = [];
    const addTag = (text, style) => {
      const fragment = this.tagTemplate.content.cloneNode(true);
      const tag = fragment.firstElementChild;
      tag.textContent = text;
      if (style) tag.style.cssText = style;
      tags.push(tag);
    };
    addTag(preset.getMaintainAspectRatioText());
    addTag(preset.getCropModeText());
    addTag(preset.getCenteringPreset());
    addTag(preset.getResizeQualityText());
    addTag(preset.getFormatNameText());
    const formatQuality = preset.getFormatQualityText();
    if (formatQuality) addTag(formatQuality);
    addTag(preset.getShapeText());
    if (preset.transparentBackground && preset.supportsTransparency()) {
      addTag('Transparent');
    } else {
      const color = preset.backgroundColor;
      const textColor = getContrastColor(color);
      addTag(color.toUpperCase(), `background-color: ${color}; color: ${textColor};`);
    }
    return tags;
  }

  attachItemEvents(item, preset) {
    item.querySelector('.edit-btn').addEventListener('click', () => this.edit(preset.id));
    item.querySelector('.duplicate-btn').addEventListener('click', () => {
      if (confirm(`Duplicate "${preset.name}" preset?`)) this.duplicate(preset.id);
    });
    item.querySelector('.delete-btn').addEventListener('click', () => {
      if (!this.canRemove()) {
        this.app.showMessage('At least one preset must remain', 'error');
        return;
      }
      if (confirm(`Delete "${preset.name}" preset?`)) this.remove(preset.id);
    });
    item.addEventListener('dblclick', () => this.edit(preset.id));
    this.attachDragEvents(item, preset);
  }

  attachDragEvents(item, preset) {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', preset.id);
      item.classList.add('dragging');
      this.container.classList.add('drag-active');
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      this.container.classList.remove('drag-active');
      const nodes = $$$('.preset-item');
      for (let i = 0; i < nodes.length; i++) nodes[i].classList.remove('drag-over');
    });
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      item.classList.add('drag-over');
    });
    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      const draggedId = e.dataTransfer.getData('text/plain');
      if (draggedId && draggedId !== preset.id) this.reorder(draggedId, preset.id);
    });
  }

  reorder(draggedId, targetId) {
    const from = this.presets.findIndex((item) => item.id === draggedId);
    const to = this.presets.findIndex((item) => item.id === targetId);
    if (from === -1 || to === -1) return;
    const [preset] = this.presets.splice(from, 1);
    this.presets.splice(to, 0, preset);
    this.save();
    this.render();
  }

  render() {
    while (this.container.firstChild) this.container.removeChild(this.container.firstChild);
    for (let i = 0; i < this.presets.length; i++) {
      const item = this.createItem(this.presets[i]);
      this.container.appendChild(item);
    }
    this.app.updateStatus();
  }

  getAll() {
    return [...this.presets];
  }

  getById(id) {
    return this.presets.find((item) => item.id === id) || null;
  }

  hasPresets() {
    return this.presets.length > 0;
  }

  canRemove() {
    return this.presets.length > 1;
  }
}

window.Preset = Preset;
window.PresetManager = PresetManager;
