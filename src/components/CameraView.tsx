import { useState, useCallback, type RefObject } from "react";
import { Camera, SlidersHorizontal, Pipette, Settings, Lock, Key, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Webcam from "react-webcam";
import type { RGB } from "@/lib/chromaKey";
import { cn } from "@/lib/utils";

interface CameraViewProps {
  webcamRef: RefObject<Webcam | null>;
  resultCanvasRef: RefObject<HTMLCanvasElement | null>;
  countdown: number | null;
  startCountdown: () => void;
  tolerance: number;
  setTolerance: (val: number) => void;
  keyColor: RGB;
  setKeyColor: (color: RGB) => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  adminPassword: string;
  setAdminPassword: (val: string) => void;
  capturedPhoto?: string | null;
  onValidate?: () => void;
  onRetake?: () => void;
}

export function CameraView({
  webcamRef,
  resultCanvasRef,
  countdown,
  startCountdown,
  tolerance,
  setTolerance,
  keyColor,
  setKeyColor,
  isAdmin,
  setIsAdmin,
  adminPassword,
  setAdminPassword,
  capturedPhoto,
  onValidate,
  onRetake,
}: CameraViewProps) {
  const [isPipetteActive, setIsPipetteActive] = useState(false);

  // --- Handlers ---

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPipetteActive || !resultCanvasRef.current || !webcamRef.current) return;

    const video = webcamRef.current.video;
    if (!video) return;

    const canvas = resultCanvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const xRatio = (e.clientX - rect.left) / rect.width;
    const yRatio = (e.clientY - rect.top) / rect.height;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const pixelX = Math.floor(xRatio * tempCanvas.width);
      const pixelY = Math.floor(yRatio * tempCanvas.height);
      const pixel = ctx.getImageData(pixelX, pixelY, 1, 1).data;

      setKeyColor({
        r: pixel[0],
        g: pixel[1],
        b: pixel[2],
      });
      setIsPipetteActive(false);
    }
  }, [isPipetteActive, resultCanvasRef, webcamRef, setKeyColor]);

  const handleAdminToggle = useCallback(() => {
    if (isAdmin) {
      setIsAdmin(false);
      setIsPipetteActive(false);
    } else {
      const password = window.prompt("Mot de passe requis :");
      if (password === adminPassword) {
        setIsAdmin(true);
      } else if (password !== null) {
        alert("Mot de passe incorrect");
      }
    }
  }, [isAdmin, adminPassword, setIsAdmin]);

  const togglePipette = useCallback(() => {
    setIsPipetteActive(prev => !prev);
  }, []);

  return (
    <div className="w-full lg:w-3/4 h-full flex flex-col gap-4">
      {/* --- Header Section --- */}
      <CardHeader className="p-0 border-b border-neutral-800 pb-4 shrink-0 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-3xl font-bold flex items-center gap-3 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            <Camera className="w-8 h-8 text-emerald-400" />
            Immortalisez votre aventure !
          </CardTitle>
          <CardDescription className="text-neutral-400 text-lg">
            Choisissez le décor dans lequel vous souhaitez apparaître, puis cliquez sur l’appareil photo. Vous aurez ensuite 5 secondes pour prendre la pose… sourire éclatant ou grimace rigolote, à vous de choisir !
          </CardDescription>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="flex items-center gap-3 pr-2 border-r border-neutral-800 mr-2">
              <div
                className="w-10 h-10 rounded-full border-2 border-neutral-700 shadow-inner"
                style={{ backgroundColor: `rgb(${keyColor.r}, ${keyColor.g}, ${keyColor.b})` }}
                title="Couleur sélectionnée"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={togglePipette}
                className={cn(
                  "rounded-full transition-all duration-300",
                  isPipetteActive
                    ? "bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    : "bg-neutral-800 text-neutral-400 hover:text-white border-neutral-700"
                )}
              >
                <Pipette className="w-5 h-5" />
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleAdminToggle}
            className={cn(
              "rounded-full transition-all duration-300",
              isAdmin ? "text-emerald-500 hover:bg-emerald-500/10" : "text-neutral-600 hover:text-neutral-400"
            )}
          >
            {isAdmin ? <Lock className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
          </Button>
        </div>
      </CardHeader>

      {/* --- Main Viewport --- */}
      <div className="relative flex-1 min-h-0 bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shadow-inner group">
        <canvas
          ref={resultCanvasRef}
          onClick={handleCanvasClick}
          className={cn(
            "w-full h-full object-cover transition-transform duration-700 ease-out",
            isPipetteActive ? "cursor-crosshair scale-100" : "group-hover:scale-105"
          )}
        />

        {isPipetteActive && (
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-500/50 text-emerald-400 text-xs font-bold animate-pulse shadow-2xl">
            Mode Pipette : Cliquez sur le fond vert
          </div>
        )}

        {countdown !== null ? (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[2px]">
            <span className="text-9xl font-black text-white drop-shadow-[0_0_20px_rgba(16,185,129,0.8)] tabular-nums animate-pulse">
              {countdown}
            </span>
          </div>
        ) : capturedPhoto ? (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-12 animate-in fade-in duration-500">
            <div className="flex gap-6 items-center">
              <Button
                onClick={onRetake}
                variant="secondary"
                size="lg"
                className="h-16 px-8 rounded-2xl text-xl font-bold bg-neutral-800/80 hover:bg-neutral-700 text-white shadow-xl hover:scale-105 transition-all border border-neutral-700"
              >
                <RefreshCw className="w-6 h-6 mr-3" />
                Reprendre la photo
              </Button>
              <Button
                onClick={onValidate}
                size="lg"
                className="h-16 px-8 rounded-2xl text-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-105 transition-all border-none"
              >
                <Check className="w-6 h-6 mr-3" />
                Valider la photo
              </Button>
            </div>
          </div>
        ) : (
          !isPipetteActive && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-12 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
              <Button
                onClick={startCountdown}
                size="lg"
                className="rounded-full w-24 h-24 bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.5)] transition-all active:scale-90 border-none group/btn"
              >
                <Camera className="w-12 h-12 text-white transition-transform group-hover/btn:scale-110" />
              </Button>
            </div>
          )
        )}
      </div>

      {/* --- Admin Panel --- */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-neutral-900/50 border border-neutral-800 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-xl">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-neutral-500 mb-1">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Traitement Image</span>
            </div>
            <div className="flex items-center gap-4 bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50">
              <span className="text-sm font-medium text-neutral-400 w-24">Sensibilité</span>
              <input
                type="range"
                min="10"
                max="150"
                step="1"
                value={tolerance}
                onChange={(e) => setTolerance(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-colors"
              />
              <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded min-w-[32px] text-center">{Math.round(tolerance)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-neutral-500 mb-1">
              <Key className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Sécurité</span>
            </div>
            <div className="flex items-center gap-4 bg-neutral-950/50 p-3 rounded-lg border border-neutral-800/50">
              <span className="text-sm font-medium text-neutral-400 w-24">Accès Admin</span>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-neutral-900 border-neutral-800 text-neutral-200 h-9 px-3 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="Nouveau mot de passe"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-tighter text-neutral-600 font-bold pointer-events-none bg-neutral-900 px-1">
                  Private
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
