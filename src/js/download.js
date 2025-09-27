class Downloader {
  constructor(app) {
    this.app = app;
    this.getResults = () => [];
    this.init();
  }

  init() {
    $('download-zip-btn').addEventListener('click', async () => {
      const results = this.getResults();
      await this.downloadAll(results);
    });
    $('download-ico-btn').addEventListener('click', async () => {
      const results = this.getResults();
      await this.downloadIco(results);
    });
  }

  setResultsProvider(provider) {
    this.getResults = provider || (() => []);
  }

  async downloadAll(results) {
    if (!results || results.length === 0) {
      this.app.showMessage('No processed results available', 'error');
      return;
    }
    try {
      const zip = new JSZip();
      const counts = new Map();
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const key = result.filename.toLowerCase();
        const count = counts.get(key) || 0;
        let name = result.filename;
        if (count > 0) {
          const parts = extractNameAndExt(result.filename);
          const ext = parts.ext ? `.${parts.ext}` : '';
          name = `${parts.name} (${count})${ext}`;
        }
        counts.set(key, count + 1);
        zip.file(name, result.blob);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      this.triggerDownload(blob, formatPackagingName('zip'));
      this.app.showMessage('ZIP file downloaded');
    } catch (error) {
      this.app.showMessage('Failed to create ZIP file', 'error');
    }
  }

  async downloadIco(results) {
    if (!results || results.length === 0) {
      this.app.showMessage('No processed results available', 'error');
      return;
    }
    try {
      const canvases = []; // To hold canvases for ICO creation
      const created = []; // To track canvases we create for cleanup
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.canvas && result.canvas.width > 0 && result.canvas.height > 0) {
          canvases.push(result.canvas);
        } else {
          const canvas = await this.blobToCanvas(result.blob);
          canvases.push(canvas);
          created.push(canvas);
        }
      }
      canvases.sort((a, b) => b.width - a.width);
      const icoBlob = await createIco(canvases);
      for (let i = 0; i < created.length; i++) {
        created[i].width = 0;
        created[i].height = 0;
      }
      if (!icoBlob) throw new Error('ICO creation failed');
      this.triggerDownload(icoBlob, formatPackagingName('ico'));
      this.app.showMessage('ICO file downloaded');
    } catch (error) {
      this.app.showMessage('Failed to create ICO file', 'error');
    }
  }

  async blobToCanvas(blob) {
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      return canvas;
    }
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to decode image'));
      };
      img.src = url;
    });
  }

  download(result) {
    const url = result.objectUrl || URL.createObjectURL(result.blob);
    this.triggerLink(url, result.filename);
    if (!result.objectUrl) setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    this.triggerLink(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  triggerLink(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

window.Downloader = Downloader;
