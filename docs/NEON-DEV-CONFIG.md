# SDMON — configuration Neon de développement

## Ressources isolées

- Projet : `sdmon-app-dev`
- Project ID : `bold-block-26511094`
- Région : `aws-us-east-2`
- Branche : `development`
- Branch ID : `br-dry-boat-bd0vcwke`
- Base : `neondb`
- PostgreSQL : 18
- Schéma initial : 13 tables et 34 index vérifiés.

Le projet historique `sdmon.io` n'a pas été modifié. La base de développement est séparée de la production.

## Authentification

Neon Managed Better Auth est activé sur la branche `development`.

- Auth base URL : `https://ep-rough-bird-bda2fxps.neonauth.c-8.us-east-2.aws.neon.tech/neondb/auth`
- JWKS URL : `https://ep-rough-bird-bda2fxps.neonauth.c-8.us-east-2.aws.neon.tech/neondb/auth/.well-known/jwks.json`
- Issuer attendu : même valeur que l'Auth base URL ci-dessus.

Ces URL ne sont pas des mots de passe. Ne jamais enregistrer une chaîne de connexion ou un secret dans Git.

## Variables à configurer sur l'environnement API de développement

- `DATABASE_URL` : chaîne PostgreSQL pooled de cette branche, à récupérer dans Neon et à stocker uniquement dans les variables secrètes de l'hébergeur.
- `NEON_AUTH_JWKS_URL` : valeur fournie dans `apps/api/.env.example`.
- `NEON_AUTH_ISSUER` : valeur fournie dans `apps/api/.env.example`.
- `CORS_ORIGINS` : origine exacte du portail de développement.
- `VITE_API_BASE_URL` : URL publique de l'API de développement côté portail.

Ne pas connecter le site public ni les services de production à cette base de développement.

## État restant

1. Récupérer et injecter les secrets de connexion dans l'environnement de développement.
2. Implémenter le client de connexion Neon Auth dans le portail React.
3. Synchroniser les utilisateurs authentifiés avec `app_users` et attribuer les rôles uniquement côté serveur.
4. Tester inscription/invitation, connexion, déconnexion, restauration de session et contrôle d'accès par rôle.
5. Déployer séparément l'API et le portail de développement, après validation de l'espace Render.
