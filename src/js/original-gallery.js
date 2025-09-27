class OriginalGallery {
  constructor(app, blobStore) {
    this.app = app;
    this.blobStore = blobStore;
    this.entries = new Map();
    this.domNodes = new Map();
    this.currentId = null;
    this.container = $('image-gallery-content');
    this.section = $('image-gallery-section');
    this.uploadSection = $('upload-area-section');
    this.previewSection = $('image-preview-section');
    this.previewImage = $('image-preview');
    this.previewInfo = $('image-preview-info');
    this.onSelectionChange = null;
    this.onRemove = null;
  }

  setCallbacks(callbacks) {
    const cb = callbacks || {};
    this.onSelectionChange = cb.onSelectionChange || null;
    this.onRemove = cb.onRemove || null;
  }

  addEntries(entries) {
    if (!entries || entries.length === 0) return;
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      this.entries.set(entry.id, entry);
      const node = this.createItem(entry);
      this.domNodes.set(entry.id, node);
      this.container.appendChild(node);
    }
    this.section.style.display = 'block';
    this.uploadSection.style.display = 'none';
    this.previewSection.style.display = 'flex';
    const last = entries[entries.length - 1];
    this.select(last.id);
  }

  createItem(entry) {
    const fragment = $('image-gallery-item-tpl').content.cloneNode(true);
    const item = fragment.firstElementChild;
    const imgEl = item.querySelector('.image-gallery-img');
    imgEl.src = entry.blobUrl;
    imgEl.alt = entry.file.name;
    item.querySelector('.image-gallery-name').textContent = entry.file.name;
    item.querySelector('.image-gallery-size').textContent = formatBytes(entry.file.size);
    item.querySelector('.image-gallery-format').textContent = SUPPORTED_FORMATS[entry.file.type] || 'Unsupported';
    item.querySelector('.image-gallery-dimensions').textContent = `${entry.width} x ${entry.height} pixels`;
    item.id = `image-gallery-item-${entry.id}`;
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('image-gallery-close')) return;
      this.select(entry.id);
    });
    const closeBtn = item.querySelector('.image-gallery-close');
    closeBtn.addEventListener('click', (e) => {
      if (this.app.pipeline.isProcessing) return;
      e.stopPropagation();
      this.remove(entry.id);
    });
    return item;
  }

  select(id) {
    if (!this.entries.has(id)) return;
    this.currentId = id;
    const entry = this.entries.get(id);
    this.previewImage.src = entry.blobUrl;
    this.updateInfo(entry);
    $$$('.image-gallery-item').forEach((node) => node.classList.remove('active'));
    const active = this.domNodes.get(id);
    if (active) active.classList.add('active');
    if (this.onSelectionChange) this.onSelectionChange(entry);
  }

  updateInfo(entry) {
    while (this.previewInfo.firstChild) this.previewInfo.removeChild(this.previewInfo.firstChild);
    const fragment = $('image-info-tpl').content.cloneNode(true);
    fragment.querySelector('.image-dimensions').textContent = `${entry.width} x ${entry.height} pixels`;
    fragment.querySelector('.image-size').textContent = formatBytes(entry.file.size);
    fragment.querySelector('.image-format').textContent = SUPPORTED_FORMATS[entry.file.type] || 'Unsupported';
    this.previewInfo.appendChild(fragment);
  }

  remove(id) {
    const entry = this.entries.get(id);
    if (!entry) return;
    this.entries.delete(id);
    const node = this.domNodes.get(id);
    if (node && node.parentNode) node.parentNode.removeChild(node);
    this.domNodes.delete(id);
    this.blobStore.revoke(id);
    if (this.currentId === id) {
      const nextId = this.entries.size > 0 ? Array.from(this.entries.keys())[0] : null;
      if (nextId) this.select(nextId);
      else this.resetView();
    }
    if (this.onRemove) this.onRemove(entry);
  }

  resetView() {
    this.currentId = null;
    this.previewImage.src = '';
    while (this.previewInfo.firstChild) this.previewInfo.removeChild(this.previewInfo.firstChild);
    this.section.style.display = 'none';
    this.previewSection.style.display = 'none';
    this.uploadSection.style.display = 'block';
  }

  clear() {
    const ids = Array.from(this.entries.keys());
    for (let i = 0; i < ids.length; i++) this.remove(ids[i]);
    this.entries.clear();
    this.domNodes.clear();
    this.resetView();
  }

  getSelected() {
    return this.currentId ? this.entries.get(this.currentId) : null;
  }

  getAll() {
    return Array.from(this.entries.values());
  }

  hasImages() {
    return this.entries.size > 0;
  }
}

window.OriginalGallery = OriginalGallery;
