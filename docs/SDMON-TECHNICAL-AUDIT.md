# SDMON — Audit technique initial

Date : 2026-11-03  
Branche examinée : `feature/sdmon-app` (héritée de `main`)

## Déploiement GitHub

Le dépôt contient `.github/workflows/deploy.yml`. Ce workflow publie le contenu statique du dépôt sur GitHub Pages lors d'un push sur `main` ou `master`, ainsi que lors d'un déclenchement manuel. Il n'inclut pas `feature/sdmon-app` dans son filtre de branches. Le développement sur cette branche ne déclenche donc pas ce workflow.

Le workflow ne décrit pas le déploiement Render. Aucun fichier Render Blueprint (`render.yaml`) n'a été repéré dans les fichiers racine examinés. L'accès au compte Render n'étant pas encore connecté, les services, auto-deploys, variables et domaines Render ne sont pas vérifiés.

## Base de données

Les fichiers examinés (`package.json`, `server.js`, `.env.example`, README et arborescence du dépôt) ne révèlent ni client PostgreSQL/Neon, ni chaîne de connexion, ni ORM, ni dossier de migrations ou schéma SQL. `.env.example` ne déclare que `PORT=3000`.

Cela signifie qu'aucune configuration Neon n'est documentée dans ces fichiers. Cela ne prouve pas qu'aucune base ou donnée n'existe dans le compte Neon ou dans un autre service. L'accès au projet Neon n'étant pas encore connecté, aucun projet, branche, rôle, schéma, table ou donnée n'a été consulté.

## Site public

Le site existant est servi par le serveur Express racine et son `index.html`. Le serveur sert les fichiers statiques depuis la racine, expose des routes de vérification Google et SEO, puis renvoie `index.html` en fallback. Ces fichiers sont laissés intacts par le socle applicatif ajouté sous `apps/`.

## Décisions de sécurité

- Ne pas modifier le workflow de production.
- Ne pas ajouter `feature/sdmon-app` au workflow GitHub Pages.
- Ne pas connecter ni migrer une base avant inspection du compte Neon et confirmation de l'environnement de développement.
- Ne pas enregistrer de secrets dans Git.
- Déployer l'API et le portail uniquement sur un environnement de préproduction dédié, après connexion et vérification du compte Render.
- Ne pas basculer le DNS de `sdmon.com` ou créer/modifier des domaines de production pendant cette phase.

## État

| Élément | État |
|---|---|
| Workflow GitHub Pages | Vérifié |
| Déclencheurs de production sur la branche feature | Aucun dans le workflow examiné |
| Configuration Render dans le dépôt | Non identifiée |
| Compte/services Render | À connecter et vérifier |
| Schéma Neon dans le dépôt | Non identifié |
| Compte/projet Neon | À connecter et vérifier |
| Socle isolé | Créé sous `apps/api` et `apps/portal` |
| Modules métier | Non commencés |
