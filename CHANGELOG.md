# Changelog

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
