import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

export function Success() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown === 0) {
      navigate("/");
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 animate-in fade-in duration-500">
      <div className="flex flex-col items-center justify-center max-w-xl text-center space-y-8 bg-neutral-900/50 p-12 rounded-3xl border border-neutral-800 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Progress bar at the top of the card */}
        <div className="absolute top-0 left-0 h-1 bg-emerald-500 transition-all duration-1000 ease-linear" style={{ width: `${(countdown / 5) * 100}%` }} />

        <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-2">
          <Check className="w-12 h-12" />
        </div>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Bravo !
        </h2>
        <p className="text-neutral-400 text-lg leading-relaxed">
          Votre photo a traversé le portail des jeux… Elle arrive bientôt dans votre boîte mail !<br />
        </p>
        <p className="text-neutral-400 text-lg leading-relaxed mb-4">L’équipe du musée vous remercie de votre visite !</p>

        <div className="text-neutral-500 text-sm font-medium animate-pulse">
          Retour à l'accueil dans {countdown} seconde{countdown > 1 ? "s" : ""}...
        </div>
      </div>
    </div>
  );
}
