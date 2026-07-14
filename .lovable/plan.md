## Phase 1 — Audit route-par-route (état actuel)

Origine canonique retenue : `process.env.SITE_URL` avec fallback `https://hassenbenahmed.com` (déjà utilisé par le sitemap existant, cohérent avec la demande).

| Route | Title | Meta desc | Canonical | Robots | og:title/desc | og:url/type | og:image | Twitter Card | JSON-LD | H1 | Sitemap | Indexable |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | racine seulement | racine seulement | absent | défaut | absent | absent | absent | absent | absent | oui (heroTitle) | oui | oui |
| `/biography` | ok | ok | absent | défaut | partiel (title+desc) | absent | absent | absent | absent | oui | oui | oui |
| `/blog` | ok | ok | absent | défaut | partiel | absent | absent | absent | absent | oui (blogTitle) | oui | oui |
| `/blog/$slug` | ok (dyn) | ok (dyn) | absent | défaut | partiel + type article | pas d'url | cover_url (relatif possible) | absent | absent | oui | dynamique | oui |
| `/archives` | ok | ok | absent | défaut | partiel | absent | absent | absent | absent | oui | oui | oui |
| `/news` | ok | ok | absent | défaut | partiel | absent | absent | absent | absent | oui | oui | oui |
| `/press` | ok | ok | absent | défaut | partiel | absent | absent | absent | absent | oui | oui | oui |
| `/interviews` (layout) | ok | ok | absent | défaut | partiel | absent | absent | absent | absent | oui (via enfants) | oui | oui |
| `/interviews/commentary` | ok | ok | absent | défaut | partiel | absent | absent | absent | absent | oui | oui | oui |
| `/interviews/media` | ok | ok | absent | défaut | partiel | absent | absent | absent | absent | oui | oui | oui |
| `/contact` | ok | ok | absent | défaut | partiel | absent | absent | absent | absent | oui | oui | oui |
| `/admin` | ok | — | absent | noindex ✓ | — | — | — | — | — | oui | non ✓ | non ✓ |
| `/auth` | ok | — | absent | noindex ✓ | — | — | — | — | — | oui | non ✓ | non ✓ |

Constats globaux :
- `__root.tsx` définit un titre + og:title/desc **globaux** qui s'appliquent partout — override correct par les enfants mais le root ne devrait porter que les valeurs sitewide.
- Aucun `<link rel="canonical">` nulle part.
- Aucun `og:url`, `og:site_name`, `og:locale`, `og:image` global.
- Aucun `twitter:*` nulle part.
- Aucun JSON-LD (ni Person, ni Article, ni BreadcrumbList).
- `<html lang="ar" dir="rtl">` codé en dur dans `RootShell` — non mis à jour au changement de langue (le provider client peut synchroniser via `useEffect`).
- Sitemap déjà correct (base URL configurable, articles publiés dynamiques). Robots.txt minimal, pas de référence sitemap ni de disallow pour `/admin` `/auth`.
- Image sociale par défaut : absente. Le portrait CDN existant n'est pas 1200×630 ; générer une carte OG dédiée 1200×630 (marque + nom + tagline, sans fabriquer de photo).

## Phase 2 → 7 — Plan d'implémentation

### Métadonnées & canonicals
1. Créer `src/lib/seo.ts` :
   - `SITE_URL` (env → fallback `https://hassenbenahmed.com`) normalisé sans slash final.
   - `absoluteUrl(path)` (préfixe + trim `/`).
   - `DEFAULT_OG_IMAGE` (URL absolue de la carte OG 1200×630 générée).
   - `buildRouteHead({ path, title, description, ogType?, image?, imageAlt?, noindex?, locale? })` renvoie `{ meta, links }` complet (title, description, canonical, og:*, twitter:*, robots optionnel).
2. Générer `src/assets/og-default.jpg` (1200×630) via imagegen, upload en asset CDN → import dans `seo.ts`.
3. Nettoyer `__root.tsx` : retirer title/desc/og page-specific ; garder charSet, viewport, og:site_name = « Hassen Ben Ahmed », og:type=website, og:locale=fr_FR, og:image par défaut absolu, twitter:card=summary_large_image, twitter:image par défaut, favicon, fonts. Pas de canonical au root.
4. Câbler `buildRouteHead` dans chaque route publique avec titre/description dédiés (déjà présents pour la plupart), path pour canonical + og:url self-référencé.
5. `/blog/$slug` : passe `path=/blog/${slug}`, `image=cover_url` si présent (rendu absolu si relatif), `ogType=article`.
6. `/admin` et `/auth` : `noindex=true` maintenu.

### JSON-LD
7. Person + WebSite au root (WebSite avec `inLanguage` par défaut, Person avec nom, url, image = portrait CDN, description = tagline ; **aucun** `sameAs` ni `jobTitle` fabriqué).
8. `/biography` : ProfilePage + Person (mêmes champs prudents).
9. `/blog/$slug` : Article JSON-LD depuis loaderData (headline, description, image absolue si cover_url, datePublished, dateModified, author=Person, mainEntityOfPage=canonical, inLanguage="fr").
10. BreadcrumbList sur `/biography`, `/blog`, `/blog/$slug`, `/archives`, `/news`, `/press`, `/interviews`, `/interviews/commentary`, `/interviews/media`, `/contact`.
11. `JSON.stringify` avec sérialisation sûre (échapper `</`).

### robots.txt
12. Mise à jour `public/robots.txt` :
    ```
    User-agent: *
    Allow: /
    Disallow: /admin
    Disallow: /auth

    Sitemap: https://hassenbenahmed.com/sitemap.xml
    ```

### Multilingue / RTL
13. Ajouter un `useEffect` dans `LanguageProvider` qui met à jour `document.documentElement.lang` et `dir` au changement de langue (le SSR conserve `lang="ar" dir="rtl"` — approche minimale sans casser l'hydratation ; garder `suppressHydrationWarning`).
14. **Ne pas** émettre de hreflang : les trois langues partagent l'URL et l'état est client-only. Documenter ce choix dans un commentaire dans `seo.ts`.
15. Vérifier que l'H1 reste unique par page (audit visuel).

### Sitemap
16. Aligner le sitemap sur les canonicals absolus (déjà OK). Vérifier que les brouillons (`published=false`) sont exclus (déjà OK). Retirer `/blog` doublon si présent (déjà dédupliqué).

### Validation
17. `bun run typecheck` puis `bun run build`.
18. `curl` de chaque route → vérifier titre/canonical/og/twitter/JSON-LD dans le HTML SSR ; parser les blocs JSON-LD.
19. `curl /sitemap.xml` et `/robots.txt`.

### Détails techniques
- Tous les tags OG image/canonical/og:url sont **absolus** via `absoluteUrl`.
- Pas de `hreflang` (documenté).
- L'action `/admin` et `/auth` reste `noindex, nofollow`.
- Article `og:image` : si `cover_url` commence par `http`, utilisé tel quel ; sinon préfixé par `SITE_URL`. Sinon fallback carte par défaut.
- Aucun changement de design visible, ni de routes, ni du schéma Supabase.

### Livrables avant commit
- Matrice ci-dessus + une seconde matrice « après » avec les valeurs recommandées appliquées.
- Liste des fichiers modifiés / créés.
- Extraits des `head()` finaux (root + une route statique + `/blog/$slug`).
- Contenu final de `robots.txt`.
- Exemples JSON-LD (Person, Article, BreadcrumbList).
- Constat multilingue.
- Résultat build/typecheck.
- Décisions manuelles restantes (redirection domaine, hreflang si migration future d'URLs localisées, ajout `sameAs` si comptes officiels fournis).

**Note Turnstile / Cloudflare (hors code) :** ajouter dans le tableau de bord Turnstile les hostnames `hassenbenahmed.com`, `www.hassenbenahmed.com` et le sous-domaine `.lovable.app` exact du projet une fois publié (pas de joker). À faire côté utilisateur.
