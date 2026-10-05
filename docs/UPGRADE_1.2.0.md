# Mise à niveau Drivio 1.2.0

## Avant la mise à niveau

Sauvegarder la base et `public/uploads`. Conserver `SESSION_SECRET` : il chiffre les sessions Kyros et les tokens Gotify. La migration supprime l’historique des demandes du Studio Images, conformément à sa suppression fonctionnelle ; elle conserve les véhicules et leurs chemins de photos actives.

## SQLite

```bash
npm install
npm run db:generate
npm run db:deploy
npm run build
```

`DATABASE_URL` reste celle de votre base existante. Pour le développement, `npm run db:migrate` reste disponible. Le seed est réservé à une base de démonstration : il remplace l’utilisateur de démonstration et ses données, et ne doit pas servir à mettre à niveau une base réelle.

## PostgreSQL

Les migrations PostgreSQL sont dans `prisma/migrations-postgresql`, avec un fichier de verrouillage PostgreSQL. Le script utilise `prisma.postgresql.config.ts` pour ne jamais exécuter les migrations SQLite sur PostgreSQL.

Sur une base neuve, ou une base dont la migration initiale PostgreSQL est déjà enregistrée :

```bash
npm install
npm run db:generate:postgres
npm run db:validate:postgres
npm run db:migrate:postgres
npm run build
```

Sur une base Drivio ancienne créée avec `prisma db push` et sans historique de migrations, vérifier d’abord que ses tables, colonnes et index correspondent à la version déployée avant 1.2.0 (la migration initiale représente ce schéma). Sauvegarder puis enregistrer cette migration comme déjà appliquée, sans exécuter son SQL de création :

```bash
RUST_LOG=info npx prisma migrate resolve --applied 20260831173755_init --config prisma.postgresql.config.ts
npm run db:migrate:postgres
```

Ne pas baseliner une base présentant des différences de schéma non résolues. Si elle possède déjà un historique de migrations différent, réconcilier cet historique avec le déploiement existant avant la commande ci-dessus.

La génération du client PostgreSQL doit précéder le build de production ; la génération SQLite doit précéder les vérifications et l’exécution locale avec SQLite.

## Stockage

- Photos : `public/uploads`, volume persistant existant, limite de 5 Mo.
- Documents : `DRIVIO_DOCUMENT_DIR`, par défaut `storage/documents`, hors `public`, volume persistant, limite de 10 Mo.
- Documents servis uniquement via `/api/documents/:id`, après vérification du propriétaire. Le fichier est téléchargé en pièce jointe, avec `nosniff` et sans cache public.
- Le stockage et la base doivent être sauvegardés ensemble.

## Gotify

Dans Paramètres, renseigner le token d’une **application** Gotify du compte concerné, choisir chaque type d’alerte (bientôt dû, dépassé, seuil kilométrique, garantie, contrôle, assurance), les seuils en jours et kilomètres, puis activer Gotify. Le token est chiffré dans la base ; les pages ne reçoivent que `hasToken`. L’URL est définie côté serveur, par défaut `https://notify.mhemery.fr`.

Les envois utilisent l’en-tête `X-Gotify-Key` décrit dans la [documentation officielle Gotify](https://gotify.net/docs/pushmsg). Aucun token n’est ajouté à l’URL. Aucun envoi réel n’a été effectué pendant la validation locale.

Prévisualisation sans envoi :

```bash
npm run notifications:send
```

Envoi des alertes dues pour les comptes activés :

```bash
npm run notifications:send -- --send
```

Planifier cette seconde commande côté serveur, par exemple quotidiennement avec cron ou un timer systemd, dans le dossier Drivio et avec ses variables serveur. Le bouton « Envoyer les alertes dues » permet un traitement manuel pour le compte connecté.

Un changement d’état (bientôt dû → dépassé) ou d’échéance produit une nouvelle clé ; les exécutions répétées ne renvoient pas la même alerte. Une réservation temporaire évite les doublons entre workers ; les échecs sont réessayables. Une panne après l’acceptation Gotify mais avant l’enregistrement local peut exceptionnellement entraîner un doublon lors d’une reprise : Gotify ne fournit pas ici de clé d’idempotence distante.

## Conventions de calcul

- La consommation est pondérée par la distance et calculée entre deux pleins complets, appoints inclus. Tout intervalle ayant une baisse ou stagnation du compteur est exclu de cette consommation.
- Les distances entre passages à la pompe utilisent uniquement les différences positives au sein d’un même véhicule.
- L’insertion d’un plein crée ou réutilise un relevé de même date et kilométrage. Les relevés manuels peuvent être corrigés explicitement ; les nouveaux pleins incohérents sont refusés.
- Une modification d’un relevé lié corrige aussi la date et le kilométrage du plein et sa dépense associée. Supprimer le relevé conserve le plein en le dissociant.
- Les intervalles kilométriques sont attribués à la date de leur dernier relevé. Une année ou un mois ne dispose pas d’un découpage précis à la frontière sans relevé à cette frontière ; les valeurs sont Calculées.
- Le mois en cours et l’année en cours sont incomplets. Les pourcentages sont indisponibles si la base de comparaison vaut zéro.
- Une assurance activée produit des échéances aux anniversaires du contrat, avec jours de fin de mois bornés au calendrier. Les échéances s’arrêtent avant le renouvellement et après la vente. Renouveler un contrat exige d’ajouter ou de modifier ses dates.
- Une dépense Assurance manuelle remplace le coût automatique pour ce véhicule et ce mois. Deux contrats intégrés aux coûts ne peuvent pas se chevaucher.
- Les dépenses créées automatiquement pour les pleins et entretiens ne sont pas additionnées une seconde fois. Les anciennes données miroir sont reconnues par date, kilométrage, catégorie et montant.
- Possession : achat + utilisation − revente. Un prix d’achat absent signale un total incomplet. Sans distance positive, le coût/km est indisponible.
- Les garanties expirent au premier seuil atteint et peuvent afficher un état À venir avant leur début.

## Validation locale

`npm run typecheck`, `npm run lint`, `npm test` (41 tests) et `npm run build` passent. Chrome for Testing via Puppeteer a contrôlé 12 écrans sur desktop (1440 × 1000) et mobile (390 × 844), sans erreur JavaScript, image cassée ou débordement horizontal. Les rapports sont dans `.impeccable/review` : 31 vérifications initiales avec saisies et téléchargement, puis 28 vérifications finales avec contraste de connexion (8,98:1), attribution des événements aux véhicules, navigation mobile et suppression du Studio.

Les tests métier et de routes utilisent des bases et fichiers temporaires. Les parcours Chrome utilisent une session locale chiffrée synthétique et les données seed ; ils ne valident pas le callback Kyros réel ou un appareil physique. Les migrations ont été exécutées sur SQLite et sur un serveur PostgreSQL local temporaire, avec création neuve et reprise de données anciennes. La base et les fichiers de production n’ont pas été modifiés.
