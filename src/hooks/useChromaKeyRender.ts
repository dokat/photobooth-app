/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import Webcam from "react-webcam";
import { applyChromaKey } from "@/lib/chromaKey";
import type { RGB } from "@/lib/chromaKey";

interface UseChromaKeyProps {
  webcamRef: RefObject<Webcam | null>;
  hiddenCanvasRef: RefObject<HTMLCanvasElement | null>;
  resultCanvasRef: RefObject<HTMLCanvasElement | null>;
  currentBgImage: HTMLImageElement | null;
  keyColor: RGB;
  tolerance: number;
  isPaused: boolean;
  segmentationMode: "chromakey" | "ai";
  isAiLoaded: boolean;
  setIsAiLoaded: (val: boolean) => void;
}

declare global {
  interface Window {
    SelfieSegmentation: any;
  }
}

export function useChromaKeyRender({
  webcamRef,
  hiddenCanvasRef,
  resultCanvasRef,
  currentBgImage,
  keyColor,
  tolerance,
  isPaused,
  segmentationMode,
  isAiLoaded,
  setIsAiLoaded,
}: UseChromaKeyProps) {
  const animationFrameId = useRef<number | undefined>(undefined);
  const selfieSegmentationRef = useRef<any>(null);
  const isPausedRef = useRef(isPaused);

  // Sync isPaused ref to access it in the dynamic callback without stale closures
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Load MediaPipe script dynamically when AI mode is selected
  useEffect(() => {
    if (segmentationMode !== "ai" || isAiLoaded) return;

    const initSelfieSegmentation = () => {
      try {
        const selfieSegmentation = new window.SelfieSegmentation({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
        });

        selfieSegmentation.setOptions({
          modelSelection: 1, // 1 = landscape/faster (best performance for live preview)
        });

        selfieSegmentation.onResults((results: any) => {
          if (!resultCanvasRef.current || !hiddenCanvasRef.current || isPausedRef.current) return;

          const resCanvas = resultCanvasRef.current;
          const hidCanvas = hiddenCanvasRef.current;
          const videoWidth = results.image.width;
          const videoHeight = results.image.height;

          if (resCanvas.width !== videoWidth) {
            resCanvas.width = videoWidth;
            resCanvas.height = videoHeight;
            hidCanvas.width = videoWidth;
            hidCanvas.height = videoHeight;
          }

          const sourceCtx = hidCanvas.getContext("2d", { willReadFrequently: true });
          const targetCtx = resCanvas.getContext("2d");

          if (!sourceCtx || !targetCtx) return;

          // 1. Draw the selected background onto target canvas
          if (currentBgImage) {
            const bgRatio = currentBgImage.naturalWidth / currentBgImage.naturalHeight;
            const canvasRatio = videoWidth / videoHeight;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (canvasRatio > bgRatio) {
              drawWidth = videoWidth;
              drawHeight = videoWidth / bgRatio;
              offsetX = 0;
              offsetY = (videoHeight - drawHeight) / 2;
            } else {
              drawWidth = videoHeight * bgRatio;
              drawHeight = videoHeight;
              offsetX = (videoWidth - drawWidth) / 2;
              offsetY = 0;
            }
            targetCtx.clearRect(0, 0, videoWidth, videoHeight);
            targetCtx.drawImage(currentBgImage, offsetX, offsetY, drawWidth, drawHeight);
          } else {
            targetCtx.clearRect(0, 0, videoWidth, videoHeight);
          }

          // 2. Prepare the cropped human silhouette on sourceCtx
          sourceCtx.clearRect(0, 0, videoWidth, videoHeight);

          // Draw the camera video frame (mirrored)
          sourceCtx.save();
          sourceCtx.translate(videoWidth, 0);
          sourceCtx.scale(-1, 1);
          sourceCtx.drawImage(results.image, 0, 0, videoWidth, videoHeight);
          sourceCtx.restore();

          // Apply the segmentation mask (mirrored) using destination-in operation
          sourceCtx.save();
          sourceCtx.translate(videoWidth, 0);
          sourceCtx.scale(-1, 1);
          sourceCtx.globalCompositeOperation = "destination-in";
          sourceCtx.drawImage(results.segmentationMask, 0, 0, videoWidth, videoHeight);
          sourceCtx.restore();

          // 3. Composite foreground on top of background
          targetCtx.drawImage(hidCanvas, 0, 0, videoWidth, videoHeight);
        });

        selfieSegmentationRef.current = selfieSegmentation;
        setIsAiLoaded(true);
      } catch (err) {
        console.error("Failed to initialize SelfieSegmentation:", err);
      }
    };

    if (window.SelfieSegmentation) {
      initSelfieSegmentation();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js";
    script.async = true;
    script.onload = () => {
      initSelfieSegmentation();
    };
    script.onerror = (e) => {
      console.error("Failed to load MediaPipe SelfieSegmentation script:", e);
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [segmentationMode, isAiLoaded, setIsAiLoaded, resultCanvasRef, hiddenCanvasRef, currentBgImage]);

  useEffect(() => {
    const renderFrame = async () => {
      if (!webcamRef.current || !hiddenCanvasRef.current || !resultCanvasRef.current) {
        animationFrameId.current = requestAnimationFrame(renderFrame);
        return;
      }

      const video = webcamRef.current.video;
      if (!video || video.readyState < 2) {
        animationFrameId.current = requestAnimationFrame(renderFrame);
        return;
      }

      if (segmentationMode === "ai") {
        if (selfieSegmentationRef.current && isAiLoaded && !isPaused) {
          try {
            await selfieSegmentationRef.current.send({ image: video });
          } catch (err) {
            console.error("MediaPipe frame send failed:", err);
          }
        }
        animationFrameId.current = requestAnimationFrame(renderFrame);
      } else {
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        const resCanvas = resultCanvasRef.current;
        const hidCanvas = hiddenCanvasRef.current;

        if (resCanvas.width !== videoWidth) {
          resCanvas.width = videoWidth;
          resCanvas.height = videoHeight;
          hidCanvas.width = videoWidth;
          hidCanvas.height = videoHeight;
        }

        const sourceCtx = hidCanvas.getContext("2d", { willReadFrequently: true });
        const targetCtx = resCanvas.getContext("2d");

        if (sourceCtx && targetCtx) {
          applyChromaKey(
            sourceCtx, 
            targetCtx, 
            video, 
            currentBgImage, 
            videoWidth, 
            videoHeight, 
            keyColor,
            tolerance
          );
        }
        animationFrameId.current = requestAnimationFrame(renderFrame);
      }
    };

    if (!isPaused) {
      animationFrameId.current = requestAnimationFrame(renderFrame);
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [webcamRef, hiddenCanvasRef, resultCanvasRef, currentBgImage, keyColor, tolerance, isPaused, segmentationMode, isAiLoaded]);
}
