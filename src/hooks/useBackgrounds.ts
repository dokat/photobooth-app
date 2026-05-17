import { useState, useEffect } from "react";

export const BACKGROUNDS = [
  { id: "donkeykong", name: "Donkey Kong", src: `${import.meta.env.BASE_URL}/backgrounds/DonkeyKong.jpg` },
  { id: "laracroft", name: "Lara Croft", src: `${import.meta.env.BASE_URL}/backgrounds/LaraCroft.jpg` },
  { id: "minecraft", name: "Minecraft", src: `${import.meta.env.BASE_URL}/backgrounds/Minecraft.jpg` },
  { id: "rayman", name: "Rayman", src: `${import.meta.env.BASE_URL}/backgrounds/Rayman.jpeg` },
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
