# Audit performance & plan de corrections

Vérification préalable : `.env` n'est **pas** suivi par git (seul `.env.example` l'est, ce qui est correct). Le fichier apparaissant sur GitHub est probablement `.env.example`.

## Constats principaux

Bonnes bases déjà en place :
- Toutes les routes publiques sont SSR (loader + `ensureQueryData` + `useSuspenseQuery`).
- Aucun composant admin (`src/components/admin/*`) n'est importé depuis une route publique -> bundle admin correctement isolé.
- Lucide utilisé en imports nommés (tree-shakeable), pas de barrel `import *`.
- URLs signées générées à l'upload (10 ans), aucun coût de signature runtime pour les visiteurs.
- YouTube iframes déjà en `loading="lazy"` avec `aspect-video` réservé.
- Turnstile chargé uniquement sur `/contact`.
- Aucun devtools react-query en production.

## Matrice route par route

| Route | LCP | Blocking JS | Image | Embed | Data | CLS | INP | Prio |
|---|---|---|---|---|---|---|---|---|
| `/` | `hero-press.jpg` | rien | pas de `fetchpriority` sur hero ; portrait sans w/h | - | 3 requêtes limitées | portrait CDN sans dims | ok | P1 |
| `/biography` | texte | rien | ok | - | `select("*")` sur site_content | ok | ok | P1 |
| `/blog` | premier card | rien | ok (lazy) | - | `select("*")` + **pas de limite** | ok | ok | P1 |
| `/blog/$slug` | `cover_url` | rien | **pas de w/h, pas de preload, pas de fetchpriority** | - | `select("*")` | fort risque CLS | ok | **P1** |
| `/archives` | premier item | rien | ok | iframe réel (pas de facade) | `select("*")` sans limite | ok | ok si peu d'items | P1 |
| `/news` | premier item | rien | ok | - | `select("*")` sans limite | ok | ok | P1 |
| `/press` | premier item | rien | ok | - | `select("*")` sans limite | ok | ok | P1 |
| `/interviews/*` | premier item | rien | ok | iframe réel par item | sans limite | ok | ok | P1 |
| `/contact` | formulaire | Turnstile (route-only) | ok | - | clé seule | ok | ok | OK |
| Global | - | Google Fonts CSS bloquant + variable 400..900 | - | - | - | flash `dir` RTL->LTR pour fr/en après hydratation | ok | **P1** |

## Points remarquables (top items)

Fonts : Playfair Display charge toute la plage variable 400..900 italique+régulière, Amiri 400/700 italique, IBM Plex Sans Arabic 300/400/500/600/700 -> payload important, un seul `<link>` bloquant, aucun preload de fichier `.woff2`.

Requêtes Supabase : 5 routes utilisent `select("*")` (biography, blog.$slug, archives, news, press). 5 routes fetchent l'intégralité de la table publiée puis paginent en JS (`usePaged`).

Images LCP : `blog.$slug` cover n'a ni dimensions ni `fetchpriority` ni preload dans `head()` alors que l'URL est déjà connue au SSR. Le hero de `/` n'a pas de `fetchpriority="high"`.

Hydratation : `<html lang="ar" dir="rtl">` est codé en dur ; les visiteurs fr/en voient un flash RTL->LTR après hydratation (`suppressHydrationWarning` masque le warning mais pas le reflow).

Ce qui n'a pas besoin d'être touché : recharts confiné à `ui/chart.tsx` (admin uniquement), Turnstile route-scoped, providers root minces, i18n dict inline mais très petit.

Non vérifiable sans build : sizes réelles des chunks, dead weight potentiel de `embla-carousel-react` / `date-fns` (aucun import trouvé côté public, à confirmer par `vite build`).

## Corrections proposées (P1 uniquement, aucun P0 réel identifié)

### 1. Images LCP

- `/` hero (`src/routes/index.tsx`) : ajouter `fetchpriority="high"`, `decoding="async"`. Ajouter `width`/`height` sur le portrait CDN (aspect ratio stable).
- `/blog/$slug` (`src/routes/blog.$slug.tsx`) : ajouter `width`/`height` (ratio 16/9 sur le wrapper `AspectRatio`), `fetchpriority="high"`, `decoding="async"`. Ajouter un `<link rel="preload" as="image" href={cover}>` dans `head()` quand `cover_url` existe.
- Autres routes : ajouter `decoding="async"` sur les listes.

### 2. Requêtes Supabase

Remplacer `select("*")` par listes explicites dans :
- `biography.tsx` : `key, value_ar, value_fr, value_en, updated_at`
- `blog.$slug.tsx` : colonnes affichées uniquement (pas de champs internes/draft)
- `archives.tsx`, `news.tsx`, `press.tsx` : colonnes utilisées par la vue

Ajouter `.limit(60)` (ou seuil raisonnable) sur `blog`, `archives`, `news`, `press`, `interviews/*` pour borner la charge. La pagination client actuelle continue de fonctionner ; on prépare simplement le passage futur à `.range()` si le volume dépasse.

### 3. Fonts

Réduire les poids chargés à ceux réellement utilisés :
- Playfair Display : 400, 700 (italique 400)
- Amiri : 400, 700
- IBM Plex Sans Arabic : 400, 500, 700

Ajouter `preconnect` déjà présent + envisager `media="print" onload` pour rendre le CSS Google Fonts non bloquant (fallback système visible pendant ~100 ms, `swap` déjà actif). À valider visuellement avant de garder.

### 4. Hydratation `dir`/`lang`

Deux options :
- (a) Conserver l'état actuel (SSR en `ar`, correction client) ; c'est le comportement voulu pour un site dont la langue par défaut est ar-TN.
- (b) Détecter la langue préférée via cookie côté serveur et l'appliquer dès le SSR. Nécessite un cookie côté client + lecture dans `RootShell`.

Je recommande (a) : la langue par défaut du site **est** l'arabe, le flash ne concerne que les visiteurs ayant explicitement changé de langue à une visite précédente. C'est un compromis raisonnable et déjà documenté (`suppressHydrationWarning`).

### 5. Micro-optimisation `LanguageProvider`

Mémoïser la valeur de contexte avec `useMemo` (une ligne). Coût nul, évite les re-renders inutiles si d'autres providers s'ajoutent.

## Ce que je NE ferai PAS dans ce chantier

- Pas de refonte de la pagination en `.range()` serveur (changement de comportement, à traiter si le volume l'exige).
- Pas de remplacement des iframes YouTube par un facade click-to-play (P2 — utile mais change l'UX ; à discuter séparément).
- Pas de self-hosting des fonts (P2 — vrai gain mais chantier propre).
- Pas de suppression de `embla-carousel-react` / `date-fns` sans confirmation par analyse de bundle (déjà tree-shakés si non importés).
- Aucune modification de design, contenu éditorial, SEO, RLS, admin, schéma Supabase.

## Validation prévue

1. `bun run typecheck`
2. `bun run build` + inspection des tailles de chunks
3. `curl` des routes principales -> vérifier SSR intact, `<link rel="preload">` du cover article, attributs images
4. Vérif visuelle mobile 375 px / desktop, ar/fr/en
5. Non-régression Turnstile sur `/contact`, admin `/admin`, SEO tags

## Fichiers touchés (prévu)

- `src/routes/index.tsx`
- `src/routes/blog.$slug.tsx`
- `src/routes/blog.index.tsx`
- `src/routes/biography.tsx`
- `src/routes/archives.tsx`
- `src/routes/news.tsx`
- `src/routes/press.tsx`
- `src/lib/i18n.tsx` (memo context value)
- `src/routes/__root.tsx` (URL Google Fonts avec poids restreints)
- `src/components/site/InterviewsList.tsx` (limit)

Confirmez pour que j'applique les changements, ou dites-moi ce que vous voulez retirer/ajouter avant.
