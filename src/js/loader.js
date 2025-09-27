class BlobStore {
  constructor() {
    this.urls = new Map();
  }

  create(id, blob) {
    this.revoke(id);
    const url = URL.createObjectURL(blob);
    this.urls.set(id, { url });
    return url;
  }

  set(id, url) {
    this.revoke(id);
    this.urls.set(id, { url });
    return url;
  }

  get(id) {
    const entry = this.urls.get(id);
    if (!entry) return null;
    return entry.url;
  }

  revoke(id) {
    const entry = this.urls.get(id);
    if (entry) {
      URL.revokeObjectURL(entry.url);
      this.urls.delete(id);
    }
  }

  revokeMany(ids) {
    for (let i = 0; i < ids.length; i++) this.revoke(ids[i]);
  }

  clear() {
    const keys = Array.from(this.urls.keys());
    for (let i = 0; i < keys.length; i++) this.revoke(keys[i]);
  }
}

class ImageLoader {
  constructor(options) {
    const opts = options || {};
    this.blobStore = opts.blobStore || new BlobStore();
    this.onStart = opts.onStart || function () {};
    this.onProgress = opts.onProgress || function () {};
    this.onFinish = opts.onFinish || function () {};
    this.onError = opts.onError || function () {};
    this.isLoading = false;
  }

  validate(file) {
    if (!file.type || !SUPPORTED_FORMATS[file.type]) {
      return { valid: false, message: `Unsupported file type: ${file.name}` };
    }
    if (file.size > MAX_FILE_SIZE) {
      const size = formatBytes(file.size);
      return { valid: false, message: `File too large: ${file.name} (${size})` };
    }
    return { valid: true };
  }

  async load(files) {
    const list = Array.isArray(files) ? files : Array.from(files || []);
    if (list.length === 0) return [];
    const valid = [];
    const errors = [];
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      const check = this.validate(file);
      if (check.valid) valid.push(file);
      else errors.push({ file, message: check.message });
    }
    if (errors.length > 0) this.reportErrors(errors);
    if (valid.length === 0) return [];
    this.isLoading = true;
    this.onStart();
    const total = valid.length;
    let loaded = 0;
    const results = [];
    await Promise.all(
      valid.map((file) =>
        this.readFile(file)
          .then((entry) => {
            results.push(entry);
            loaded++;
            this.onProgress(loaded, total, entry);
          })
          .catch((error) => {
            loaded++;
            errors.push({ file, message: error.message });
            this.onProgress(loaded, total, null);
          })
      )
    );
    this.isLoading = false;
    this.onFinish();
    if (errors.length > 0) this.reportErrors(errors);
    return results;
  }

  readFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        const id = generateId();
        this.blobStore.set(id, url);
        resolve({
          id,
          file,
          name: file.name,
          size: file.size,
          mime: file.type,
          width: img.naturalWidth,
          height: img.naturalHeight,
          blobUrl: url,
          imageElement: img,
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to load image: ${file.name}`));
      };
      img.src = url;
    });
  }

  revoke(ids) {
    this.blobStore.revokeMany(ids);
  }

  clear() {
    this.blobStore.clear();
  }

  reportErrors(errors) {
    for (let i = 0; i < errors.length; i++) this.onError(errors[i].message, errors[i].file);
  }
}

const loaderExports = { BlobStore, ImageLoader };
Object.keys(loaderExports).forEach(function (key) {
  window[key] = loaderExports[key];
});
