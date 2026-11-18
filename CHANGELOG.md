# Changelog

## 2.1.0 — 2026-11-18

- Partage d'un véhicule entre comptes : invitation et acceptation au Garage, périmètres Simple/Complet, lecture ou modification, révocation et contrôles d'accès sur les pages et API, sans duplication de données.

- API Hub LUMA v1 : véhicules et synthèse bornée, jeton personnel SHA-256, expiration, rotation et révocation depuis Paramètres.
- Édition des pleins avec recalcul des trajets et synchronisation transactionnelle du relevé et de la dépense associés ; les relevés manuels sont préservés.
- Édition des dépenses et synchronisation des entretiens liés, sans nouvelle écriture.
- Catégories et sous-catégories d'entretien extensibles, reconnaissance locale conservatrice des intitulés, proposition facultative et correction manuelle.
- Migration additive SQLite/PostgreSQL : classification des anciens codes certains, conservation des intitulés, faits, relations et codes utilisés par les jauges.
- Dashboard : choix du véhicule, actions courantes, alertes prioritaires, prochaines interventions et coûts par famille, graphiques d'usage et de carburant.
- Thèmes sombre, clair et automatique avec palettes cuivre et ardoise ; préférences du compte rendues côté serveur.
- Mise à jour de Next, de sa configuration ESLint, de Zod et de dépendances transitives dans leurs versions majeures actuelles après audit npm ; override mysql2 3.24.6 pour la dépendance épinglée par Prisma. Pas de mise à niveau majeure automatique.
- Documentation : `docs/2.1.0.md` et `docs/API-HUB-LUMA.md`.


## Non publié — Pneus par essieu

- Montage avant, arrière ou des quatre pneus avec clôture automatique limitée aux essieux remplacés et conservation de l'historique.
- Saison et gamme distinctes, marque libre ; transmission renseignable et modifiable au Garage.
- Deux estimations cohérentes entre Dashboard, Suivi et Prévisions, formule automatique explicite et référence manuelle prioritaire. Coefficients de planification non étalonnés.
- Migration SQLite/PostgreSQL `20261116100000_tire_axles_quality` ; anciennes références conservées.


## À publier — 15 novembre 2026

- Prévisions d'entretien et d'usure basées sur le rythme observé ; estimation kilométrique des pneus et origine documentée des échéances.
- Jauges segmentées avec icônes sur le Dashboard, références dans Suivi véhicule et estimation des pneus sans mesure de gomme, avec hypothèse de longévité réglable.
- Budgets à 3, 6 et 12 mois, scénarios habituel/prudent et postes certains, estimés ou potentiels, avec déduplication des coûts existants.
- Rapports PDF Synthèse, Entretien et Cession, sections et période sélectionnables, données sensibles masquées par défaut et annexes explicites.
- Référentiel officiel français des stations, prix et ruptures, recherche géographique, comparaison des pleins et historique local des déclarations.
- Import transactionnel différentiel `fuel-prices-sync`, verrou partagé et contrat Node Aion V1 sécurisé.
- Saisie de plein en tête de page, modale native accessible et préférences distinctes mobile/ordinateur après connexion.
- Registre carburant : dates du trajet clôturé explicites, consommation du trajet en cours laissée en attente, coût de ravitaillement rapporté à la distance clairement identifié.
- Skeletons Next.js, indicateurs de navigation, limite de durée des soumissions et récupération des erreurs.
- Migrations additives SQLite/PostgreSQL et tests de conservation des données.

Voir [le guide de déploiement](docs/EVOLUTIONS.md).

## 1.2.0 — 5 octobre 2026

- Thème sombre Graphite & cuivre partagé par tous les écrans, formulaires et graphiques.
- Illustrations générées CUPRA Formentor, Renault Clio, Peugeot 308 et fallback générique ; photos personnelles prioritaires et changement de photo depuis le garage.
- Carburant par véhicule : budget mensuel, comparaison, graphiques, distances entre pleins, moyenne glissante, consommation pondérée et coût aux 100 km fiables.
- Plein et relevé kilométrique synchronisés dans une transaction, avec déduplication et recalcul après insertion rétroactive.
- Modification et suppression confirmée des relevés ; corrections identifiables et propagation aux pleins et dépenses liés.
- Garanties, contrôles techniques et contre-visites, contrats d’assurance, historique des pneumatiques : création, modification et suppression par véhicule.
- Consommables suivis avec les entretiens et échéances existants.
- Documents privés PDF/JPG/PNG/WebP, téléchargement authentifié et suppression du fichier.
- Coût total de possession, coûts par poste, comparaison annuelle et dashboard enrichi.
- Assurance intégrable aux coûts calculés, jusqu’au renouvellement ou à la vente ; un paiement manuel remplace la charge automatique du même mois.
- Gotify côté serveur : tokens chiffrés par compte, catégories et seuils configurables, déduplication et tâche planifiée.
- Version affichée issue exclusivement de `package.json`.
- Suppression des pages, composants, API et modèle actif du Studio Images. Les photos appliquées restent conservées.
- Migrations SQLite et PostgreSQL séparées ; validation de la conservation de données antérieures.

Activation en production : appliquer les migrations, monter le stockage privé des documents, conserver `SESSION_SECRET` et planifier Gotify. Voir [le guide de mise à niveau](docs/UPGRADE_1.2.0.md).
