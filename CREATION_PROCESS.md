# Processus de Création : Green Screen Photobooth App

Ce document retrace toutes les étapes et décisions techniques prises pour passer d'une idée à une application fonctionnelle de photobooth sur tablette.

## 1. Initialisation et Stack Technique
L'objectif initial était de créer une application React avec TypeScript, incluant un environnement de code propre (ESLint, Prettier) et esthétique (Tailwind CSS, shadcn/ui).

- **Outil de Build :** Vite a été utilisé (`create-vite`) en sélectionnant le template React + TypeScript pour des démarrages rapides et un Hot Module Replacement instantané.
- **Ajouts de Dépendances :** 
  - `tailwindcss`, `postcss`, `autoprefixer` pour le système de grille et la mise en forme.
  - Initialisation de `shadcn/ui` en configurant le fichier `components.json` puis en injectant les composants (`Button`, `Card`, `ScrollArea`, `Dialog`).
  - `react-webcam` pour simplifier l'accès à la caméra sur React.
  - `lucide-react` pour les icônes esthétiques.

## 2. Génération des Ressources (Arrière-plans)
Pour répondre à l'exigence "ajouter un fond choisi parmi 4", j'ai utilisé l'outil de génération d'images par IA afin de créer des décorations haute définition adaptées au format horizontal d'une tablette :
1. **Cyberpunk City** : Une ligne d'horizon néon très détaillée.
2. **Tropical Beach** : Un décor vif et lumineux avec palmiers.
3. **Magical Forest** : Une ambiance feutrée fantastique.
4. **Space Station** : Une fenêtre d'observation spatiale de science-fiction.

Ces images ont été copiées avec soin dans le dossier natif de l'application : `/public/backgrounds/`.

## 3. Mise au point de l'Algorithme Chroma Key (Fond Vert)
Plutôt que d'utiliser une solution logicielle lourde ou de passer par un serveur (qui créerait de la latence), le Chroma Key a été entièrement conçu en local (Client-side) grâce aux Canvas HTML5 Javascript :
- Un fichier unitaire `src/lib/chromaKey.ts` a vu le jour.
- **Logique :** À chaque image de la webcam (60 images par seconde tirées par `requestAnimationFrame`), le code récupère l'ensemble des pixels (`getImageData(0, 0, width, height)`). 
- Si un pixel contient une dominante importante de Vert (détecté par le ratio entre les valeurs RGB), son canal Alpha (transparence) devient `0`.
- Ensuite, la fonction dessine d'abord l'arrière-plan classique, puis superpose la vidéo sans ses pixels verts qui a été stockée sur un point de mémoire intermédiaire.

## 4. Design et Typographie (UI/UX)
Destinée à un usage sur Tablette, l'interface graphique obéit à plusieurs règles strictes :
- **Utilisation Plein Écran :** Séparation `grid-cols-4`. 75% du real-estate (3 colonnes) est dédié à la caméra, 25% (1 colonne) rassemble tous les contrôles sous la forme de cartes cliquables.
- **Accessibilité :** Configuration de la caméra (`facingMode: "user"`) pour privilégier la caméra frontale de la tablette par défaut. Le bouton capture est proéminent.
- **Thème Sombre Premium :** Emploi des utilitaires Tailwind `bg-neutral-950` pour imiter l'obscurité d'un plateau photographique, afin de faire ressortir la couleur de l'image.

## 5. Architecture Avancée & Bonnes Pratiques React (Hooks)
Au lieu de conserver un composant `App.tsx` monolithique gérant toute l'orchestration, le code a été refondu vers une stricte séparation des préoccupations avec TypeScript :
- **`useBackgrounds.ts`** : Logique de données, qui s'occupe de la sélection actuelle et du préchargement `onload` des 4 images.
- **`useChromaKeyRender.ts`** : Logique de Canvas, gérant la boucle d'effets `requestAnimationFrame`, la mise en pause silencieuse lors de la capture, et le binding avec `ref`.
- **`usePhotobooth.ts`** : Logique métier statique, exposant la fonction d'extraction `.toDataURL("image/png")` pour immortaliser ou sauvegarder localement le cliché.

Et voilà ! L'application `App.tsx` n'est plus qu'un simple *shell* déclaratif de JSX qui connecte visuellement tous ces éléments modulaires dans son écosystème Vite.
