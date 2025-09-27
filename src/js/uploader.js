class Uploader {
  constructor(app, imageLoader) {
    this.app = app;
    this.loader = imageLoader;
    this.dragCounter = 0;
    this.fileInput = $('file-input');
    this.init();
  }

  init() {
    $('upload-area-section').addEventListener('click', this.triggerFileDialog.bind(this));
    $('add-image-btn').addEventListener('click', this.triggerFileDialog.bind(this));
    this.fileInput.addEventListener('change', this.handleInputChange.bind(this));
    document.addEventListener('dragenter', (e) => this.handleDragEnter(e));
    document.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    document.addEventListener('dragover', (e) => this.handleDragOver(e));
    document.addEventListener('drop', this.handleDrop.bind(this));
    document.addEventListener('mouseleave', () => this.resetDrag());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.resetDrag();
    });
    document.addEventListener('click', () => this.resetDrag());
    document.addEventListener('contextmenu', () => this.resetDrag());
  }

  triggerFileDialog(e) {
    e.preventDefault();
    this.fileInput.click();
  }

  handleInputChange(e) {
    const files = Array.from(e.target.files || []);
    this.handleFiles(files);
    this.fileInput.value = '';
  }

  handleDragEnter(e) {
    if (!this.hasFiles(e)) return;
    e.preventDefault();
    this.dragCounter++;
    if (this.dragCounter === 1) document.body.classList.add('global-drag-over');
  }

  handleDragLeave(e) {
    if (!this.hasFiles(e)) return;
    e.preventDefault();
    this.dragCounter--;
    if (this.dragCounter <= 0) this.resetDrag();
  }

  handleDragOver(e) {
    e.preventDefault();
    if (this.hasFiles(e)) e.dataTransfer.dropEffect = 'copy';
  }

  handleDrop(e) {
    if (!this.hasFiles(e)) return;
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files || []);
    this.resetDrag();
    const images = files.filter((file) => !file.type || file.type.startsWith('image/'));
    this.handleFiles(images);
  }

  hasFiles(e) {
    return e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
  }

  resetDrag() {
    this.dragCounter = 0;
    document.body.classList.remove('global-drag-over');
  }

  async handleFiles(files) {
    if (!files || files.length === 0) return;
    const results = await this.loader.load(files);
    if (results.length > 0) this.app.onImagesLoaded(results);
  }
}

window.Uploader = Uploader;
