class ProcessedGallery {
  constructor(app, downloader) {
    this.app = app;
    this.downloader = downloader;
    this.results = [];
    this.container = $('processed-images-grid');
    this.section = $('processed-images-section');
    this.info = $('processed-info');
    this.template = $('processed-image-tpl');
    this.setupLightbox();
  }

  setupLightbox() {
    if (this.lightbox) this.lightbox.destroy();
    this.lightbox = new PhotoSwipeLightbox({
      gallery: '#processed-images-grid',
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
        onClick: () => {
          const pswp = this.lightbox.pswp;
          const slide = pswp.currSlide;
          if (!slide) return;
          const index = slide.index;
          const result = this.results[index];
          if (result) this.downloader.download(result);
        },
      });
    });
    this.lightbox.init();
  }

  createItem(result, index) {
    const fragment = this.template.content.cloneNode(true);
    const item = fragment.firstElementChild;
    const link = item.querySelector('.processed-image-link');
    const img = item.querySelector('.processed-image');
    item.dataset.index = index;
    link.href = result.objectUrl;
    link.dataset.pswpWidth = result.width;
    link.dataset.pswpHeight = result.height;
    img.src = result.objectUrl;
    img.alt = result.filename;
    item.querySelector('.processed-image-name').textContent = result.filename;
    item.querySelector('.processed-image-dimensions').textContent = `${result.width} x ${result.height} pixels`;
    item.querySelector('.processed-image-size').textContent = formatBytes(result.size);
    item.querySelector('.processed-image-format').textContent = OUTPUT_FORMATS[result.format].name;
    item.querySelector('.processed-image-download').addEventListener('click', (e) => {
      e.stopPropagation();
      this.downloader.download(result);
    });
    return item;
  }

  render(results) {
    this.results = results || [];
    while (this.container.firstChild) this.container.removeChild(this.container.firstChild);
    if (this.results.length === 0) {
      this.section.style.display = 'none';
      this.info.textContent = '';
      return;
    }
    for (let i = 0; i < this.results.length; i++) {
      const item = this.createItem(this.results[i], i);
      this.container.appendChild(item);
    }
    this.section.style.display = 'block';
    this.info.textContent = `${this.results.length} processed images`;
    this.setupLightbox();
  }

  clear() {
    this.results = [];
    while (this.container.firstChild) this.container.removeChild(this.container.firstChild);
    this.section.style.display = 'none';
    this.info.textContent = '';
    this.setupLightbox();
  }
}

window.ProcessedGallery = ProcessedGallery;
