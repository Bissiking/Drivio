<!-- PRODUCT.md -->
# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js, TypeScript strict, Tailwind CSS, shadcn/ui, Prisma et API integree a Next.js. SQLite est le moteur de developpement ; le modele de donnees doit rester portable vers PostgreSQL pour la production.

## Users

Des particuliers qui souhaitent conserver une vision fiable, personnelle et consolidee de leurs vehicules, de leur usage, de leur entretien et de leur cout reel.

## Product Purpose

Drivio centralise le garage personnel, les releves kilometriques, les entretiens, les pleins et les depenses. L’application doit permettre de saisir les evenements courants rapidement, puis de comprendre la situation actuelle et les prochaines echeances sans calcul manuel.

## Positioning

Drivio rapproche dans une meme chronologie les faits automobiles saisis par l'utilisateur et les indicateurs calcules. L'interface distingue explicitement les donnees reelles, les calculs derives et les estimations.

## Operating Context

Le produit est utilise sur ordinateur et mobile, principalement lors d'un plein, d'un releve kilometrique, d'une depense ou d'un entretien. Un compte peut gerer plusieurs vehicules, avec un seul vehicule principal. Les donnees de demonstration portent sur une CUPRA Formentor 2024, 1.5 TSI 150 DSG7, autour de 35 000 km.

## Capabilities and Constraints

- Authentification exclusivement via Kyros SSO v4 : PAR, PKCE S256, callback strict et verification des jetons RS256 depuis le JWKS.
- Gestion des vehicules actifs ou archives, avec un seul vehicule principal par utilisateur.
- Photo televersee sur le stockage de fichiers local en priorite, avec URL externe comme alternative.
- Photos classiques dans le Garage, avec illustrations de modèles en fallback.
- Garanties, contrôle technique, assurance, pneus et documents privés par véhicule.
- Coût de possession, statistiques annuelles et notifications Gotify côté serveur.
- Releves kilometriques monotones par defaut ; une correction inferieure exige une confirmation explicite.
- Entretiens bases sur une date, un kilometrage ou les deux, avec statut et projection.
- Depenses, pleins et chronologie unifiee.
- Aucun controle visuel sans comportement reel dans la V1.
- Donnees isolees par utilisateur et validation Zod aux frontieres de saisie.
- SQLite en developpement ; PostgreSQL en production, avec schemas Prisma dedies mais un modele metier identique.

## Brand Commitments

Le produit s'appelle Drivio, version affichée depuis package.json. L'interface est sombre par defaut, sobre, premium, moderne et orientee dashboard. Elle evite les compteurs automobiles decoratifs et la surcharge visuelle. La langue produit de la V1 est le francais. Le logo approuve associe un symbole eclair angulaire cuivre au mot-symbole Drivio blanc.

## Evidence on Hand

Le logo Drivio a ete valide par l'utilisateur. Les photographies de vehicule et les donnees automobiles de demonstration sont explicitement synthetiques. La documentation Kyros v4 locale fait autorite pour le protocole SSO.

## Product Principles

- Faire apparaitre l'etat utile avant les details.
- Garder chaque saisie courte, explicite et recuperable.
- Ne jamais melanger fait mesure, calcul derive et estimation.
- Preserver une architecture directe et lisible pour le suivi quotidien.
- Faire fonctionner chaque action exposee.

## Accessibility & Inclusion

Navigation complete au clavier, focus visible, contrastes lisibles, libelles explicites et mise en page utilisable sur mobile sans defilement horizontal global.
