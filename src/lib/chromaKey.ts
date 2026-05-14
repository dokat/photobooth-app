export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function applyChromaKey(
  sourceCtx: CanvasRenderingContext2D,
  targetCtx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  bgImage: HTMLImageElement | null,
  width: number,
  height: number,
  keyColor: RGB = { r: 0, g: 255, b: 0 },
  tolerance = 70
) {
  if (!width || !height) return;

  // Draw the current video frame to the hidden source canvas
  sourceCtx.drawImage(video, 0, 0, width, height);

  // Get the frame data
  const frame = sourceCtx.getImageData(0, 0, width, height);
  const length = frame.data.length;

  for (let i = 0; i < length; i += 4) {
    const r = frame.data[i];
    const g = frame.data[i + 1];
    const b = frame.data[i + 2];

    // Euclidean distance in RGB space
    const dr = r - keyColor.r;
    const dg = g - keyColor.g;
    const db = b - keyColor.b;
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);

    if (distance < tolerance) {
      frame.data[i + 3] = 0; // Alpha to 0
    }
  }

  // Put transparent frame back to source
  sourceCtx.putImageData(frame, 0, 0);

  // Target canvas rendering
  if (bgImage) {
    const bgRatio = bgImage.naturalWidth / bgImage.naturalHeight;
    const canvasRatio = width / height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (canvasRatio > bgRatio) {
      drawWidth = width;
      drawHeight = width / bgRatio;
      offsetX = 0;
      offsetY = (height - drawHeight) / 2;
    } else {
      drawWidth = height * bgRatio;
      drawHeight = height;
      offsetX = (width - drawWidth) / 2;
      offsetY = 0;
    }
    targetCtx.drawImage(bgImage, offsetX, offsetY, drawWidth, drawHeight);
  } else {
    // Checkered background or transparent
    targetCtx.clearRect(0, 0, width, height);
  }

  // Draw the processed foreground over the background
  targetCtx.drawImage(sourceCtx.canvas, 0, 0, width, height);
}
