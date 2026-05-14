import { useState, useEffect } from "react";

export const BACKGROUNDS = [
  { id: "cyberpunk", name: "Cyberpunk City", src: "/backgrounds/cyberpunk.png" },
  { id: "tropical", name: "Tropical Beach", src: "/backgrounds/tropical.png" },
  { id: "forest", name: "Magical Forest", src: "/backgrounds/forest.png" },
  { id: "scifi", name: "Space Station", src: "/backgrounds/scifi.png" },
];

export function useBackgrounds(initialBgId: string | null = BACKGROUNDS[0].id) {
  const [selectedBgId, setSelectedBgId] = useState<string | null>(initialBgId);
  const [bgImages, setBgImages] = useState<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    const images: Record<string, HTMLImageElement> = {};
    BACKGROUNDS.forEach((bg) => {
      const img = new Image();
      img.src = bg.src;
      img.crossOrigin = "anonymous";
      img.onload = () => {
        images[bg.id] = img;
        setBgImages((prev) => ({ ...prev, [bg.id]: img }));
      };
    });
  }, []);

  const currentBgImage = selectedBgId ? bgImages[selectedBgId] : null;

  return { 
    selectedBgId, 
    setSelectedBgId, 
    currentBgImage, 
    backgroundsList: BACKGROUNDS 
  };
}
