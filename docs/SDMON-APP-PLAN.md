# SDMON — Plan de développement de l'application intégrée

**Dépôt :** `Mahdi516630/SDMON`  
**Branche de travail :** `feature/sdmon-app`  
**Branche de référence :** `main`  
**Statut :** plan initial — aucune modification de production ni migration de données

## 1. Objectif

Faire évoluer SDMON vers une plateforme web complète, bilingue français/anglais, qui conserve le site vitrine existant et lui ajoute une application métier intégrée pour l'administration, les employés et les clients.

L'application doit couvrir le cycle commercial et opérationnel : demandes de devis, validation, facturation, bons de livraison, suivi des paiements enregistrés manuellement, gestion des clients et des employés, et tableaux de bord.

## 2. Principes de protection de la production

1. Tous les développements sont réalisés sur `feature/sdmon-app`; `main` reste la référence de production.
2. Ne pas remplacer, déplacer ou réécrire `index.html`, `server.js`, les ressources publiques, le domaine ou les paramètres d'hébergement existants dans les premières étapes.
3. Ne pas déclencher de déploiement de production depuis la branche de fonctionnalité.
4. Ne pas exécuter de migration, suppression, réinitialisation ou modification de données Neon avant inventaire du schéma, sauvegarde vérifiée et validation.
5. Toute intégration avec le site public doit être additive et testée en préproduction.
6. La mise en production se fera uniquement après revue, tests, sauvegarde et approbation explicite.

## 3. État initial observé

Le dépôt contient un site public principalement statique (HTML/CSS/JavaScript), servi par Express. Le site comprend un parcours de demande/génération de devis côté navigateur avec export PDF et partage WhatsApp. Le serveur observé sert les fichiers statiques et quelques routes de vérification/SEO.

Lors de l'audit initial, aucun module applicatif centralisé de comptes, rôles, facturation, base de données ou API métier n'a été identifié dans les fichiers examinés. Cela ne permet pas de conclure qu'aucun système externe ou autre base de données n'existe : ces éléments devront être confirmés avec l'exploitant avant toute intégration.

## 4. Architecture cible proposée

Architecture progressive, sans rupture avec le site actuel :

- **Site public :** `https://sdmon.com` — conservation du site vitrine et du générateur de devis existant.
- **Application :** `https://app.sdmon.com` — portail authentifié pour l'administration, les employés et les clients.
- **API :** service Express versionné (par exemple `/api/v1`), avec validation des entrées, contrôle d'accès et journalisation.
- **Données :** PostgreSQL/Neon après inventaire et validation du schéma réel.
- **Hébergement :** environnement de préproduction distinct de la production; déploiement Render à confirmer selon la configuration existante.
- **Interface :** design responsive, identité SDMON (bleu/bleu nuit, vert et blanc), français et anglais.

Le choix définitif du découpage frontend/backend et de la stratégie de session sera documenté après inspection des workflows de déploiement, dépendances et contraintes d'hébergement.

## 5. Espaces et fonctionnalités

### 5.1 Administration SDMON

- Tableau de bord : activité, devis, factures, chiffre d'affaires enregistré et paiements en attente.
- Gestion des comptes, rôles, employés et clients.
- Catalogue de services, tarifs, options et paramètres commerciaux.
- Validation, affectation et suivi des demandes.
- Gestion des devis, factures, bons de livraison et reçus.
- Rapports filtrables et exports.
- Journal d'audit des opérations sensibles.

### 5.2 Espace employé

- Tableau de bord des tâches affectées.
- Consultation des clients et dossiers autorisés.
- Mise à jour des statuts et ajout de notes/pièces justificatives.
- Préparation de devis et documents selon les permissions.
- Historique des actions effectuées.

### 5.3 Espace client

- Profil et coordonnées.
- Dépôt et suivi des demandes de service.
- Consultation, téléchargement et acceptation des devis.
- Consultation des factures et bons de livraison.
- Historique des paiements enregistrés et soldes dus.
- Échanges et support via WhatsApp ou canal intégré.

### 5.4 Documents et paiements

- Numérotation unique et contrôlée des documents.
- Statuts explicites : brouillon, envoyé, accepté, refusé, payé, partiellement payé, annulé, livré.
- Historique des versions et traçabilité des modifications.
- Paiements saisis manuellement (espèces, virement, autre moyen configuré), avec date, montant, référence et utilisateur ayant enregistré l'opération.
- **Aucune passerelle de paiement en ligne** dans le périmètre initial.
- Les totaux et soldes doivent être calculés côté serveur; les PDF sont générés à partir des données validées.

## 6. Modèle de données — à concevoir après audit

Entités candidates :

- `users`, `roles`, `user_roles`, `employee_profiles`
- `clients`, `client_contacts`
- `services`, `service_options`, `price_rules`
- `service_requests`, `quotes`, `quote_items`
- `invoices`, `invoice_items`
- `delivery_notes`, `delivery_note_items`
- `payments`, `payment_allocations`
- `attachments`, `activity_logs`, `settings`

Ce sont des propositions, pas un schéma à appliquer tel quel. Avant de créer une table, comparer avec le schéma Neon existant, les données déjà utilisées et les règles comptables de SDMON. Prévoir clés étrangères, contraintes, index, horodatages, devise (FDJ/USD si confirmé), et stratégie de sauvegarde/restauration.

## 7. Sécurité et conformité technique

- Authentification sécurisée, hachage moderne des mots de passe et récupération contrôlée.
- Autorisation côté serveur par rôle et par ressource; masquer un bouton dans l'interface ne constitue pas une protection.
- Validation des entrées, protection CSRF selon le mode de session, limitation de débit et en-têtes de sécurité.
- Cookies de session `HttpOnly`, `Secure`, `SameSite` si l'architecture retient les sessions web.
- Secrets uniquement dans les variables d'environnement; aucun secret dans Git.
- Journalisation sans mots de passe, jetons ni données personnelles excessives.
- Contrôle des types, tailles et droits d'accès aux fichiers téléversés.
- Sauvegardes vérifiables et procédure de restauration testée.

## 8. Phases de réalisation et critères de sortie

| Phase | Livrables | Critère de validation |
|---|---|---|
| 0 — Protection et audit | Inventaire du dépôt, workflows, hébergement, schéma DB et sauvegardes | Aucun impact sur la production; état initial documenté |
| 1 — Socle applicatif | Structure isolée, configuration, lint/tests, documentation locale | L'application démarre sans modifier le site public |
| 2 — Identité et accès | Connexion, sessions, rôles admin/employé/client | Tests d'accès positif et négatif par rôle |
| 3 — Référentiels | Clients, employés, services, tarifs | CRUD validé, contrôles d'accès et historique |
| 4 — Cycle commercial | Demandes, devis, acceptation et génération PDF | Calculs serveur cohérents et numérotation unique |
| 5 — Facturation et livraison | Factures, bons de livraison, statuts | Documents traçables et non destructifs |
| 6 — Paiements et rapports | Saisie manuelle des paiements, soldes, tableaux de bord | Totaux rapprochés et audit des écritures |
| 7 — Portail client et support | Suivi client, notifications/liens WhatsApp, français/anglais | Parcours complet validé sur mobile et desktop |
| 8 — Préproduction | Déploiement isolé, tests de sécurité, sauvegarde/restauration | Aucun défaut bloquant; recette utilisateur approuvée |
| 9 — Mise en production | PR vers `main`, plan de retour arrière, bascule DNS si nécessaire | Autorisation explicite et fenêtre de déploiement convenue |

## 9. Tests indispensables

- Tests unitaires des calculs, statuts, numérotation et permissions.
- Tests d'intégration API/base de données.
- Tests de non-régression du site public et de son générateur de devis.
- Tests de sécurité : accès inter-rôles, IDOR, validation, sessions, upload et limitation de débit.
- Tests responsive et bilingues.
- Tests de sauvegarde et restauration sur une base de test.
- Recette des scénarios complets : demande → devis → acceptation → facture → paiement manuel → bon de livraison.

## 10. Décisions à confirmer avant l'implémentation métier

- Existence et contenu du schéma Neon actuel, et éventuelles données déjà utilisées.
- Configuration actuelle Render, domaine et règles de déploiement automatique.
- Règles de numérotation des devis/factures et devise par défaut.
- Rôles exacts et périmètres d'accès des employés.
- Politique de validation des devis, factures, remises et annulations.
- Conservation des pièces jointes et durée de rétention.
- Canaux WhatsApp et adresses e-mail officiels à intégrer.

## 11. Première livraison non destructive

La première livraison se limite à cette documentation de cadrage sur la branche `feature/sdmon-app`. Elle ne modifie aucun fichier de production, aucune configuration d'hébergement et aucune donnée métier. Les premiers changements de code seront ajoutés dans des chemins isolés, après vérification de l'arborescence complète et des workflows CI/CD.
