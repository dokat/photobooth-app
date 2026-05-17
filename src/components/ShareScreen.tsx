import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useShareLogic } from "@/hooks/useShareLogic";

interface ShareScreenProps {
  capturedPhoto: string;
}

export function ShareScreen({ capturedPhoto }: ShareScreenProps) {
  const {
    email,
    setEmail,
    isSending,
    sendSuccess,
    allowEmailStorage,
    setAllowEmailStorage,
    allowPhotoStorage,
    setAllowPhotoStorage,
    handleSendEmail,
    isValidEmail
  } = useShareLogic(capturedPhoto);

  const navigate = useNavigate();

  useEffect(() => {
    if (sendSuccess) {
      navigate('/success', { state: { email } });
    }
  }, [sendSuccess, navigate, email]);

  return (
    <div className="flex flex-col flex-1 p-6 md:p-12 pb-48 md:pb-12 h-full w-full justify-center">
      <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center flex-1 w-full max-w-[1800px] mx-auto">
        {/* Left Column: Photo Preview */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center">
          <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-neutral-800/50 bg-neutral-950">
            <img src={capturedPhoto} alt="Captured" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Right Column: Descriptions & Actions */}
        <div className="w-full md:w-1/2 flex flex-col justify-center max-w-2xl">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Magnifique !</span>
          </h2>

          <p className="text-neutral-400 text-lg mb-10 leading-relaxed">
            Votre souvenir est prêt. Entrez votre adresse e-mail pour le recevoir instantanément dans votre boîte de réception.
          </p>

          <div className="space-y-4 mb-10">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className={`w-full h-16 bg-neutral-950 border-2 rounded-2xl px-5 text-lg text-white placeholder:text-neutral-600 focus:ring-4 outline-none transition-all ${email && !isValidEmail
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                    : "border-neutral-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                  }`}
              />
            </div>
            {email && !isValidEmail && (
              <p className="text-red-400 text-sm font-medium pl-2">Veuillez saisir une adresse e-mail valide.</p>
            )}
          </div>

          <div className="space-y-6 mb-10">
            <div className="flex flex-col space-y-3">
              <span className="text-sm text-neutral-400 font-medium leading-tight">
                Je souhaite recevoir les actualités du musée
              </span>
              <div className="flex gap-6">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="allowEmail"
                    checked={allowEmailStorage === true}
                    onChange={() => setAllowEmailStorage(true)}
                    className="w-5 h-5 accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-300 group-hover:text-white transition-colors font-medium">Oui</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="allowEmail"
                    checked={allowEmailStorage === false}
                    onChange={() => setAllowEmailStorage(false)}
                    className="w-5 h-5 accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-300 group-hover:text-white transition-colors font-medium">Non</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <span className="text-sm text-neutral-400 font-medium leading-tight">
                J’autorise le musée du château de Mayenne (service de Mayenne Communauté) à utiliser ma photo pour sa communication
              </span>
              <div className="flex gap-6">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="allowPhoto"
                    checked={allowPhotoStorage === true}
                    onChange={() => setAllowPhotoStorage(true)}
                    className="w-5 h-5 accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-300 group-hover:text-white transition-colors font-medium">Oui</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="allowPhoto"
                    checked={allowPhotoStorage === false}
                    onChange={() => setAllowPhotoStorage(false)}
                    className="w-5 h-5 accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-sm text-neutral-300 group-hover:text-white transition-colors font-medium">Non</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleSendEmail}
              disabled={isSending || !isValidEmail || allowEmailStorage === null || allowPhotoStorage === null}
              size="lg"
              className="flex-1 h-16 rounded-2xl text-xl font-bold shadow-xl transition-all bg-emerald-500 hover:bg-emerald-400 text-white"
            >
              {isSending ? <Loader2 className="animate-spin w-6 h-6 mr-3" /> : null}
              Envoyer ma photo
            </Button>
          </div>
        </div>
      </div>

      {/* Virtual Keyboard Spacer (only applies for tall screens/tablets if needed) */}
      <div className="h-64 md:h-12 w-full shrink-0 pointer-events-none" aria-hidden="true" />
    </div>
  );
}
