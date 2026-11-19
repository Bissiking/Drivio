# Stabilisation Drivio 2.1.x

Périmètre approuvé après l’audit en lecture seule du 19 novembre 2026 : cohérence
des dépenses historiques, révocation concurrente des partages et classification
des dépenses liées aux entretiens. Aucun changement de design ou de schéma SQL.

## Corrections

- L’édition d’un plein ou d’un entretien recherche sa dépense liée, puis une
  éventuelle dépense historique sans liaison, à partir des **anciennes** valeurs :
  véhicule, catégorie, date exacte, compteur et montant (écart inférieur à
  0,005 €). Une liaison explicite reste prioritaire. Le rapprochement exige une
  seule dépense candidate et une seule opération source correspondante ; sinon
  réponse HTTP 409 et annulation de la transaction. Les autres dépenses ne sont
  ni fusionnées ni supprimées. Aucun rapprochement massif ou migration de données.
- Les créations de dépenses et d’entretiens, les échéances, les mutations du
  véhicule partagé, les garanties/contrôles/assurances/pneus et les documents
  privés verrouillent le véhicule et relisent les droits dans la transaction.
  La révocation, la modification des droits et le départ du destinataire prennent
  le même verrou. Les écritures carburant/kilométrage déjà protégées conservent
  leur contrôle transactionnel. Si la révocation gagne le verrou, l’écriture est
  refusée ; si une écriture l’a déjà obtenu, elle termine avant la révocation.
- La dépense d’entretien reçoit un sous-type appartenant à la taxonomie existante
  (par exemple Plaquettes → Freinage, Vidange → Vidange). Une intervention sans
  sous-type de dépense correspondant reste sans sous-type. Un changement de type
  actualise aussi cette classification, sans ajouter de choix aux formulaires.
- L’édition d’une dépense relit ses liaisons après verrouillage : si un autre
  onglet vient de la rattacher à un plein ou un entretien historique, les droits
  et restrictions de cette liaison s’appliquent immédiatement.

## Recettes

`src/lib/stabilisation.test.ts` utilise une base SQLite temporaire et des sessions
simulées. Il vérifie la conservation de l’identifiant de dépense, les totaux,
l’idempotence, le refus des rapprochements ambigus avec annulation complète,
l’isolation des autres écritures, la classification et les mutations concurrentes
à une révocation, ainsi que l’ajout concurrent d’une liaison pendant une édition
de dépense.

`scripts/validate-stabilisation-postgres.ts` est réservé à une instance jetable
sur `127.0.0.1:55448`, utilisateur `drivio_stabilisation`, avec les migrations
appliquées et le client Prisma PostgreSQL généré dans une copie isolée. Il vérifie
une vraie attente de verrou PostgreSQL dans les deux ordres et l’édition d’un
plein historique avec conservation de sa dépense. Ne pas le diriger vers une
base utilisateur ou de production.

Les recettes existantes `test:browser:210` et `test:browser:sharing` couvrent les
parcours Chrome locaux avec des comptes et bases synthétiques. Elles ne prouvent
pas une connexion Kyros réelle, une intégration LUMA réelle ou un appareil physique.

## Résultats du 19 novembre 2026

- [x] `npm test -- --no-cache` sous Node 24 : **196 tests / 26 fichiers**,
  dont **15 tests de stabilisation**, sur des bases SQLite temporaires.
- [x] `node node_modules/typescript/bin/tsc --noEmit --incremental false` et
  `npm run lint` : réussis dans le dépôt.
- [x] Huit migrations existantes appliquées avec Prisma `migrate deploy` dans
  une instance PostgreSQL 14 jetable sur `127.0.0.1:55448`.
- [x] `scripts/validate-stabilisation-postgres.ts` : attente de verrou observée
  via `pg_stat_activity` dans les deux ordres, refus de l’écriture révoquée,
  conservation et mise à jour du miroir historique avec le client PostgreSQL.
- [x] `npm run test:browser:210` : 12 contrôles / 13 vues Chrome.
- [x] `npm run test:browser:sharing` : 6 contrôles / 27 vues Chrome, deux
  contextes indépendants. Largeurs 320/390/1440 px et aucune erreur JavaScript
  sur les deux recettes. Rapports locaux conservés sous
  `tmp/stabilisation/210-browser-report.json` et
  `tmp/stabilisation/sharing-browser-report.json` (non versionnés).
- [x] `npm run build` avec client Prisma **PostgreSQL** dans la copie isolée :
  compilation, TypeScript et génération des routes réussis. Le client SQLite
  du dépôt de travail est conservé.

Les sources applicatives et scripts de la copie ont été comparés à ceux du
dépôt avant livraison. Les serveurs de recette et l’instance PostgreSQL ont été
arrêtés. Aucune migration ajoutée ou modifiée, aucune base utilisateur migrée,
aucun déploiement. Les comptes réels Kyros/LUMA et les rôles SQL de production
restent hors validation.
