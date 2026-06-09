import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Database, Lock, Mail, KeyRound, RefreshCw, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { DEFAULT_ADMIN_PASSWORD, STORAGE_KEYS } from "@/constants";

export function Home() {
  const navigate = useNavigate();

  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState("");

  const requestFullscreen = () => {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Unable to request fullscreen:", err);
      });
    }
  };

  const handleStart = () => {
    requestFullscreen();
    navigate("/instructions");
  };

  const handleOpenDataDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoginEmail("");
    setPassword("");
    setAuthError("");
    setShowAuthDialog(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthenticating(true);
    try {
      if (!loginEmail.trim()) {
        const activePassword = localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD) || DEFAULT_ADMIN_PASSWORD;
        if (password === activePassword) {
          sessionStorage.setItem("admin_data_authenticated", "true");
          setShowAuthDialog(false);
          navigate("/data");
          return;
        } else {
          setAuthError("Mot de passe incorrect (ou saisissez un e-mail pour vous connecter via Supabase).");
          return;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password,
      });

      if (error) throw error;

      if (data?.user) {
        sessionStorage.setItem("admin_data_authenticated", "true");
        setShowAuthDialog(false);
        navigate("/data");
      } else {
        setAuthError("Échec de l'authentification.");
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Erreur de connexion.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div 
      onClick={requestFullscreen} 
      className="min-h-screen flex flex-col items-center justify-center p-4 cursor-pointer"
    >
      <Card className="w-full max-w-md p-8 flex flex-col items-center justify-center space-y-8 bg-neutral-900/50 backdrop-blur-xl border-neutral-800 shadow-2xl rounded-3xl">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center">
          <Camera className="w-12 h-12 text-emerald-500" />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-neutral-100">Immortalisez votre aventure !</h1>
          <p className="text-neutral-400">Photographiez-vous devant le portail qui mène au monde des jeux.</p>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-semibold text-lg transition-all active:scale-95 shadow-lg shadow-emerald-500/25 border-none"
        >
          Commencer
        </button>

        <button
          onClick={handleOpenDataDialog}
          className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors border-none bg-transparent cursor-pointer"
        >
          <Database className="w-3.5 h-3.5" />
          Accès données admin
        </button>
      </Card>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100 rounded-2xl max-w-sm">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/20">
              <Lock className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center text-xl font-bold text-neutral-100">
              Portail d'Administration
            </DialogTitle>
            <DialogDescription className="text-center text-neutral-400">
              Accès sécurisé aux données de l'application
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-500" />
                Adresse e-mail
              </label>
              <Input
                type="email"
                placeholder="admin@votredomaine.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="bg-neutral-950/50 border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 h-11 rounded-xl"
                autoFocus
              />
              <p className="text-[10px] text-neutral-500">
                Laissez vide pour utiliser le mot de passe local.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-500" />
                Mot de passe
              </label>
              <Input
                type="password"
                placeholder="Entrez le mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-neutral-950/50 border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 h-11 rounded-xl"
              />
            </div>

            {authError && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-11 rounded-xl transition-all shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
