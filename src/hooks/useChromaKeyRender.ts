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
}

export function useChromaKeyRender({
  webcamRef,
  hiddenCanvasRef,
  resultCanvasRef,
  currentBgImage,
  keyColor,
  tolerance,
  isPaused,
}: UseChromaKeyProps) {
  const animationFrameId = useRef<number | undefined>(undefined);

  useEffect(() => {
    const renderFrame = () => {
      if (!webcamRef.current || !hiddenCanvasRef.current || !resultCanvasRef.current) {
        animationFrameId.current = requestAnimationFrame(renderFrame);
        return;
      }

      const video = webcamRef.current.video;
      if (!video || video.readyState < 2) {
        animationFrameId.current = requestAnimationFrame(renderFrame);
        return;
      }

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
    };

    if (!isPaused) {
      animationFrameId.current = requestAnimationFrame(renderFrame);
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [webcamRef, hiddenCanvasRef, resultCanvasRef, currentBgImage, keyColor, tolerance, isPaused]);
}
