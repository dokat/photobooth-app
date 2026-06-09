import { useState, useCallback, useRef, useEffect } from "react";
import type { RefObject } from "react";

export function usePhotobooth(resultCanvasRef: RefObject<HTMLCanvasElement | null>) {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Ref to check running state without adding `countdown` to startCountdown deps
  const isCountingRef = useRef(false);

  const capturePhoto = useCallback(() => {
    if (resultCanvasRef.current) {
      const photoDataUrl = resultCanvasRef.current.toDataURL("image/png");
      setCapturedPhoto(photoDataUrl);
    }
  }, [resultCanvasRef]);

  const startCountdown = useCallback(() => {
    if (isCountingRef.current) return; // Prevent multiple clicks
    isCountingRef.current = true;
    setCountdown(5);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          isCountingRef.current = false;
          capturePhoto();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [capturePhoto]); // `countdown` no longer needed — tracked via ref

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const resetPhoto = useCallback(() => {
    setCapturedPhoto(null);
    setCountdown(null);
    isCountingRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  return { capturedPhoto, capturePhoto, startCountdown, countdown, resetPhoto };
}
