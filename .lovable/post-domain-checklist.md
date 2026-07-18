# Checklist à faire après branchement du domaine personnalisé

À exécuter une fois le domaine (ex. `hassenbenahmed.com`) connecté et actif dans **Project Settings → Domains**.

## 1. Cloudflare Turnstile (formulaire de contact)
- [ ] Créer le site Turnstile sur Cloudflare avec le domaine final (et `www`).
- [ ] Mettre à jour les clés (site key + secret) dans les variables d'environnement.
- [ ] Vérifier que le widget s'affiche sans erreur « Impossible de se connecter au site web » sur `/contact`.

## 2. E-mails transactionnels (notification contact)
- [ ] Configurer le domaine d'envoi (sous-domaine type `notify.hassenbenahmed.com`) via **Cloud → Emails**.
- [ ] Attendre la vérification DNS (NS records délégués à Lovable).
- [ ] Brancher l'envoi automatique de notification vers l'adresse configurée dans **Admin → Contact** (par défaut `medsaid.benahmed@gmail.com`) à chaque soumission du formulaire.
- [ ] Tester un envoi réel et vérifier les logs dans Cloud → Emails.

## 3. SEO / sitemap
- [ ] Mettre à jour `SITE_URL` (variable d'environnement) avec l'URL finale du domaine.
- [ ] Vérifier que `/sitemap.xml` et `/robots.txt` renvoient bien le domaine final.
- [ ] Soumettre le sitemap dans Google Search Console (propriété du nouveau domaine).
- [ ] Vérifier les balises canoniques, `og:url`, JSON-LD sur les pages publiques.

## 4. Auth / OAuth
- [ ] Ajouter le domaine final dans les URLs autorisées de redirection Auth.
- [ ] Mettre à jour `redirect_uri` Google OAuth avec le domaine final.
- [ ] Tester la connexion admin depuis le domaine final.

## 5. Vérifications finales
- [ ] Tester toutes les pages publiques sur le domaine final (FR / EN / AR).
- [ ] Vérifier le certificat SSL (https) actif.
- [ ] Vérifier les partages sociaux (aperçu og:image) via un outil comme opengraph.xyz.
- [ ] Google Search Console : demander l'indexation des pages principales.
