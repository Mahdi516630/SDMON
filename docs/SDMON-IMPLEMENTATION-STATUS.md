# SDMON — état d'implémentation

Date : 2026-11-03  
Branche : `feature/sdmon-app`

## Livré sur la branche de développement

- [x] Portail React/Vite isolé du site public, avec connexion Neon Auth, inscription client, session et déconnexion.
- [x] API Express isolée, endpoint de santé et route racine JSON.
- [x] Vérification JWT/JWKS côté API et contrôle de rôles `admin`, `employee`, `client`.
- [x] Bootstrap du premier administrateur limité à l'e-mail configuré côté serveur et bloqué après la création du premier administrateur.
- [x] Création du profil client après authentification et association des comptes employés/clients par un administrateur.
- [x] Navigation du portail filtrée selon les rôles et appels API avec jeton Bearer.
- [x] Tableau de bord administrateur connecté aux compteurs réels.
- [x] Consultation des clients limitée à l'administrateur et aux dossiers affectés aux employés.
- [x] Consultation du catalogue des services et création/modification/désactivation des services par l'administrateur.
- [x] Consultation et mise à jour des demandes, avec affectation contrôlée des employés.
- [x] Création des devis avec lignes, calcul des sous-totaux et taxes, validation/rejet par le client.
- [x] Création de factures à partir de devis acceptés, avec copie des lignes.
- [x] Création des bons de livraison avec lignes et vérification du client associé.
- [x] Enregistrement transactionnel des paiements manuels, verrouillage de facture, protection contre le dépassement du solde et journalisation.
- [x] Rapport financier ventilé par devise (DJF/USD), sans addition ni conversion incorrecte entre devises.
- [x] Domaine du portail ajouté à la liste des domaines autorisés de Neon Auth.
- [x] CI GitHub : syntaxe de toutes les sources JavaScript API et build de production du portail réussis sur le commit `2710f648e18dee2d6696b64324c26cc5303c6c66`.
- [x] Service API Render de développement déployé et démarré avec succès.
- [x] Site statique Render de développement créé; une version du portail est en ligne. Le déploiement du commit le plus récent doit être confirmé.

## Environnement Neon

- Projet dédié : `sdmon-app-dev` (`bold-block-26511094`).
- Branche : `development` (`br-dry-boat-bd0vcwke`).
- Neon Managed Auth : activé.
- Migration initiale appliquée sur la branche de développement : 13 tables et 34 index vérifiés.
- Le schéma de production existant n'a pas été modifié.

## Configuration Render

- API : `https://sdmon-app-api-dev.onrender.com`.
- Portail : `https://sdmon-app-portal-dev.onrender.com`.
- CORS de l'API configuré pour l'origine du portail.
- Variable `DATABASE_URL` encore à ajouter manuellement dans Render à partir de la chaîne de connexion de la branche Neon `development`. Tant qu'elle manque, les routes nécessitant PostgreSQL ne sont pas utilisables.
- E-mail du bootstrap administrateur actuellement configuré : `mahdiyacoubali318@gmail.com`. Vérifier qu'il correspond bien à l'e-mail du compte Neon Auth utilisé pour la première connexion.

## À terminer / vérifier avant production

- [ ] Ajouter `DATABASE_URL` dans les variables secrètes du service API Render.
- [ ] Confirmer le déploiement Render du dernier commit après les ajouts de l'inscription client.
- [ ] Vérifier en navigateur les parcours inscription, vérification e-mail, connexion, déconnexion et restauration de session.
- [ ] Créer et vérifier le premier administrateur.
- [ ] Tester les permissions directes API et les scénarios IDOR entre comptes client/employé.
- [ ] Compléter les écrans d'édition et de détail des clients, employés, devis, factures et bons de livraison.
- [ ] Ajouter export PDF/impression des devis, factures et bons de livraison.
- [ ] Ajouter tests automatisés d'intégration et de sécurité avec base de test isolée.
- [ ] Tester les paiements, soldes partiels, paiements complets et tentatives de surpaiement.
- [ ] Vérifier les rapports financiers avec des données distinctes DJF/USD.
- [ ] Faire une recette fonctionnelle complète avant toute mise en production.

## Protection de la production

Aucun changement n'a été poussé sur `main`. Aucun service Render existant de production, domaine public, site principal, générateur de devis ou donnée de production n'a été modifié. Les déploiements de cette phase sont exclusivement destinés à l'environnement de développement.
