import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Background {
  id: string;
  name: string;
  src: string;
}

interface BackgroundSelectorProps {
  backgroundsList: Background[];
  selectedBgId: string | null;
  setSelectedBgId: (id: string | null) => void;
  disabled?: boolean;
}

export function BackgroundSelector({
  backgroundsList,
  selectedBgId,
  setSelectedBgId,
  disabled,
}: BackgroundSelectorProps) {
  return (
    <div className="w-full lg:w-1/4 border-t lg:border-t-0 lg:border-l border-neutral-800/50 pt-6 lg:pt-0 lg:pl-6 flex flex-col h-full min-h-0">
      <ScrollArea className={cn("flex-1 pr-4 -mr-4 h-full transition-opacity duration-300", disabled && "opacity-50 pointer-events-none")}>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          {backgroundsList.map((bg) => (
            <button
              key={bg.id}
              onClick={() => setSelectedBgId(bg.id)}
              className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all duration-300 ${selectedBgId === bg.id
                ? "border-emerald-500 ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/20 scale-100"
                : "border-neutral-800 opacity-60 hover:opacity-100 hover:border-neutral-600 scale-95 hover:scale-100"
                } cursor-pointer`}
            >
              <img src={bg.src} alt={bg.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                <span className="text-sm font-medium text-white truncate w-full text-left drop-shadow-md">
                  {bg.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
