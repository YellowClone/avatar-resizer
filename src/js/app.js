class App {
  constructor() {
    this.originalStore = new BlobStore();
    this.processedStore = new BlobStore();
    this.processor = new Processor({ pica: pica() });
    this.pipeline = new ImagePipeline(this.processor, this.processedStore, { concurrency: 3 });
    this.loader = new ImageLoader({
      blobStore: this.originalStore,
      onStart: () => this.onLoadStart(),
      onProgress: (loaded, total) => this.onLoadProgress(loaded, total),
      onFinish: () => this.onLoadFinish(),
      onError: (message) => this.showMessage(message, 'error'),
    });
    this.uploader = new Uploader(this, this.loader);
    this.downloader = new Downloader(this);
    this.originalGallery = new OriginalGallery(this, this.originalStore);
    this.processedGallery = new ProcessedGallery(this, this.downloader);
    this.presets = new PresetManager(this);
    this.editor = new Editor(this, this.presets);
    this.theme = new ThemeController(this);
    this.processedResults = [];
    this.isLoading = false;
    this.autoProcess = true;
    this.pendingLoadTotal = 0;
    this.processIcon = $$('#process-btn .process-icon');
    this.processText = $$('#process-btn .process-text');
    this.updateStatus = this.updateStatus.bind(this);
    this.onPresetsUpdated = this.onPresetsUpdated.bind(this);
    this.onImagesLoaded = this.onImagesLoaded.bind(this);
    this.onImageRemoved = this.onImageRemoved.bind(this);
    this.init();
  }

  init() {
    this.originalGallery.setCallbacks({
      onSelectionChange: () => this.updateStatus(),
      onRemove: (entry) => this.onImageRemoved(entry),
    });
    this.downloader.setResultsProvider(() => this.processedResults);
    $('process-btn').addEventListener('click', () => this.process());
    $('auto-process-toggle').addEventListener('change', (e) => this.setAutoProcess(e.target.checked));
    this.theme.restore();
    this.restoreAutoProcess();
    this.clearProcessedResults();
    this.updateStatus();
  }

  onLoadStart() {
    this.isLoading = true;
    this.pendingLoadTotal = 0;
    this.setProcessLabel('⏳', 'Loading images...');
    this.updateStatus();
  }

  onLoadProgress(loaded, total) {
    if (!this.isLoading) return;
    this.pendingLoadTotal = total;
    const text = total ? `Loading images... (${loaded}/${total})` : 'Loading images...';
    this.setProcessLabel('⏳', text);
  }

  onLoadFinish() {
    this.isLoading = false;
    this.resetProcessLabel();
    this.updateStatus();
  }

  onImagesLoaded(entries) {
    if (!entries || entries.length === 0) {
      this.updateStatus();
      return;
    }
    this.originalGallery.addEntries(entries);
    this.clearProcessedResults();
    this.updateStatus();
    this.handleAutoProcess();
    this.showMessage(`${entries.length} image${entries.length > 1 ? 's' : ''} loaded`);
  }

  onImageRemoved(entry) {
    if (!entry) return;
    this.removeResultsByImage(entry.id);
    this.updateStatus();
  }

  onPresetsUpdated() {
    this.updateStatus();
    this.handleAutoProcess();
  }

  handleAutoProcess() {
    if (!this.autoProcess) return;
    if (this.isLoading || this.pipeline.isProcessing || this.loader.isLoading) return;
    if (!this.originalGallery.hasImages()) return;
    if (!this.presets.hasPresets()) return;
    this.process();
  }

  process() {
    if (this.isLoading || this.pipeline.isProcessing || this.loader.isLoading) return;
    const images = this.originalGallery.getAll();
    if (images.length === 0) {
      this.showMessage('Add an image first', 'error');
      return;
    }
    const presets = this.presets.getAll();
    if (presets.length === 0) {
      this.showMessage('Add at least one size', 'error');
      return;
    }
    const total = images.length * presets.length;
    let completed = 0;
    this.clearProcessedResults();
    this.setProcessLabel('⚙️', `Processing... (0/${total})`);
    this.pipeline.isProcessing = true;
    this.updateStatus();
    this.pipeline
      .process(images, presets, (info) => {
        completed = info.completed;
        const text = `Processing... (${completed}/${total})`;
        this.setProcessLabel('⚙️', text);
      })
      .then(({ results, errors }) => {
        this.processedResults = results;
        this.downloader.setResultsProvider(() => this.processedResults);
        this.processedGallery.render(this.processedResults);
        if (errors.length > 0) {
          this.showMessage('Processing finished with some errors', 'error');
        } else if (results.length > 0) {
          this.showMessage('Processing complete');
        } else {
          this.showMessage('No results generated', 'error');
        }
      })
      .catch(() => {
        this.showMessage('Processing failed', 'error');
      })
      .finally(() => {
        this.pipeline.isProcessing = false;
        this.resetProcessLabel();
        this.updateStatus();
      });
  }

  removeResultsByImage(imageId) {
    if (!imageId || this.processedResults.length === 0) return;
    const remaining = [];
    for (let i = 0; i < this.processedResults.length; i++) {
      const result = this.processedResults[i];
      if (result.imageId === imageId) {
        this.processedStore.revoke(result.id);
        // Force release of canvas backing store to free memory
        if (result.canvas) {
          result.canvas.width = 0;
          result.canvas.height = 0;
        }
      } else {
        remaining.push(result);
      }
    }
    this.processedResults = remaining;
    this.downloader.setResultsProvider(() => this.processedResults);
    if (remaining.length === 0) this.processedGallery.clear();
    else this.processedGallery.render(remaining);
  }

  clearProcessedResults() {
    if (this.processedResults.length === 0) {
      this.processedGallery.clear();
      this.downloader.setResultsProvider(() => this.processedResults);
      this.updateStatus();
      return;
    }
    for (let i = 0; i < this.processedResults.length; i++) {
      const result = this.processedResults[i];
      this.processedStore.revoke(result.id);
      // Force release of canvas backing store to free memory
      if (result.canvas) {
        result.canvas.width = 0;
        result.canvas.height = 0;
      }
    }
    this.processedResults = [];
    this.processedGallery.clear();
    this.downloader.setResultsProvider(() => this.processedResults);
    this.updateStatus();
  }

  updateStatus() {
    const hasImages = this.originalGallery ? this.originalGallery.hasImages() : false;
    const hasPresets = this.presets ? this.presets.hasPresets() : false;
    const hasResults = Array.isArray(this.processedResults) && this.processedResults.length > 0;
    const isProcessing = !!(
      this.isLoading ||
      (this.pipeline && this.pipeline.isProcessing) ||
      (this.loader && this.loader.isLoading)
    );
    $('process-btn').disabled = !hasImages || !hasPresets || isProcessing;
    $('download-zip-btn').disabled = !hasResults || isProcessing;
    $('download-ico-btn').disabled = !hasResults || isProcessing;
    $('upload-area-section').disabled = isProcessing;
    $('add-image-btn').disabled = isProcessing;
    $$$('.image-gallery-close').forEach((el) => (el.disabled = isProcessing));
  }

  showMessage(text, type) {
    const existing = $$('.app-message');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    const fragment = $('message-tpl').content.cloneNode(true);
    const message = fragment.firstElementChild;
    message.textContent = text;
    if (type === 'error') message.classList.add('error');
    document.body.appendChild(message);
    requestAnimationFrame(() => message.classList.add('show'));
    setTimeout(() => {
      message.classList.remove('show');
      setTimeout(() => {
        if (message.parentNode) message.parentNode.removeChild(message);
      }, 300);
    }, 3000);
  }

  setProcessLabel(icon, text) {
    this.processIcon.textContent = icon;
    this.processText.textContent = text;
  }

  resetProcessLabel() {
    this.setProcessLabel('🔄', 'Process Images');
  }

  setAutoProcess(value) {
    this.autoProcess = !!value;
    $('auto-process-toggle').checked = this.autoProcess;
    localStorage.setItem(STORAGE_KEYS.autoProcess, this.autoProcess ? 'true' : 'false');
    this.handleAutoProcess();
  }

  restoreAutoProcess() {
    const stored = localStorage.getItem(STORAGE_KEYS.autoProcess);
    this.autoProcess = stored === null ? true : stored === 'true';
    $('auto-process-toggle').checked = this.autoProcess;
  }
}

class ThemeController {
  constructor(app) {
    this.app = app;
    this.button = $('theme-toggle');
    this.icon = $('theme-toggle-icon');
    this.button.addEventListener('click', () => this.toggle());
  }

  restore() {
    const stored = localStorage.getItem(STORAGE_KEYS.theme);
    if (stored === 'dark') document.body.dataset.theme = 'dark';
    else document.body.removeAttribute('data-theme');
    this.sync();
  }

  toggle() {
    if (document.body.dataset.theme === 'dark') {
      document.body.removeAttribute('data-theme');
      this.save('light');
    } else {
      document.body.dataset.theme = 'dark';
      this.save('dark');
    }
    this.sync();
  }

  sync() {
    if (document.body.dataset.theme === 'dark') {
      this.icon.textContent = '🌙';
      this.button.setAttribute('title', 'Switch to light mode');
    } else {
      this.icon.textContent = '🌞';
      this.button.setAttribute('title', 'Switch to dark mode');
    }
  }

  save(theme) {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }
}

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
