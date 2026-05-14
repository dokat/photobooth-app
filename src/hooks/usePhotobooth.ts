import { useState, useCallback, useRef, useEffect } from "react";
import type { RefObject } from "react";

export function usePhotobooth(resultCanvasRef: RefObject<HTMLCanvasElement | null>) {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const capturePhoto = useCallback(() => {
    if (resultCanvasRef.current) {
      const photoDataUrl = resultCanvasRef.current.toDataURL("image/png");
      setCapturedPhoto(photoDataUrl);
    }
  }, [resultCanvasRef]);

  const startCountdown = useCallback(() => {
    if (countdown !== null) return; // Prevent multiple clicks
    setCountdown(5);
    
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          capturePhoto();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [capturePhoto, countdown]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const resetPhoto = useCallback(() => {
    setCapturedPhoto(null);
    setCountdown(null);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  return { capturedPhoto, capturePhoto, startCountdown, countdown, resetPhoto };
}
