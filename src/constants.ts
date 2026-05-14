import type { RGB } from "./lib/chromaKey";

export const DEFAULT_TOLERANCE = 70;
export const DEFAULT_KEY_COLOR: RGB = { r: 40, g: 200, b: 40 };
export const DEFAULT_ADMIN_PASSWORD = "toto";

export const STORAGE_KEYS = {
  TOLERANCE: "photobooth_tolerance",
  KEY_COLOR: "photobooth_key_color",
  ADMIN_PASSWORD: "photobooth_admin_password",
} as const;
