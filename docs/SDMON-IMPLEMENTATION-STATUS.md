# SDMON — état d'implémentation

Date : 2026-11-03  
Branche : `feature/sdmon-app`

## Livré sur la branche de développement

- [x] Portail React/Vite isolé du site public.
- [x] Tableau de bord de prévisualisation et navigation des modules.
- [x] API Express isolée et endpoint de santé.
- [x] Middleware JWT/JWKS et contrôle de rôles `admin`, `employee`, `client`.
- [x] Modèle SQL initial versionné (non appliqué).
- [x] Résumés du tableau de bord réservés à l'administrateur.
- [x] Consultation des clients limitée à l'administrateur et aux dossiers affectés aux employés.
- [x] Profils client, employés, catalogue des services et demandes avec accès filtré.
- [x] Consultation des devis, factures, paiements et bons de livraison avec filtrage par rôle.
- [x] Enregistrement transactionnel des paiements manuels, protection contre le dépassement du solde et journalisation de l'opération.

## Inventaire Neon — lecture seule

Le projet Neon `sdmon.io` a une branche par défaut `production` actuellement archivée. Dans `neondb.public`, seules les tables `icp` et `prospects` ont été recensées. Elles ne correspondent pas au schéma de l'application métier SDMON. Aucun objet ou donnée n'a été modifié.

## Non livré / non vérifié

- [ ] Projet/branche Neon dédié(e) à l'application.
- [ ] Migration appliquée et validée sur la branche de développement.
- [ ] Neon Managed Auth activé et testé.
- [ ] Création/invitation contrôlée des utilisateurs et attribution du premier administrateur.
- [ ] CRUD complet clients, employés et services.
- [ ] Création et cycle de vie des devis, factures et bons de livraison.
- [ ] Tests automatisés, tests IDOR et tests de sécurité inter-rôles.
- [ ] Installation des dépendances et exécution réelle de l'API et du portail.
- [ ] Audit du compte Render et préproduction.

## Protection

Aucun changement n'a été poussé sur `main`. Aucun déploiement, changement DNS, migration Neon, ni écriture de données de production n'a été effectué. Le portail reste une prévisualisation; les chiffres ne sont pas des données réelles.
