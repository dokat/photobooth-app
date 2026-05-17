import { ArrowRight } from "lucide-react";
import { Card } from "./ui/card";
import { useNavigate } from "react-router-dom";

export function Instructions() {
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-950">
            <Card className="w-full max-w-md p-8 flex flex-col items-center justify-center space-y-8 bg-neutral-900/50 backdrop-blur-xl border-neutral-800 shadow-2xl rounded-3xl text-lg text-neutral-400">
                <p className=" mb-6">Choisissez le décor dans lequel vous souhaitez apparaître, puis cliquez sur l’appareil photo.
                    Vous aurez ensuite 5 secondes pour prendre la pose… sourire éclatant ou grimace rigolote, à vous de choisir !</p>

                <p>Une fois votre photo validée, entrez votre adresse mail pour la recevoir.</p>
                <button
                    onClick={() => navigate("/photobooth")}
                    className="w-full flex items-center gap-2 justify-center py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold text-lg transition-all active:scale-95 shadow-lg shadow-blue-500/25"
                >
                    Continuer <ArrowRight />
                </button>
            </Card>
        </div>
    );
}