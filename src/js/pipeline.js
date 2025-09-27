class ImagePipeline {
  constructor(processor, blobStore, options) {
    this.processor = processor;
    this.blobStore = blobStore || new BlobStore();
    const opts = options || {};
    this.concurrency = Math.max(1, opts.concurrency || 2);
    this.isProcessing = false;
  }

  async process(images, presets, progressCb) {
    const list = Array.isArray(images) ? images : [];
    const presetList = Array.isArray(presets) ? presets : [];
    if (list.length === 0 || presetList.length === 0) return { results: [], errors: [] };
    this.isProcessing = true;
    const baseCanvases = new Map();
    for (let i = 0; i < list.length; i++) {
      const entry = list[i];
      baseCanvases.set(entry.id, this.processor.createBaseCanvas(entry.imageElement));
    }
    const tasks = [];
    let index = 0;
    for (let i = 0; i < list.length; i++) {
      const entry = list[i];
      const baseCanvas = baseCanvases.get(entry.id);
      for (let j = 0; j < presetList.length; j++) {
        tasks.push({ image: entry, preset: presetList[j], canvas: baseCanvas, index });
        index++;
      }
    }
    const results = new Array(tasks.length);
    const errors = [];
    const total = tasks.length;
    let completed = 0;
    let cursor = 0;
    const worker = async () => {
      while (true) {
        let current;
        if (cursor >= tasks.length) break;
        current = tasks[cursor++];
        try {
          const output = await this.processor.render(current.canvas, current.preset);
          const blob = await this.processor.toBlob(output.canvas, current.preset);
          const filename = this.processor.generateFilename(current.image, current.preset, output.width, output.height);
          const preview = this.processor.cloneCanvas(output.canvas);
          output.canvas.width = 0;
          output.canvas.height = 0;
          const resultId = generateId();
          const objectUrl = this.blobStore.create(resultId, blob);
          const result = {
            id: resultId,
            imageId: current.image.id,
            presetId: current.preset.id,
            width: output.width,
            height: output.height,
            blob,
            mime: OUTPUT_FORMATS[current.preset.format].mime,
            size: blob.size,
            filename,
            objectUrl,
            format: current.preset.format,
            canvas: preview,
          };
          results[current.index] = result;
          completed++;
          if (progressCb)
            progressCb({ status: 'success', image: current.image, preset: current.preset, result, completed, total });
        } catch (error) {
          errors.push({ index: current.index, image: current.image, preset: current.preset, error });
          completed++;
          if (progressCb)
            progressCb({ status: 'error', image: current.image, preset: current.preset, error, completed, total });
        }
      }
    };
    const workers = [];
    const limit = Math.min(this.concurrency, tasks.length);
    for (let i = 0; i < limit; i++) workers.push(worker());
    await Promise.all(workers);
    baseCanvases.forEach((canvas) => {
      canvas.width = 0;
      canvas.height = 0;
    });
    this.isProcessing = false;
    const finalResults = [];
    for (let i = 0; i < results.length; i++) {
      const entry = results[i];
      if (entry) finalResults.push(entry);
    }
    errors.sort((a, b) => a.index - b.index);
    const finalErrors = [];
    for (let i = 0; i < errors.length; i++) {
      const entry = errors[i];
      finalErrors.push({ image: entry.image, preset: entry.preset, error: entry.error });
    }
    return { results: finalResults, errors: finalErrors };
  }
}

window.ImagePipeline = ImagePipeline;
