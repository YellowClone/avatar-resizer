class Processor {
  constructor(options) {
    const opts = options || {};
    this.pica = opts.pica || pica();
  }

  createBaseCanvas(image) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    ctx.drawImage(image, 0, 0);
    return canvas;
  }

  async render(sourceCanvas, preset) {
    const canvas = await this.createOutputCanvas(sourceCanvas, preset);
    return { canvas, width: canvas.width, height: canvas.height };
  }

  async toBlob(canvas, preset) {
    if (preset.format === 'ico') {
      const icoBlob = await createIco([canvas]);
      if (!icoBlob) throw new Error('ICO conversion failed');
      return icoBlob;
    }
    const format = OUTPUT_FORMATS[preset.format];
    let quality;
    if (preset.format === 'jpeg') quality = preset.jpegQuality / 100;
    else if (preset.format === 'webp') quality = preset.webpQuality / 100;
    return this.pica.toBlob(canvas, format.mime, quality);
  }

  generateFilename(entry, preset, actualWidth, actualHeight) {
    const now = new Date();
    const originalName = entry.file.name.replace(/\.[^/.]+$/, '');
    const originalExt = entry.file.name.split('.').pop().toLowerCase();
    const context = {
      originalName,
      originalExt,
      originalFormat: SUPPORTED_FORMATS[entry.file.type] || 'Unsupported',
      originalWidth: entry.width,
      originalHeight: entry.height,
      name: preset.name,
      width: actualWidth || preset.width,
      height: actualHeight || preset.height,
      cropMode: preset.getCropModeText(),
      resizeQuality: preset.getResizeQualityText(),
      format: OUTPUT_FORMATS[preset.format].name,
      formatExt: OUTPUT_FORMATS[preset.format].ext,
      formatQuality: preset.getFormatQualityText(),
      shape: preset.getShapeText(),
      centering: preset.getCenteringPreset(),
      background: preset.getBackgroundText(),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].replace(/:/g, ''),
      timestamp: Math.floor(now.getTime() / 1000),
      maintainAspectRatio: preset.getMaintainAspectRatioText(),
      dateObj: now,
    };
    return formatFilename(preset.filenamePattern, context);
  }

  async createOutputCanvas(sourceCanvas, preset) {
    const size = this.calculateOutputSize(sourceCanvas.width, sourceCanvas.height, preset);
    const outputCanvas = document.createElement('canvas');
    const outputCtx = outputCanvas.getContext('2d');
    outputCanvas.width = Math.max(1, Math.round(size.outputWidth));
    outputCanvas.height = Math.max(1, Math.round(size.outputHeight));
    if (!preset.transparentBackground || !preset.supportsTransparency()) {
      outputCtx.fillStyle = preset.backgroundColor;
      outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
    }
    const rects = this.prepareRects(
      sourceCanvas.width,
      sourceCanvas.height,
      outputCanvas.width,
      outputCanvas.height,
      preset
    );
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');
    croppedCanvas.width = Math.max(1, Math.round(rects.sourceWidth));
    croppedCanvas.height = Math.max(1, Math.round(rects.sourceHeight));
    croppedCtx.drawImage(
      sourceCanvas,
      rects.sourceX,
      rects.sourceY,
      rects.sourceWidth,
      rects.sourceHeight,
      0,
      0,
      croppedCanvas.width,
      croppedCanvas.height
    );
    const resizedCanvas = document.createElement('canvas');
    const resizedCtx = resizedCanvas.getContext('2d');
    resizedCanvas.width = Math.max(1, Math.round(rects.targetWidth));
    resizedCanvas.height = Math.max(1, Math.round(rects.targetHeight));
    resizedCtx.clearRect(0, 0, resizedCanvas.width, resizedCanvas.height);
    await this.pica.resize(croppedCanvas, resizedCanvas, {
      quality: preset.quality,
      unsharpAmount: 0,
    });
    outputCtx.drawImage(resizedCanvas, rects.targetX, rects.targetY);
    if (preset.shape === 'circle') this.applyCircleMask(outputCtx, outputCanvas, preset);
    else if (preset.shape === 'rounded') this.applyRoundedMask(outputCtx, outputCanvas, preset);
    return outputCanvas;
  }

  calculateOutputSize(originalWidth, originalHeight, preset) {
    const maintain = preset.maintainAspectRatio && preset.format !== 'ico';
    if (!maintain) {
      return {
        outputWidth: preset.width || originalWidth,
        outputHeight: preset.height || originalHeight,
      };
    }
    const aspect = originalWidth / originalHeight;
    const maxW = preset.width || null;
    const maxH = preset.height || null;
    let width = originalWidth;
    let height = originalHeight;
    if (maxW && maxH) {
      if (maxW / maxH > aspect) {
        height = maxH;
        width = Math.round(height * aspect);
      } else {
        width = maxW;
        height = Math.round(width / aspect);
      }
    } else if (maxW) {
      width = maxW;
      height = Math.round(width / aspect);
    } else if (maxH) {
      height = maxH;
      width = Math.round(height * aspect);
    }
    return { outputWidth: Math.max(1, width), outputHeight: Math.max(1, height) };
  }

  prepareRects(srcW, srcH, outW, outH, preset) {
    const sourceAspect = srcW / srcH;
    const targetAspect = outW / outH;
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = srcW;
    let sourceHeight = srcH;
    let targetX = 0;
    let targetY = 0;
    let targetWidth = outW;
    let targetHeight = outH;
    if (preset.cropMode === 'fill') {
      if (sourceAspect > targetAspect) {
        sourceWidth = srcH * targetAspect;
        sourceX = (srcW - sourceWidth) * (preset.horizontalOffset / 100);
      } else {
        sourceHeight = srcW / targetAspect;
        sourceY = (srcH - sourceHeight) * (preset.verticalOffset / 100);
      }
    } else if (preset.cropMode === 'fit') {
      if (sourceAspect > targetAspect) {
        targetHeight = outW / sourceAspect;
        targetY = (outH - targetHeight) * (preset.verticalOffset / 100);
      } else {
        targetWidth = outH * sourceAspect;
        targetX = (outW - targetWidth) * (preset.horizontalOffset / 100);
      }
    }
    return {
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      targetX,
      targetY,
      targetWidth,
      targetHeight,
    };
  }

  applyCircleMask(ctx, canvas, preset) {
    const radius = Math.min(canvas.width, canvas.height) / 2;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        if (Math.sqrt(dx * dx + dy * dy) > radius) {
          const index = (y * canvas.width + x) * 4;
          if (preset.transparentBackground && preset.supportsTransparency()) {
            data[index + 3] = 0;
          } else {
            const rgb = hexToRgb(preset.backgroundColor) || { r: 0, g: 0, b: 0 };
            data[index] = rgb.r;
            data[index + 1] = rgb.g;
            data[index + 2] = rgb.b;
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  applyRoundedMask(ctx, canvas, preset) {
    const radius = Math.min(preset.cornerRadius, canvas.width / 2, canvas.height / 2);

    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, radius);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  cloneCanvas(source) {
    if (!source) return null;
    const copy = document.createElement('canvas');
    copy.width = source.width;
    copy.height = source.height;
    const ctx = copy.getContext('2d');
    ctx.drawImage(source, 0, 0);
    return copy;
  }
}

window.Processor = Processor;
