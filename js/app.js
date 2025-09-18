// Avatar Resizer Application
class AvatarResizer {
  constructor() {
    this.originalImage = null;
    this.originalFile = null;
    this.processedImages = [];
    this.lightbox = null;
    this.currentEditIndex = -1;
    this.autoProcess = this.loadAutoProcessSetting();
    this.compactView = this.loadCompactViewSetting();
    this.draggedIndex = undefined;

    // Default size configurations
    this.defaultSizes = [
      {
        name: 'Medium',
        width: 600,
        height: 600,
        cropMode: 'fit',
        quality: 3,
        format: 'png',
        shape: 'rectangle',
        backgroundColor: '#ffffff',
        filenamePattern: '{original_name}_{width}x{height}.{format_ext}',
        jpegQuality: 85,
        webpQuality: 80,
        pngCompression: 6,
        gifColors: 256,
        transparentBackground: false,
      },
      {
        name: 'Small',
        width: 200,
        height: 200,
        cropMode: 'fit',
        quality: 3,
        format: 'png',
        shape: 'rectangle',
        backgroundColor: '#ffffff',
        filenamePattern: '{original_name}_{width}x{height}.{format_ext}',
        jpegQuality: 85,
        webpQuality: 80,
        pngCompression: 6,
        gifColors: 256,
        transparentBackground: false,
      },
    ];

    this.sizes = this.loadSizesFromStorage();
    this.pica = pica();

    this.initializeEventListeners();
    this.initializeUI();
    this.renderSizes();
    this.initializePhotoSwipe();
  }

  // Initialize all event listeners
  initializeEventListeners() {
    // File upload
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const browseBtn = document.getElementById('browseBtn');
    const changeImageBtn = document.getElementById('changeImageBtn');

    browseBtn.addEventListener('click', () => fileInput.click());
    changeImageBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

    // Make entire upload area clickable when no image is loaded
    uploadArea.addEventListener('click', (e) => {
      // Only trigger file dialog if no image is loaded and not clicking on the browse button
      if (
        !this.originalImage &&
        e.target !== browseBtn &&
        !browseBtn.contains(e.target)
      ) {
        fileInput.click();
      }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
    uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

    // Size management
    document
      .getElementById('addSizeBtn')
      .addEventListener('click', () => this.openSizeModal());
    document
      .getElementById('compactViewToggle')
      .addEventListener('click', () => this.toggleCompactView());

    // Config import/export
    document
      .getElementById('exportConfigBtn')
      .addEventListener('click', () => this.exportConfig());
    document
      .getElementById('importConfigBtn')
      .addEventListener('click', () =>
        document.getElementById('configFileInput').click()
      );
    document
      .getElementById('configFileInput')
      .addEventListener('change', (e) => this.importConfig(e));

    // Processing and download
    document
      .getElementById('processBtn')
      .addEventListener('click', () => this.processImages());
    document
      .getElementById('downloadBtn')
      .addEventListener('click', () => this.downloadAll());

    // Auto-process toggle
    document
      .getElementById('autoProcessToggle')
      .addEventListener('change', (e) =>
        this.toggleAutoProcess(e.target.checked)
      );

    // Modal controls
    document
      .getElementById('modalCloseBtn')
      .addEventListener('click', () => this.closeSizeModal());
    document
      .getElementById('modalCancelBtn')
      .addEventListener('click', () => this.closeSizeModal());
    document
      .getElementById('modalSaveBtn')
      .addEventListener('click', () => this.saveSizeConfig());
    document.getElementById('editSizeModal').addEventListener('click', (e) => {
      if (e.target.id === 'editSizeModal') this.closeSizeModal();
    });

    // Format-specific settings
    document
      .getElementById('formatSelect')
      .addEventListener('change', (e) =>
        this.toggleFormatSettings(e.target.value)
      );
    document
      .getElementById('jpegQualityInput')
      .addEventListener('input', (e) =>
        this.updateQualityDisplay('jpeg', e.target.value)
      );
    document
      .getElementById('webpQualityInput')
      .addEventListener('input', (e) =>
        this.updateQualityDisplay('webp', e.target.value)
      );
    document
      .getElementById('pngCompressionInput')
      .addEventListener('input', (e) =>
        this.updateQualityDisplay('png', e.target.value)
      );
    document
      .getElementById('gifColorsInput')
      .addEventListener('input', (e) =>
        this.updateQualityDisplay('gif', e.target.value)
      );

    // Shape-specific settings
    document
      .getElementById('shapeSelect')
      .addEventListener('change', (e) =>
        this.toggleShapeSettings(e.target.value)
      );

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeSizeModal();
    });
  }

  initializeUI() {
    // Set initial state of auto-process toggle
    const autoProcessToggle = document.getElementById('autoProcessToggle');
    autoProcessToggle.checked = this.autoProcess;

    // Set initial state of compact view
    this.updateCompactViewUI();
  }

  // File handling methods
  handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && this.isValidImageFile(file)) {
      this.loadImage(file);
    }
  }

  handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
  }

  handleDragLeave(event) {
    event.currentTarget.classList.remove('dragover');
  }

  handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');

    const files = event.dataTransfer.files;
    if (files.length > 0 && this.isValidImageFile(files[0])) {
      this.loadImage(files[0]);
    }
  }

  isValidImageFile(file) {
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
    ];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG, GIF, WEBP, BMP)');
      return false;
    }
    if (file.size > 50 * 1024 * 1024) {
      // 50MB limit
      alert('File size must be less than 50MB');
      return false;
    }
    return true;
  }

  async loadImage(file) {
    try {
      this.originalFile = file;

      // Create image element
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      // Store original image
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      this.originalImage = canvas;

      // Update UI
      this.showOriginalImage(img, file);
      this.updateActionButtons();
      this.hideSuccessMessage();
      this.hideProcessedImages();

      // Auto-process if enabled
      if (this.autoProcess) {
        // Add a small delay to ensure UI is updated
        setTimeout(() => {
          this.processImages();
        }, 100);
      }

      URL.revokeObjectURL(img.src);
    } catch (error) {
      console.error('Error loading image:', error);
      alert('Failed to load image. Please try a different file.');
    }
  }

  showOriginalImage(img, file) {
    const uploadArea = document.getElementById('uploadArea');
    const originalSection = document.getElementById('originalImageSection');
    const originalImg = document.getElementById('originalImage');
    const imageInfo = document.getElementById('originalImageInfo');

    uploadArea.style.display = 'none';
    originalSection.style.display = 'block';

    originalImg.src = img.src;
    imageInfo.textContent = `${img.naturalWidth} × ${
      img.naturalHeight
    }px • ${this.formatFileSize(file.size)}`;
  }

  updateActionButtons() {
    const processBtn = document.getElementById('processBtn');
    const actionInfo = document.getElementById('actionInfo');

    processBtn.disabled = !this.originalImage;
    actionInfo.textContent = this.originalImage
      ? `Ready to process ${this.sizes.length} sizes.`
      : 'Upload an image to get started.';
  }

  hideSuccessMessage() {
    document.getElementById('successMessage').style.display = 'none';
  }

  hideProcessedImages() {
    document.getElementById('processedImagesSection').style.display = 'none';
    this.processedImages = [];
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Size management methods
  loadSizesFromStorage() {
    try {
      const stored = localStorage.getItem('avatarResizerSizes');
      const loadedSizes = stored ? JSON.parse(stored) : [...this.defaultSizes];

      // Add default values for properties that might be missing from older configs
      return loadedSizes.map((size) => ({
        ...size,
        filenamePattern:
          size.filenamePattern ||
          '{original_name}_{width}x{height}.{format_ext}',
        jpegQuality: size.jpegQuality || 85,
        webpQuality: size.webpQuality || 80,
        pngCompression: size.pngCompression || 6,
        transparentBackground: size.transparentBackground || false,
      }));
    } catch (error) {
      console.error('Error loading sizes from storage:', error);
      return [...this.defaultSizes];
    }
  }

  saveSizesToStorage() {
    try {
      localStorage.setItem('avatarResizerSizes', JSON.stringify(this.sizes));
    } catch (error) {
      console.error('Error saving sizes to storage:', error);
    }
  }

  loadAutoProcessSetting() {
    try {
      const saved = localStorage.getItem('avatarResizerAutoProcess');
      return saved ? JSON.parse(saved) : false;
    } catch (error) {
      console.error('Error loading auto-process setting:', error);
      return false;
    }
  }

  saveAutoProcessSetting() {
    try {
      localStorage.setItem(
        'avatarResizerAutoProcess',
        JSON.stringify(this.autoProcess)
      );
    } catch (error) {
      console.error('Error saving auto-process setting:', error);
    }
  }

  toggleAutoProcess(enabled) {
    this.autoProcess = enabled;
    this.saveAutoProcessSetting();
  }

  loadCompactViewSetting() {
    try {
      const saved = localStorage.getItem('avatarResizerCompactView');
      return saved ? JSON.parse(saved) : false;
    } catch (error) {
      console.error('Error loading compact view setting:', error);
      return false;
    }
  }

  saveCompactViewSetting() {
    try {
      localStorage.setItem(
        'avatarResizerCompactView',
        JSON.stringify(this.compactView)
      );
    } catch (error) {
      console.error('Error saving compact view setting:', error);
    }
  }

  toggleCompactView() {
    this.compactView = !this.compactView;
    this.saveCompactViewSetting();
    this.updateCompactViewUI();
  }

  updateCompactViewUI() {
    const sizesList = document.getElementById('sizesList');
    const toggleBtn = document.getElementById('compactViewToggle');

    if (this.compactView) {
      sizesList.classList.add('compact');
      toggleBtn.textContent = '�';
      toggleBtn.title = 'Exit compact view';
    } else {
      sizesList.classList.remove('compact');
      toggleBtn.textContent = '📋';
      toggleBtn.title = 'Toggle compact view';
    }
  }

  renderSizes() {
    const sizesList = document.getElementById('sizesList');
    sizesList.innerHTML = '';

    this.sizes.forEach((size, index) => {
      const sizeItem = this.createSizeItem(size, index);
      sizesList.appendChild(sizeItem);
    });

    this.updateActionButtons();
  }

  createSizeItem(size, index) {
    const item = document.createElement('div');
    item.className = 'size-item';
    item.draggable = true;
    item.dataset.index = index;

    // Get format-specific quality info
    const formatQuality = this.getFormatQualityText(size);

    // Get transparency info
    const transparencyInfo = this.getTransparencyText(size);

    item.innerHTML = `
            <div class="size-header">
                <div class="size-info">
                    <span class="size-name">${size.name}</span>
                    <span class="size-dimensions">${size.width} × ${
      size.height
    }px</span>
                </div>
                <div class="size-actions">
                    <button type="button" class="size-action-btn edit-btn" title="Edit">✏️</button>
                    <button type="button" class="size-action-btn duplicate-btn" title="Duplicate">📋</button>
                    <button type="button" class="size-action-btn delete-btn" title="Delete">🗑️</button>
                </div>
            </div>
            <div class="size-tags">
                <span class="size-tag">${size.format.toUpperCase()}</span>
                <span class="size-tag">${size.cropMode}</span>
                <span class="size-tag">${size.shape}</span>
                <span class="size-tag">${this.getQualityText(
                  size.quality
                )}</span>
                ${
                  formatQuality
                    ? `<span class="size-tag">${formatQuality}</span>`
                    : ''
                }
                ${
                  transparencyInfo
                    ? `<span class="size-tag">${transparencyInfo}</span>`
                    : ''
                }
            </div>
        `;

    // Add event listeners
    item
      .querySelector('.edit-btn')
      .addEventListener('click', () => this.editSize(index));
    item
      .querySelector('.duplicate-btn')
      .addEventListener('click', () => this.duplicateSize(index));
    item
      .querySelector('.delete-btn')
      .addEventListener('click', () => this.deleteSize(index));

    // Add drag event listeners
    item.addEventListener('dragstart', (e) => this.handleDragStart(e));
    item.addEventListener('dragover', (e) => this.handleDragOver(e));
    item.addEventListener('drop', (e) => this.handleDrop(e));
    item.addEventListener('dragend', (e) => this.handleDragEnd(e));

    return item;
  }

  getFormatQualityText(size) {
    switch (size.format) {
      case 'jpeg':
        return `${size.jpegQuality || 85}%`;
      case 'webp':
        return `${size.webpQuality || 80}%`;
      case 'png':
        const compression = size.pngCompression || 6;
        return `Comp ${compression}`;
      case 'gif':
        const colors = size.gifColors || 256;
        return `${colors} colors`;
      case 'ico':
        return 'Icon';
      default:
        return '';
    }
  }

  getTransparencyText(size) {
    if (
      (size.shape === 'circle' || size.shape === 'rounded') &&
      size.transparentBackground
    ) {
      return 'Transparent';
    }
    return '';
  }

  getQualityText(quality) {
    const qualityMap = {
      0: 'Fastest',
      1: 'Low Quality',
      2: 'Medium Quality',
      3: 'High Quality',
    };
    return qualityMap[quality] || 'High Quality';
  }

  openSizeModal(editIndex = -1) {
    this.currentEditIndex = editIndex;
    const modal = document.getElementById('editSizeModal');
    const title = document.getElementById('modalTitle');

    title.textContent = editIndex >= 0 ? 'Edit Size' : 'Add Size';

    if (editIndex >= 0) {
      this.populateModalFields(this.sizes[editIndex]);
    } else {
      this.resetModalFields();
    }

    modal.style.display = 'flex';
    document.getElementById('sizeNameInput').focus();
  }

  populateModalFields(size) {
    document.getElementById('sizeNameInput').value = size.name;
    document.getElementById('widthInput').value = size.width;
    document.getElementById('heightInput').value = size.height;
    document.getElementById('cropModeSelect').value = size.cropMode;
    document.getElementById('qualitySelect').value = size.quality;
    document.getElementById('formatSelect').value = size.format;
    document.getElementById('shapeSelect').value = size.shape;
    document.getElementById('backgroundColorInput').value =
      size.backgroundColor;
    document.getElementById('filenamePatternInput').value =
      size.filenamePattern || '{original_name}_{width}x{height}.{format_ext}';

    // Format-specific settings
    document.getElementById('jpegQualityInput').value = size.jpegQuality || 85;
    document.getElementById('webpQualityInput').value = size.webpQuality || 80;
    document.getElementById('pngCompressionInput').value =
      size.pngCompression || 6;
    document.getElementById('gifColorsInput').value = size.gifColors || 256;

    // Shape-specific settings
    document.getElementById('transparentBackgroundToggle').checked =
      size.transparentBackground || false;

    // Update display values
    this.updateQualityDisplay('jpeg', size.jpegQuality || 85);
    this.updateQualityDisplay('webp', size.webpQuality || 80);
    this.updateQualityDisplay('png', size.pngCompression || 6);
    this.updateQualityDisplay('gif', size.gifColors || 256);

    // Show/hide format-specific settings
    this.toggleFormatSettings(size.format);

    // Show/hide shape-specific settings
    this.toggleShapeSettings(size.shape);
  }

  resetModalFields() {
    document.getElementById('sizeNameInput').value = '';
    document.getElementById('widthInput').value = '600';
    document.getElementById('heightInput').value = '600';
    document.getElementById('cropModeSelect').value = 'fit';
    document.getElementById('qualitySelect').value = '3';
    document.getElementById('formatSelect').value = 'png';
    document.getElementById('shapeSelect').value = 'rectangle';
    document.getElementById('backgroundColorInput').value = '#ffffff';
    document.getElementById('filenamePatternInput').value =
      '{original_name}_{width}x{height}.{format_ext}';

    // Reset format-specific settings
    document.getElementById('jpegQualityInput').value = 85;
    document.getElementById('webpQualityInput').value = 80;
    document.getElementById('pngCompressionInput').value = 6;
    document.getElementById('gifColorsInput').value = 256;

    // Reset shape-specific settings
    document.getElementById('transparentBackgroundToggle').checked = false;

    // Update display values
    this.updateQualityDisplay('jpeg', 85);
    this.updateQualityDisplay('webp', 80);
    this.updateQualityDisplay('png', 6);
    this.updateQualityDisplay('gif', 256);

    // Show PNG settings by default
    this.toggleFormatSettings('png');

    // Show rectangle settings by default
    this.toggleShapeSettings('rectangle');
  }

  closeSizeModal() {
    document.getElementById('editSizeModal').style.display = 'none';
    this.currentEditIndex = -1;
  }

  toggleFormatSettings(format) {
    // Hide all format-specific settings
    const jpegSettings = document.querySelector('.jpeg-setting');
    const webpSettings = document.querySelector('.webp-setting');
    const pngSettings = document.querySelector('.png-setting');
    const gifSettings = document.querySelector('.gif-setting');
    const icoSettings = document.querySelector('.ico-setting');

    jpegSettings.style.display = 'none';
    webpSettings.style.display = 'none';
    pngSettings.style.display = 'none';
    gifSettings.style.display = 'none';
    icoSettings.style.display = 'none';

    // Show the relevant setting based on format
    switch (format) {
      case 'jpeg':
        jpegSettings.style.display = 'block';
        break;
      case 'webp':
        webpSettings.style.display = 'block';
        break;
      case 'png':
        pngSettings.style.display = 'block';
        break;
      case 'gif':
        gifSettings.style.display = 'block';
        break;
      case 'ico':
        icoSettings.style.display = 'block';
        break;
    }
  }

  updateQualityDisplay(format, value) {
    const displayElement = document.getElementById(`${format}QualityValue`);
    if (displayElement) {
      if (format === 'png') {
        displayElement.textContent = value; // PNG compression is 0-9
      } else if (format === 'gif') {
        displayElement.textContent = value; // GIF colors is 2-256
      } else {
        displayElement.textContent = value + '%'; // JPEG/WebP quality is percentage
      }
    }
  }

  toggleShapeSettings(shape) {
    const transparencySettings = document.querySelector(
      '.shape-transparency-setting'
    );

    // Show transparency option only for circle and rounded shapes
    if (shape === 'circle' || shape === 'rounded') {
      transparencySettings.style.display = 'block';
    } else {
      transparencySettings.style.display = 'none';
    }
  }

  saveSizeConfig() {
    const name = document.getElementById('sizeNameInput').value.trim();
    const width = parseInt(document.getElementById('widthInput').value);
    const height = parseInt(document.getElementById('heightInput').value);

    if (!name) {
      alert('Please enter a name for this size');
      return;
    }

    if (!width || width < 1 || width > 10000) {
      alert('Please enter a valid width (1-10000)');
      return;
    }

    if (!height || height < 1 || height > 10000) {
      alert('Please enter a valid height (1-10000)');
      return;
    }

    const sizeConfig = {
      name,
      width,
      height,
      cropMode: document.getElementById('cropModeSelect').value,
      quality: parseInt(document.getElementById('qualitySelect').value),
      format: document.getElementById('formatSelect').value,
      shape: document.getElementById('shapeSelect').value,
      backgroundColor: document.getElementById('backgroundColorInput').value,
      filenamePattern:
        document.getElementById('filenamePatternInput').value.trim() ||
        '{original_name}_{width}x{height}.{format_ext}',
      jpegQuality: parseInt(document.getElementById('jpegQualityInput').value),
      webpQuality: parseInt(document.getElementById('webpQualityInput').value),
      pngCompression: parseInt(
        document.getElementById('pngCompressionInput').value
      ),
      gifColors: parseInt(document.getElementById('gifColorsInput').value),
      transparentBackground: document.getElementById(
        'transparentBackgroundToggle'
      ).checked,
    };

    if (this.currentEditIndex >= 0) {
      this.sizes[this.currentEditIndex] = sizeConfig;
    } else {
      this.sizes.push(sizeConfig);
    }

    this.saveSizesToStorage();
    this.renderSizes();
    this.closeSizeModal();
  }

  editSize(index) {
    this.openSizeModal(index);
  }

  duplicateSize(index) {
    const size = { ...this.sizes[index] };
    size.name = `${size.name} Copy`;
    this.sizes.push(size);
    this.saveSizesToStorage();
    this.renderSizes();
  }

  deleteSize(index) {
    if (confirm(`Delete "${this.sizes[index].name}" size?`)) {
      this.sizes.splice(index, 1);
      this.saveSizesToStorage();
      this.renderSizes();
    }
  }

  // Drag and drop handlers
  handleDragStart(event) {
    this.draggedIndex = parseInt(event.target.dataset.index);
    event.target.classList.add('dragging');
    document.getElementById('sizesList').classList.add('drag-active');

    // Set drag effect
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', event.target.outerHTML);
  }

  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const draggedElement = document.querySelector('.dragging');
    const targetElement = event.target.closest('.size-item');

    if (targetElement && targetElement !== draggedElement) {
      // Remove drag-over class from all items
      document.querySelectorAll('.size-item').forEach((item) => {
        item.classList.remove('drag-over');
      });

      // Add drag-over class to current target
      targetElement.classList.add('drag-over');
    }
  }

  handleDrop(event) {
    event.preventDefault();

    const targetElement = event.target.closest('.size-item');
    if (targetElement && this.draggedIndex !== undefined) {
      const targetIndex = parseInt(targetElement.dataset.index);

      if (this.draggedIndex !== targetIndex) {
        this.reorderSizes(this.draggedIndex, targetIndex);
      }
    }

    this.cleanupDrag();
  }

  handleDragEnd(event) {
    this.cleanupDrag();
  }

  cleanupDrag() {
    // Remove drag-related classes
    document.querySelectorAll('.size-item').forEach((item) => {
      item.classList.remove('dragging', 'drag-over');
    });
    document.getElementById('sizesList').classList.remove('drag-active');

    // Reset drag state
    this.draggedIndex = undefined;
  }

  reorderSizes(fromIndex, toIndex) {
    // Create a new array with reordered items
    const newSizes = [...this.sizes];
    const [movedItem] = newSizes.splice(fromIndex, 1);
    newSizes.splice(toIndex, 0, movedItem);

    // Update the sizes array
    this.sizes = newSizes;

    // Save and re-render
    this.saveSizesToStorage();
    this.renderSizes();
  }

  // Config import/export
  exportConfig() {
    try {
      const config = {
        version: '1.0',
        sizes: this.sizes,
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(config, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'avatar-resizer-config.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting config:', error);
      alert('Failed to export configuration');
    }
  }

  async importConfig(event) {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const text = await file.text();
      const config = JSON.parse(text);

      if (!config.sizes || !Array.isArray(config.sizes)) {
        throw new Error('Invalid configuration format');
      }

      // Validate size configurations
      for (const size of config.sizes) {
        if (!size.name || !size.width || !size.height) {
          throw new Error('Invalid size configuration');
        }
      }

      if (
        confirm('Import configuration? This will replace your current sizes.')
      ) {
        this.sizes = config.sizes;
        this.saveSizesToStorage();
        this.renderSizes();
      }
    } catch (error) {
      console.error('Error importing config:', error);
      alert('Failed to import configuration. Please check the file format.');
    } finally {
      event.target.value = '';
    }
  }

  // Image processing methods
  async processImages() {
    if (!this.originalImage || this.sizes.length === 0) return;

    const processBtn = document.getElementById('processBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    processBtn.disabled = true;
    processBtn.innerHTML = '<span class="process-icon">⏳</span> Processing...';

    try {
      this.processedImages = [];

      for (let i = 0; i < this.sizes.length; i++) {
        const size = this.sizes[i];
        const processedImage = await this.resizeImage(this.originalImage, size);
        this.processedImages.push(processedImage);

        // Update progress
        processBtn.innerHTML = `<span class="process-icon">⏳</span> Processing... ${
          i + 1
        }/${this.sizes.length}`;
      }

      this.showProcessedImages();
      this.showSuccessMessage();
      downloadBtn.disabled = false;
    } catch (error) {
      console.error('Error processing images:', error);
      alert('Failed to process images. Please try again.');
    } finally {
      processBtn.disabled = false;
      processBtn.innerHTML =
        '<span class="process-icon">🔄</span> Process Images';
    }
  }

  async resizeImage(sourceCanvas, sizeConfig) {
    try {
      // Calculate dimensions based on crop mode
      const {
        targetWidth,
        targetHeight,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
      } = this.calculateCropDimensions(sourceCanvas, sizeConfig);

      // Create temporary canvas for cropping
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = sourceWidth;
      tempCanvas.height = sourceHeight;

      // Draw cropped source
      tempCtx.drawImage(
        sourceCanvas,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        sourceWidth,
        sourceHeight
      );

      // Create destination canvas
      const destCanvas = document.createElement('canvas');
      destCanvas.width = targetWidth;
      destCanvas.height = targetHeight;

      // Resize using Pica
      const resizedCanvas = await this.pica.resize(tempCanvas, destCanvas, {
        quality: sizeConfig.quality,
        alpha:
          sizeConfig.format === 'png' ||
          (sizeConfig.transparentBackground &&
            (sizeConfig.shape === 'circle' || sizeConfig.shape === 'rounded')),
      });

      // Apply shape modifications
      const finalCanvas = this.applyShape(resizedCanvas, sizeConfig);

      // Convert to blob with format-specific quality settings
      const mimeType = this.getMimeType(sizeConfig.format);
      let quality;

      switch (sizeConfig.format) {
        case 'jpeg':
          quality = (sizeConfig.jpegQuality || 85) / 100; // Convert percentage to 0-1
          break;
        case 'webp':
          quality = (sizeConfig.webpQuality || 80) / 100; // Convert percentage to 0-1
          break;
        case 'png':
          // PNG compression is handled differently, but we can still pass a quality value
          // Note: PNG compression level is not directly supported by canvas.toBlob
          // but we'll store it for potential future use with other libraries
          quality = undefined; // PNG is lossless
          break;
        case 'gif':
          // GIF quality is handled by canvas.toBlob, but colors are not directly controllable
          // We store gifColors for potential future enhancement with specialized libraries
          quality = undefined; // GIF compression is handled internally
          break;
        case 'ico':
          // ICO format uses PNG encoding internally
          quality = undefined; // ICO is typically lossless
          break;
        default:
          quality = undefined;
      }

      const blob = await this.canvasToBlob(finalCanvas, mimeType, quality);

      // Generate filename using pattern
      const filename = this.generateFilename(
        sizeConfig,
        this.originalFile,
        this.originalImage
      );

      return {
        name: filename,
        displayName: sizeConfig.name,
        width: targetWidth,
        height: targetHeight,
        format: sizeConfig.format,
        blob,
        canvas: finalCanvas,
        size: blob.size,
      };
    } catch (error) {
      console.error('Error resizing image:', error);
      throw error;
    }
  }

  calculateCropDimensions(sourceCanvas, sizeConfig) {
    const sourceWidth = sourceCanvas.width;
    const sourceHeight = sourceCanvas.height;
    const targetWidth = sizeConfig.width;
    const targetHeight = sizeConfig.height;
    const targetRatio = targetWidth / targetHeight;
    const sourceRatio = sourceWidth / sourceHeight;

    let cropX = 0,
      cropY = 0,
      cropWidth = sourceWidth,
      cropHeight = sourceHeight;

    switch (sizeConfig.cropMode) {
      case 'fill':
        // Crop to fill exact dimensions
        if (sourceRatio > targetRatio) {
          // Source is wider, crop width
          cropWidth = sourceHeight * targetRatio;
          cropX = (sourceWidth - cropWidth) / 2;
        } else {
          // Source is taller, crop height
          cropHeight = sourceWidth / targetRatio;
          cropY = (sourceHeight - cropHeight) / 2;
        }
        break;

      case 'stretch':
        // Use full source, will be stretched
        break;

      case 'fit':
      default:
        // Maintain aspect ratio, may have padding
        // This will be handled by the resize operation
        break;
    }

    return {
      targetWidth,
      targetHeight,
      sourceX: Math.round(cropX),
      sourceY: Math.round(cropY),
      sourceWidth: Math.round(cropWidth),
      sourceHeight: Math.round(cropHeight),
    };
  }

  applyShape(canvas, sizeConfig) {
    if (sizeConfig.shape === 'rectangle') return canvas;

    const finalCanvas = document.createElement('canvas');
    const ctx = finalCanvas.getContext('2d');
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;

    // Only fill background if not using transparent background
    if (!sizeConfig.transparentBackground) {
      ctx.fillStyle = sizeConfig.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Create clipping path
    ctx.save();

    if (sizeConfig.shape === 'circle') {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) / 2;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.clip();
    } else if (sizeConfig.shape === 'rounded') {
      const radius = Math.min(canvas.width, canvas.height) * 0.1; // 10% radius
      this.roundRect(ctx, 0, 0, canvas.width, canvas.height, radius);
      ctx.clip();
    }

    // Draw the image
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();

    return finalCanvas;
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  getMimeType(format) {
    const mimeTypes = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      gif: 'image/gif',
      ico: 'image/x-icon',
    };
    return mimeTypes[format] || 'image/png';
  }

  generateFilename(sizeConfig, originalFile, originalImage) {
    if (!sizeConfig.filenamePattern) {
      return `${sizeConfig.name}_${sizeConfig.width}x${sizeConfig.height}.${sizeConfig.format}`;
    }

    const now = new Date();
    const originalNameWithoutExt = originalFile.name.substring(
      0,
      originalFile.name.lastIndexOf('.')
    );
    const originalExt = originalFile.name.substring(
      originalFile.name.lastIndexOf('.') + 1
    );

    // Get format extension
    const formatExtensions = {
      png: 'png',
      jpeg: 'jpg',
      webp: 'webp',
      gif: 'gif',
      ico: 'ico',
    };
    const formatExt = formatExtensions[sizeConfig.format] || sizeConfig.format;

    const variables = {
      // Original file info
      original_name: originalNameWithoutExt,
      original_ext: originalExt,
      original_width: originalImage.naturalWidth,
      original_height: originalImage.naturalHeight,

      // Size config info
      name: sizeConfig.name,
      width: sizeConfig.width,
      height: sizeConfig.height,
      format_ext: formatExt,
      crop_mode: sizeConfig.cropMode,
      shape: sizeConfig.shape,
      quality_text: this.getQualityText(sizeConfig.quality)
        .toLowerCase()
        .replace(' ', '_'),

      // Date/time info
      date: now.toISOString().split('T')[0], // YYYY-MM-DD
      time: now.toTimeString().split(' ')[0].replace(/:/g, '-'), // HH-MM-SS
      timestamp: now.getTime(),

      // Additional useful variables
      year: now.getFullYear(),
      month: String(now.getMonth() + 1).padStart(2, '0'),
      day: String(now.getDate()).padStart(2, '0'),
      hour: String(now.getHours()).padStart(2, '0'),
      minute: String(now.getMinutes()).padStart(2, '0'),
      second: String(now.getSeconds()).padStart(2, '0'),
    };

    let filename = sizeConfig.filenamePattern;

    // Replace all variables in the pattern
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      filename = filename.replace(regex, variables[key]);
    });

    // Clean filename - remove invalid characters
    filename = filename.replace(/[<>:"/\\|?*]/g, '_');

    return filename;
  }

  canvasToBlob(canvas, mimeType, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // Fallback to PNG if the format is not supported
            console.warn(
              `Format ${mimeType} not supported, falling back to PNG`
            );
            canvas.toBlob(resolve, 'image/png');
          }
        },
        mimeType,
        quality
      );
    });
  }

  showProcessedImages() {
    const section = document.getElementById('processedImagesSection');
    const grid = document.getElementById('processedImagesGrid');
    const info = document.getElementById('processedInfo');

    section.style.display = 'block';
    info.textContent = `${this.processedImages.length} images processed successfully`;
    grid.innerHTML = '';

    this.processedImages.forEach((image, index) => {
      const item = this.createProcessedImageItem(image, index);
      grid.appendChild(item);
    });

    // Update PhotoSwipe
    this.updatePhotoSwipe();
  }

  createProcessedImageItem(image, index) {
    const item = document.createElement('div');
    item.className = 'processed-image-item';

    const imgUrl = URL.createObjectURL(image.blob);
    const displayName = image.displayName || image.name;

    item.innerHTML = `
            <a href="${imgUrl}" class="processed-image-link" data-pswp-width="${
      image.width
    }" data-pswp-height="${image.height}">
                <img src="${imgUrl}" alt="${displayName}" class="processed-image">
            </a>
            <div class="processed-image-info">
                <div class="processed-image-name">${displayName}</div>
                <div class="processed-image-details">${image.width}×${
      image.height
    }px<br>${this.formatFileSize(image.size)}</div>
            </div>
            <button type="button" class="processed-image-download">
                <span class="download-icon">⬇️</span> Download
            </button>
        `;

    // Add download functionality
    item
      .querySelector('.processed-image-download')
      .addEventListener('click', () => {
        this.downloadSingleImage(image);
      });

    return item;
  }

  showSuccessMessage() {
    const message = document.getElementById('successMessage');
    const count = document.getElementById('processedCount');

    count.textContent = this.processedImages.length;
    message.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
      message.style.display = 'none';
    }, 5000);
  }

  // Download functionality
  downloadSingleImage(image) {
    const url = URL.createObjectURL(image.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = image.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async downloadAll() {
    if (this.processedImages.length === 0) return;

    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.disabled = true;
    downloadBtn.innerHTML =
      '<span class="download-icon">⏳</span> Creating ZIP...';

    try {
      // Debug library availability
      console.log('JSZip available:', typeof JSZip !== 'undefined');
      console.log('Processed images count:', this.processedImages.length);

      if (typeof JSZip === 'undefined') {
        alert('JSZip library not loaded. Please refresh the page.');
        return;
      }

      const zip = new JSZip();

      // Add each processed image to the zip
      this.processedImages.forEach((image) => {
        zip.file(image.name, image.blob);
      });

      // Generate zip file
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      // Download zip file
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'avatar-resizer-images.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating ZIP:', error);
      alert('Failed to create ZIP file. Please try again.');
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML =
        '<span class="download-icon">📦</span> Download All';
    }
  }

  // PhotoSwipe integration
  initializePhotoSwipe() {
    // Using UMD build for compatibility
    if (typeof PhotoSwipeLightbox !== 'undefined') {
      this.lightbox = new PhotoSwipeLightbox({
        gallery: '#processedImagesGrid',
        children: '.processed-image-link',
        pswpModule: PhotoSwipe,
        showHideAnimationType: 'zoom',
        bgOpacity: 0.9,
        spacing: 0.1,
        allowPanToNext: true,
        zoom: true,
        close: true,
        arrowKeys: true,
        returnFocus: false,
      });

      this.lightbox.init();
    }
  }

  updatePhotoSwipe() {
    if (this.lightbox) {
      this.lightbox.destroy();
      this.initializePhotoSwipe();
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AvatarResizer();
});
