import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useShareLogic } from "@/hooks/useShareLogic";

interface ShareScreenProps {
  capturedPhoto: string;
  resetPhoto: () => void;
}

export function ShareScreen({ capturedPhoto, resetPhoto }: ShareScreenProps) {
  const {
    email,
    setEmail,
    isSending,
    sendSuccess,
    setSendSuccess,
    allowEmailStorage,
    setAllowEmailStorage,
    allowPhotoStorage,
    setAllowPhotoStorage,
    handleSendEmail
  } = useShareLogic(capturedPhoto);

  return (
    <div className="flex flex-col flex-1 p-6 md:p-12 pb-48 md:pb-12 h-full w-full justify-center">
      <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center flex-1 w-full max-w-[1600px] mx-auto">
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
                className="w-full h-16 bg-neutral-950 border-2 border-neutral-800 rounded-2xl pl-5 pr-32 text-lg text-white placeholder:text-neutral-600 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
              <Button
                onClick={handleSendEmail}
                disabled={isSending || !email}
                className={`absolute right-2 top-2 h-12 px-6 rounded-xl text-white font-medium shadow-xl transition-all ${sendSuccess ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-emerald-500 hover:bg-emerald-400'
                  }`}
              >
                {isSending ? <Loader2 className="animate-spin w-5 h-5" /> : (sendSuccess ? "Envoyé" : "Envoyer")}
              </Button>
            </div>
            {sendSuccess && (
              <p className="text-emerald-400 text-sm font-medium pl-2">Email envoyé avec succès !</p>
            )}
          </div>

          <div className="space-y-3 mb-10">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="allowEmail"
                checked={allowEmailStorage}
                onCheckedChange={(checked) => setAllowEmailStorage(checked === true)}
                className="mt-1 border-neutral-700 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
              />
              <label
                htmlFor="allowEmail"
                className="text-sm text-neutral-400 font-medium leading-tight cursor-pointer hover:text-neutral-300 transition-colors"
              >
                J'autorise le musée à conserver mon adresse email
              </label>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox
                id="allowPhoto"
                checked={allowPhotoStorage}
                onCheckedChange={(checked) => setAllowPhotoStorage(checked === true)}
                className="mt-1 border-neutral-700 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
              />
              <label
                htmlFor="allowPhoto"
                className="text-sm text-neutral-400 font-medium leading-tight cursor-pointer hover:text-neutral-300 transition-colors"
              >
                J'autorise le musée à conserver ma photo
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={() => { setSendSuccess(false); resetPhoto(); }} variant="secondary" size="lg" className="flex-1 h-14 rounded-2xl border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-lg font-medium shadow-none">
              <RefreshCw className="mr-2 w-5 h-5" /> Reprendre
            </Button>
          </div>
        </div>
      </div>

      {/* Virtual Keyboard Spacer (only applies for tall screens/tablets if needed) */}
      <div className="h-64 md:h-12 w-full shrink-0 pointer-events-none" aria-hidden="true" />
    </div>
  );
}
