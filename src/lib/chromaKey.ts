export interface RGB {
  r: number;
  g: number;
  b: number;
}

function rgbToYCbCr(r: number, g: number, b: number) {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return { y, cb, cr };
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

  // Draw the current video frame to the hidden source canvas (mirrored)
  sourceCtx.save();
  sourceCtx.translate(width, 0);
  sourceCtx.scale(-1, 1);
  sourceCtx.drawImage(video, 0, 0, width, height);
  sourceCtx.restore();

  // Get the frame data
  const frame = sourceCtx.getImageData(0, 0, width, height);
  const length = frame.data.length;

  const keyYCbCr = rgbToYCbCr(keyColor.r, keyColor.g, keyColor.b);

  // Determine the dominant channel of keyColor for adaptive spill suppression
  let domKey: "r" | "g" | "b" = "g";
  if (keyColor.r > keyColor.g && keyColor.r > keyColor.b) {
    domKey = "r";
  } else if (keyColor.b > keyColor.r && keyColor.b > keyColor.g) {
    domKey = "b";
  }

  // Scale the tolerance slider value to fit YCbCr chrominance distance space
  const chromaTolerance = tolerance * 0.45;
  const smoothness = 15; // Smooth edge transition range (feathering)

  for (let i = 0; i < length; i += 4) {
    const r = frame.data[i];
    const g = frame.data[i + 1];
    const b = frame.data[i + 2];

    // Convert pixel to YCbCr
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

    // Calculate distance in chrominance plane (Cb, Cr)
    const dCb = cb - keyYCbCr.cb;
    const dCr = cr - keyYCbCr.cr;
    const chromaDistance = Math.sqrt(dCb * dCb + dCr * dCr);

    // Soft-feathering alpha transition
    let alpha = 255;
    if (chromaDistance < chromaTolerance) {
      alpha = 0;
    } else if (chromaDistance < chromaTolerance + smoothness) {
      alpha = Math.round(((chromaDistance - chromaTolerance) / smoothness) * 255);
    }

    frame.data[i + 3] = alpha;

    // Intelligent chroma spill suppression (anti-halo)
    if (alpha > 0) {
      let domVal: number;
      let otherVal1: number;
      let otherVal2: number;
      let domIdx: number;

      if (domKey === "r") {
        domVal = r;
        otherVal1 = g;
        otherVal2 = b;
        domIdx = i;
      } else if (domKey === "b") {
        domVal = b;
        otherVal1 = r;
        otherVal2 = g;
        domIdx = i + 2;
      } else {
        domVal = g;
        otherVal1 = r;
        otherVal2 = b;
        domIdx = i + 1;
      }

      const otherAvg = (otherVal1 + otherVal2) / 2;

      // Suppress the color spill if the dominant channel is dominant in the pixel
      // and the pixel's color is relatively close to the chroma key color (within 2x tolerance)
      if (domVal > otherAvg && chromaDistance < chromaTolerance * 2.0) {
        const factor = Math.max(0, Math.min(1, (chromaDistance - chromaTolerance) / chromaTolerance));
        // Blend the dominant channel towards the average of the other two channels
        frame.data[domIdx] = Math.round(factor * domVal + (1 - factor) * otherAvg);
      }
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
