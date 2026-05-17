import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { Card } from "@/components/ui/card";

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 flex flex-col items-center justify-center space-y-8 bg-neutral-900/50 backdrop-blur-xl border-neutral-800 shadow-2xl rounded-3xl">
        <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center">
          <Camera className="w-12 h-12 text-blue-500" />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-neutral-100">Immortalisez votre aventure !</h1>
          <p className="text-neutral-400">Photographiez-vous devant le portail qui mène au monde des jeux.</p>
        </div>

        <button
          onClick={() => navigate("/instructions")}
          className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold text-lg transition-all active:scale-95 shadow-lg shadow-blue-500/25"
        >
          Commencer
        </button>
      </Card>
    </div>
  );
}
