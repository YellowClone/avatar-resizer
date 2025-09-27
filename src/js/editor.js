class Editor {
  constructor(app, manager) {
    this.app = app;
    this.manager = manager;
    this.currentPreset = null;
    this.modal = $('edit-size-modal');
    this.titleEl = $('modal-title');
    this.init();
  }

  init() {
    $('modal-close-btn').addEventListener('click', () => this.close());
    $('modal-cancel-btn').addEventListener('click', () => this.close());
    $('modal-save-btn').addEventListener('click', () => this.save());
    $('format-select').addEventListener('change', () => this.updateFormatSettings());
    $('shape-select').addEventListener('change', () => this.updateShapeSettings());
    $('crop-mode-select').addEventListener('change', () => this.updateCenteringVisibility());
    $('centering-preset-select').addEventListener('change', () => this.updateCenteringSettings());
    this.setupSliders();
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
    this.manager.setEditor(this);
  }

  setupSliders() {
    const pairs = [
      { input: 'jpeg-quality-input', value: 'jpeg-quality-value', suffix: '%' },
      { input: 'webp-quality-input', value: 'webp-quality-value', suffix: '%' },
      { input: 'horizontal-offset-input', value: 'horizontal-offset-value', suffix: '%' },
      { input: 'vertical-offset-input', value: 'vertical-offset-value', suffix: '%' },
    ];
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      const slider = $(pair.input);
      const readout = $(pair.value);
      slider.addEventListener('input', () => {
        readout.textContent = slider.value + pair.suffix;
      });
    }
  }

  open(preset) {
    this.currentPreset = preset ? preset.clone() : null;
    this.populateForm(this.currentPreset);
    this.titleEl.textContent = preset ? 'Edit Size' : 'Add Size';
    this.modal.style.display = 'flex';
  }

  close() {
    this.modal.style.display = 'none';
    this.currentPreset = null;
  }

  populateForm(preset) {
    const source = preset ? preset.clone() : new Preset();
    $('preset-name-input').value = source.name;
    $('width-input').value = source.width;
    $('height-input').value = source.height;
    $('crop-mode-select').value = source.cropMode;
    $('quality-select').value = source.quality;
    $('format-select').value = source.format;
    $('jpeg-quality-input').value = source.jpegQuality;
    $('webp-quality-input').value = source.webpQuality;
    $('shape-select').value = source.shape;
    $('corner-radius-input').value = source.cornerRadius;
    $('background-color-input').value = source.backgroundColor;
    $('transparent-background-toggle').checked = !!source.transparentBackground;
    $('maintain-aspect-ratio-toggle').checked = !!source.maintainAspectRatio;
    $('filename-pattern-input').value = source.filenamePattern;
    $('horizontal-offset-input').value = source.horizontalOffset;
    $('vertical-offset-input').value = source.verticalOffset;
    const presetKey = source.getCenteringPreset().toLowerCase();
    $('centering-preset-select').value = presetKey;
    this.updateFormatSettings();
    this.updateShapeSettings();
    this.updateCenteringVisibility();
    this.updateCenteringSettings();
    this.updateSliderValues();
  }

  updateSliderValues() {
    ['jpeg-quality', 'webp-quality', 'horizontal-offset', 'vertical-offset'].forEach((id) => {
      const input = $(`${id}-input`);
      const value = $(`${id}-value`);
      value.textContent = `${input.value}%`;
    });
  }

  updateFormatSettings() {
    const settings = $$$('.format-setting');
    for (let i = 0; i < settings.length; i++) settings[i].style.display = 'none';
    const format = $('format-select').value;
    const transparency = $$('.transparency-setting');
    if (['png', 'webp', 'ico'].includes(format)) transparency.style.display = 'block';
    else transparency.style.display = 'none';
    const formatSetting = $$(`.${format}-setting`);
    if (formatSetting) formatSetting.style.display = 'block';
  }

  updateShapeSettings() {
    const shape = $('shape-select').value;
    $('corner-radius-group').style.display = shape === 'rounded' ? 'block' : 'none';
  }

  updateCenteringSettings() {
    const presetValue = $('centering-preset-select').value;
    if (presetValue === 'custom') {
      $('custom-centering-row').style.display = 'flex';
    } else {
      $('custom-centering-row').style.display = 'none';
      const presetOffsets = CENTERING_PRESETS[presetValue];
      if (presetOffsets) {
        $('horizontal-offset-input').value = presetOffsets.h;
        $('vertical-offset-input').value = presetOffsets.v;
        $('horizontal-offset-value').textContent = `${presetOffsets.h}%`;
        $('vertical-offset-value').textContent = `${presetOffsets.v}%`;
      }
    }
  }

  updateCenteringVisibility() {
    const group = $('centering-preset-select').closest('.form-group');
    if (!group) return;
    if ($('crop-mode-select').value === 'fill') {
      group.style.display = 'block';
    } else {
      group.style.display = 'none';
      $('custom-centering-row').style.display = 'none';
    }
  }

  buildSettings() {
    let width = parseInt($('width-input').value, 10);
    let height = parseInt($('height-input').value, 10);
    if (Number.isNaN(width)) width = DEFAULT_PRESET_SETTINGS.width;
    if (Number.isNaN(height)) height = DEFAULT_PRESET_SETTINGS.height;
    if (!width && !height) width = DEFAULT_PRESET_SETTINGS.width;
    const pattern = $('filename-pattern-input').value || DEFAULT_PRESET_SETTINGS.filenamePattern;
    const settings = {
      id: this.currentPreset?.id || generateId(),
      name: $('preset-name-input').value || DEFAULT_PRESET_SETTINGS.name,
      width,
      height,
      cropMode: $('crop-mode-select').value,
      horizontalOffset: parseInt($('horizontal-offset-input').value, 10),
      verticalOffset: parseInt($('vertical-offset-input').value, 10),
      quality: parseInt($('quality-select').value, 10),
      format: $('format-select').value,
      jpegQuality: parseInt($('jpeg-quality-input').value, 10),
      webpQuality: parseInt($('webp-quality-input').value, 10),
      shape: $('shape-select').value,
      cornerRadius: parseInt($('corner-radius-input').value, 10),
      backgroundColor: $('background-color-input').value,
      transparentBackground: $('transparent-background-toggle').checked,
      maintainAspectRatio: $('maintain-aspect-ratio-toggle').checked,
      filenamePattern: pattern,
    };
    return new Preset(settings);
  }

  save() {
    const preset = this.buildSettings();
    if (this.currentPreset) {
      this.manager.update(preset);
    } else {
      this.manager.add(preset);
    }
    this.close();
  }
}

window.Editor = Editor;
