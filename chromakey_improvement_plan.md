# Plan d'Amélioration de la Qualité du Chroma Key

Ce document présente les limites du système actuel de chroma key et propose une solution technique pour obtenir un détourage de qualité professionnelle, résistant aux ombres et sans bordures crénelées ou halos verts.

---

## 1. Analyse du Système Actuel (Limites de l'RGB)

Le code actuel utilise la **distance euclidienne dans l'espace colorimétrique RGB** :

```typescript
const dr = r - keyColor.r;
const dg = g - keyColor.g;
const db = b - keyColor.b;
const distance = Math.sqrt(dr * dr + dg * dg + db * db);

if (distance < tolerance) {
  frame.data[i + 3] = 0; // Alpha à 0
}
```

### Problèmes de cette approche :
1. **Sensibilité aux ombres** : Une ombre projetée sur le fond vert réduit sa luminosité ($R, G, B$ diminuent proportionnellement). La distance en RGB devient alors très grande, et le fond vert ombragé n'est plus détouré.
2. **Contours "crénelés" (Aliasing)** : La transition est binaire (soit opaque, soit transparent). Cela crée des bords pixélisés, peu professionnels, en particulier autour des cheveux et des vêtements.
3. **Halo vert (Green Spill)** : La lumière verte réfléchie par le fond vert sur le sujet (épaules, cheveux, vêtements) n'est pas traitée, laissant un contour vert artificiel.

---

## 2. Solution Proposée : L'Algorithme de Qualité Diffuseur

Nous allons implémenter trois améliorations majeures :

### A. Passage à l'Espace Colorimétrique YCbCr
L'espace YCbCr sépare la **luminance (Y)** de la **chrominance (Cb pour le bleu, Cr pour le rouge)**. 
En calculant la distance uniquement dans les canaux de chrominance ($Cb$ et $Cr$), nous pouvons **complètement ignorer les ombres et les variations de lumière** tout en conservant une détection parfaite de la couleur verte.

Formule de conversion :
$$Y = 0.299R + 0.587G + 0.114B$$
$$Cb = 128 - 0.1687R - 0.3313G + 0.5B$$
$$Cr = 128 + 0.5R - 0.4187G - 0.0813B$$

### B. Seuillage Progressif (Soft-Feathering)
Au lieu d'une coupure nette, nous introduisons une zone de transition progressive via une valeur de `smoothness` (douceur).
- Si la distance est inférieure à la tolérance : le pixel est **totalement transparent** ($Alpha = 0$).
- Si la distance est entre la tolérance et la tolérance + douceur : le pixel est **partiellement transparent** ($Alpha$ varie progressivement de $0$ à $255$).
- Sinon : le pixel est **totalement opaque** ($Alpha = 255$).

### C. Suppression Dynamique du Halo (Spill Suppression)
Pour tout pixel proche de la couleur clé qui reste visible, nous atténuons automatiquement le canal dominant (par exemple, le vert) en le rapprochant de la moyenne des deux autres canaux (rouge et bleu). Cela neutralise instantanément les reflets verts indésirables sur les cheveux et les vêtements.

---

## 3. Détail Technique de l'Algorithme Amélioré

Voici à quoi ressemblera le nouveau code dans [chromaKey.ts](file:///home/jonathan/Documents/Workspaces/photobooth-app/src/lib/chromaKey.ts) :

```typescript
// Conversion RGB vers YCbCr
function rgbToYCbCr(r: number, g: number, b: number) {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return { y, cb, cr };
}

export function applyChromaKey(...) {
  // ...
  const keyYCbCr = rgbToYCbCr(keyColor.r, keyColor.g, keyColor.b);
  
  // Identifier le canal dominant de la couleur clé pour une suppression de spill adaptative
  let domKey: 'r' | 'g' | 'b' = 'g';
  if (keyColor.r > keyColor.g && keyColor.r > keyColor.b) {
    domKey = 'r';
  } else if (keyColor.b > keyColor.r && keyColor.b > keyColor.g) {
    domKey = 'b';
  }

  // Adapter l'échelle de tolérance utilisateur à l'espace YCbCr
  const chromaTolerance = tolerance * 0.45;
  const smoothness = 15; // Largeur du dégradé de contour

  for (let i = 0; i < length; i += 4) {
    const r = frame.data[i];
    const g = frame.data[i + 1];
    const b = frame.data[i + 2];

    // Conversion en YCbCr
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

    // Distance de couleur dans le plan de chrominance
    const dCb = cb - keyYCbCr.cb;
    const dCr = cr - keyYCbCr.cr;
    const chromaDistance = Math.sqrt(dCb * dCb + dCr * dCr);

    // Progressive Alpha (Soft-feathering)
    let alpha = 255;
    if (chromaDistance < chromaTolerance) {
      alpha = 0;
    } else if (chromaDistance < chromaTolerance + smoothness) {
      alpha = Math.round(((chromaDistance - chromaTolerance) / smoothness) * 255);
    }

    frame.data[i + 3] = alpha;

    // Suppression intelligente de spill (anti-halo)
    if (alpha > 0) {
      let domVal: number;
      let otherVal1: number;
      let otherVal2: number;
      let domIdx: number;

      if (domKey === 'r') {
        domVal = r; otherVal1 = g; otherVal2 = b; domIdx = i;
      } else if (domKey === 'b') {
        domVal = b; otherVal1 = r; otherVal2 = g; domIdx = i + 2;
      } else {
        domVal = g; otherVal1 = r; otherVal2 = b; domIdx = i + 1;
      }

      const otherAvg = (otherVal1 + otherVal2) / 2;
      
      // Si le canal sélectionné est dominant et proche de la couleur clé
      if (domVal > otherAvg && chromaDistance < chromaTolerance * 2.0) {
        const factor = Math.max(0, Math.min(1, (chromaDistance - chromaTolerance) / chromaTolerance));
        // Estompe la dominance vers la moyenne des deux autres canaux
        frame.data[domIdx] = Math.round(factor * domVal + (1 - factor) * otherAvg);
      }
    }
  }
  // ...
}
```

---

## 4. Bénéfices Attendus
1. **Immunité contre les ombres** : Les ombres sur le fond vert n'apparaissent plus sur la photo finale.
2. **Contours extrêmement doux** : Cheveux et bords de vêtements se fondent naturellement avec le décor d'arrière-plan.
3. **Plus de franges vertes** : Les reflets verts sur les personnes sont éliminés, rendant le photomontage indiscernable d'un vrai décor.
