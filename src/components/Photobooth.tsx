import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Card } from "@/components/ui/card";

import { useBackgrounds } from "@/hooks/useBackgrounds";
import { usePhotobooth } from "@/hooks/usePhotobooth";
import { useChromaKeyRender } from "@/hooks/useChromaKeyRender";
import { useLocalStorage } from "@/hooks/useLocalStorage";

import { CameraView } from "@/components/CameraView";
import { BackgroundSelector } from "@/components/BackgroundSelector";
import { ShareScreen } from "@/components/ShareScreen";
import type { RGB } from "@/lib/chromaKey";
import {
  DEFAULT_TOLERANCE,
  DEFAULT_KEY_COLOR,
  DEFAULT_ADMIN_PASSWORD,
  STORAGE_KEYS
} from "@/constants";

export function Photobooth() {
  const webcamRef = useRef<Webcam | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isValidated, setIsValidated] = useState(false);

  // Persisted settings
  const [tolerance, setTolerance] = useLocalStorage(STORAGE_KEYS.TOLERANCE, DEFAULT_TOLERANCE);
  const [keyColor, setKeyColor] = useLocalStorage<RGB>(STORAGE_KEYS.KEY_COLOR, DEFAULT_KEY_COLOR);
  const [adminPassword, setAdminPassword] = useLocalStorage(STORAGE_KEYS.ADMIN_PASSWORD, DEFAULT_ADMIN_PASSWORD);

  // Custom Hooks
  const { selectedBgId, setSelectedBgId, currentBgImage, backgroundsList } = useBackgrounds();
  const { capturedPhoto, startCountdown, countdown, resetPhoto } = usePhotobooth(resultCanvasRef);

  // Hook for real-time video compositing
  useChromaKeyRender({
    webcamRef,
    hiddenCanvasRef,
    resultCanvasRef,
    currentBgImage,
    keyColor,
    tolerance,
    isPaused: !!capturedPhoto,
  });

  const handleStartCountdown = useCallback(() => {
    startCountdown();
  }, [startCountdown]);

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-neutral-100 flex flex-col items-center justify-center relative">

      {/* Hidden system components */}
      <Webcam
        ref={webcamRef}
        audio={false}
        videoConstraints={{
          facingMode: "user",
          width: { ideal: 3840 },
          height: { ideal: 2160 }
        }}
        className="opacity-0 absolute pointer-events-none w-px h-px"
      />
      <canvas ref={hiddenCanvasRef} className="opacity-0 absolute pointer-events-none w-px h-px" />

      {!capturedPhoto || !isValidated ? (
        <div className="absolute inset-0 z-10 p-4 md:p-8 flex w-full h-full">
          <Card className="flex flex-col lg:flex-row w-full h-full shadow-2xl border-neutral-800 bg-neutral-900/50 backdrop-blur-xl overflow-hidden rounded-3xl p-6 gap-6">

            <BackgroundSelector
              backgroundsList={backgroundsList}
              selectedBgId={selectedBgId}
              setSelectedBgId={setSelectedBgId}
              disabled={!!capturedPhoto}
            />
            <CameraView
              webcamRef={webcamRef}
              resultCanvasRef={resultCanvasRef}
              countdown={countdown}
              startCountdown={handleStartCountdown}
              tolerance={tolerance}
              setTolerance={setTolerance}
              keyColor={keyColor}
              setKeyColor={setKeyColor}
              isAdmin={isAdmin}
              setIsAdmin={setIsAdmin}
              adminPassword={adminPassword}
              setAdminPassword={setAdminPassword}
              capturedPhoto={capturedPhoto}
              onValidate={() => setIsValidated(true)}
              onRetake={() => {
                resetPhoto();
                setIsValidated(false);
              }}
            />
          </Card>
        </div>
      ) : (
        <div className="absolute inset-0 z-50 bg-neutral-950 flex flex-col w-full h-full p-4 md:p-12 overflow-y-auto">
          <ShareScreen capturedPhoto={capturedPhoto} />
        </div>
      )}
    </div>
  );
}
