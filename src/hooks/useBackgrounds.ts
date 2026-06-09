import { useState, useEffect } from "react";

export const BACKGROUNDS = [
  { id: "donkeykong", name: "Donkey Kong", src: `${import.meta.env.BASE_URL}/backgrounds/DonkeyKong.jpg` },
  { id: "laracroft", name: "Tomb Raider", src: `${import.meta.env.BASE_URL}/backgrounds/LaraCroft.jpg` },
  { id: "minecraft", name: "Minecraft", src: `${import.meta.env.BASE_URL}/backgrounds/Minecraft.jpg` },
  { id: "rayman", name: "Rayman", src: `${import.meta.env.BASE_URL}/backgrounds/Rayman.jpeg` },
];

export function useBackgrounds(initialBgId: string | null = BACKGROUNDS[0].id) {
  const [selectedBgId, setSelectedBgId] = useState<string | null>(initialBgId);
  const [bgImages, setBgImages] = useState<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    BACKGROUNDS.forEach((bg) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setBgImages((prev) => ({ ...prev, [bg.id]: img }));
      };
      img.src = bg.src;
      imgs.push(img);
    });
    // Cancel any pending onload callbacks on unmount
    return () => {
      imgs.forEach((img) => { img.onload = null; });
    };
  }, []);

  const currentBgImage = selectedBgId ? bgImages[selectedBgId] : null;

  return {
    selectedBgId,
    setSelectedBgId,
    currentBgImage,
    backgroundsList: BACKGROUNDS
  };
}
