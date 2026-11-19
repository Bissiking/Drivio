---
version: 1
slug: "src-components-dashboard-horizon-dashboard-tsx"
primary_target: "src/components/dashboard/horizon-dashboard.tsx"
related_targets: ["src/components/layout/navigation.tsx","src/app/(app)/ajouter/page.tsx","src/app/(app)/parametres/page.tsx"]
---

# Drivio mobile et Horizon

Mode Operate. Saisie rapide lors d’un plein, d’un relevé ou d’une dépense ; compte multi-véhicules avec droits de partage.

THESIS: Choisir son accueil et son interface, puis enregistrer un fait en quelques gestes.
OWN-WORLD: Classic existant conservé ; Horizon ardoise sombre/cuivre, navigation regroupée, cartes bordées et bandeau véhicule immersif comme les maquettes fournies. Le 19 novembre, l’utilisateur a demandé explicitement de rapprocher Horizon des deux images après la première recette. Luminosité et palette indépendantes. Photos et illustrations existantes, provenance conservée.
STORY: Choisir le véhicule, consulter compteur et échéances, ouvrir Ajouter, saisir puis retrouver les données actualisées.
FIRST VIEWPORT: Horizon desktop : navigation latérale, titre et véhicule, bandeau photographique et quatre mesures, prochaines actions et activité. Mobile : identité compacte, mesures, prochaines actions et barre à bouton Ajouter central. La page Ajouter donne immédiatement accès aux trois formulaires.
FORM: Seed user-approved-mobile-horizon-220. Deux présentations partagent les mêmes données et contrôles. Un contrôleur de saisie et une modale accessible réutilisent FuelForm, MileageForm et ExpenseForm ; brouillons conservés dans cet onglet jusqu’au succès ou au rechargement de la page. Accueil automatique Dashboard en navigateur et Ajouter en mode installé, avec priorité au choix explicite.
FINISH: Tests API/préférences/permissions, migrations SQLite/PostgreSQL, compilation et Chrome desktop/mobile/standalone simulé ; revue indépendante et documentation. Pas de déploiement, pas de nouvelle version avant validation.

Seed: user-approved-mobile-horizon-220
Build path: code-led extension of existing product; supplied device montage is the composition reference, real account data and approved shared components determine the resulting layout. No invented data, controls, search or notification capabilities. New user steering makes the supplied montages the visual authority for Horizon structure/material, with real-account data and accessible responsive reflow.

User approved the plan and explicitly requested Classic/Horizon in this milestone, overriding the old 2.2 deferral. New additive account preferences only; never migrate a user database during implementation.

Built composition: desktop photo is contained in a frame up to 375 × 250 px (maximum 52% width), with right-edge fade and 250 px minimum identity height. Mobile has no repeated visible dashboard title; four compact 80 px minimum metrics keep 20 px type icons and 1 rem values, while detail and source remain accessible but visually clipped in this summary. Detailed analytics retain visible provenance. Dashboard and overview gaps are 14 px; panel headers use 12 × 16 px padding and footer links retain 44 px targets. Recent activity icons follow the actual event type.
