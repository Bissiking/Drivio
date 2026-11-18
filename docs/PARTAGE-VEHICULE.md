# Partage d'un véhicule — Drivio 2.1.0

Un véhicule conserve **un propriétaire et un seul dossier**. Les autres comptes
consultent ou modifient ces mêmes données : aucun véhicule, plein, relevé ou
entretien n'est recopié lors du partage.

## Utilisation

1. Le propriétaire ouvre **Garage → Partager ce véhicule**.
2. Il indique l'adresse e-mail du compte Kyros destinataire, le périmètre et les
   droits. Le partage peut être préparé avant la première connexion à Drivio.
3. Le destinataire se connecte avec cette adresse et retrouve l'invitation dans
   son Garage. Il peut l'accepter ou la refuser.
4. Après acceptation, le véhicule apparaît dans les sélecteurs et les pages
   autorisées. Les écrans indiquent « Véhicule partagé » et les droits accordés.

L'invitation est disponible dans l'application ; **aucun e-mail n'est envoyé**.
Elle expire après sept jours si elle n'est pas acceptée. Inviter de nouveau la
même adresse renouvelle une invitation en attente ; un accès déjà accepté se
modifie dans sa liste de droits. Une invitation ne permet pas de consulter le
dossier avant son acceptation.

## Périmètres et droits

| Fonction | Simple / Lecture | Simple / Lecture-Modification | Complet / Lecture | Complet / Lecture-Modification |
| --- | --- | --- | --- | --- |
| Synthèse, kilomètres, carburant, dépenses | Consulter | Consulter et modifier | Consulter | Consulter et modifier |
| Entretiens, échéances, jauges | Non | Non | Consulter | Consulter et modifier |
| Garanties, assurance, contrôles, pneus | Non | Non | Consulter | Consulter et modifier |
| Documents privés | Non | Non | Consulter et télécharger | Ajouter, consulter, supprimer |
| Prévisions, statistiques de possession, rapports PDF | Non | Non | Consulter et exporter | Consulter et exporter |
| Photo, transmission, archivage/restauration | Non | Non | Consulter | Modifier |
| Gérer les partages, choisir le véhicule principal du propriétaire | Non | Non | Non | Non |

Le périmètre Complet couvre le dossier automobile, pas les paramètres privés du
compte propriétaire. Chacun conserve sa session Kyros, ses préférences visuelles
et ses paramètres de notifications. Les alertes partagées sont éligibles aux
notifications personnelles opt-in uniquement dans le périmètre Complet.

Le mode Lecture retire les formulaires et commandes de mutation des sections
concernées. Les comparaisons de stations, filtres de consultation et exports
autorisés restent utilisables : ils ne modifient pas le dossier.

Les dépenses rattachées à un plein se corrigent depuis le plein, avec les
recalculs existants. Une dépense rattachée à un entretien exige un accès
**Complet + Lecture/Modification** pour sa correction : le coût, la date et le
compteur de l'entretien sont liés et ne doivent pas être modifiés indirectement
depuis un périmètre Simple. Les autres dépenses restent modifiables en Simple.

## Modification et révocation

Le propriétaire peut changer le périmètre ou les droits à tout moment, y compris
avant acceptation. Il peut retirer l'accès ; le destinataire peut quitter le
partage. Ces actions ne suppriment aucune donnée du véhicule.

Les droits sont relus côté serveur à chaque requête. Après retrait, une page
déjà ouverte ne donne plus le droit de soumettre une modification ou télécharger
un document. Les contenus déjà consultés ou téléchargés ne peuvent pas être
effacés à distance. Aucun droit n'est déduit de l'affichage d'un bouton ou d'un
identifiant de véhicule fourni par le client.

## Isolation et intégrations

- `src/lib/vehicle-access.ts` centralise les filtres de lecture et les contrôles
  de modification. Les API contrôlent aussi les relations indirectes : plein,
  relevé, dépense d'entretien, échéance, pneumatique ou document.
- L'accès exige une invitation acceptée, liée à l'identifiant Drivio du
  destinataire. Les invitations utilisent l'adresse e-mail synchronisée depuis
  l'identité Kyros ; Drivio n'ajoute pas de mot de passe ou d'annuaire public.
- Un destinataire ne peut pas partager à son tour le véhicule reçu ni changer
  le véhicule principal du propriétaire. Le propriétaire reste inchangé.
- Les véhicules reçus ne sont pas retransmis automatiquement aux jetons Hub
  personnels ou aux autorisations applicatives LUMA. L'intégration Hub reste
  limitée aux véhicules possédés et au consentement explicite existant.
- Les documents conservent leur téléchargement authentifié. Le stockage public
  préexistant des photos n'est pas transformé en coffre documentaire privé.

## API interne

Toutes ces routes exigent la session Kyros Drivio. Un jeton Hub n'accorde aucun
droit de gestion des partages.

| Méthode | Route | Action |
| --- | --- | --- |
| POST | `/api/vehicles/:id/shares` | Propriétaire : inviter `{ email, scope, permission }` |
| PATCH | `/api/vehicles/:id/shares/:shareId` | Propriétaire : modifier `{ scope, permission }` |
| DELETE | `/api/vehicles/:id/shares/:shareId` | Propriétaire : retirer le partage |
| POST | `/api/shares/:id` | Destinataire de l'adresse : accepter une invitation valide |
| DELETE | `/api/shares/:id` | Destinataire : refuser ou quitter |

`scope` : `SIMPLE` ou `COMPLETE`. `permission` : `READ` ou `WRITE`.
Statuts : 400 saisie invalide, 401 session absente, 403 périmètre/droit
insuffisant, 404 ressource non visible, 409 invitation expirée ou accès déjà
accepté. Les comptes tiers ne peuvent pas énumérer les véhicules ou invitations.

## Migration

`20261118140000_vehicle_sharing` ajoute uniquement la table `VehicleShare`,
ses contraintes et index, dans les migrations SQLite et PostgreSQL. Aucun modèle
automobile existant n'est réécrit et aucune propriété de véhicule n'est déplacée.
Les rôles sont limités par les schémas Zod et les contraintes SQL.

Appliquer avec les commandes de migration correspondant à l'environnement,
après sauvegarde, avant de démarrer le nouveau code. Ne pas remplacer par
`db push`. Aucun changement de base utilisateur ou de production n'a été requis
par la recette locale ; les bases de vérification sont temporaires et isolées.

## Validation

Validation locale exécutée le 18 novembre 2026 : **181 tests dans 25 fichiers**,
dont **21 tests de partage** ; typage, lint et build Next réussis. Les migrations
SQL ont été appliquées sur une instance PostgreSQL 14 isolée, avec vérification
de la conservation du propriétaire et des dépenses après révocation. Cette
vérification PostgreSQL porte sur les migrations et contraintes, pas sur un
déploiement ou une recette HTTP PostgreSQL.

Les résultats et limites sont consignés dans `.impeccable/review/` : recette
Chrome avec deux sessions synthétiques indépendantes, matrice de droits côté
serveur, refus d'accès privé, révocation d'un éditeur déjà ouvert et migrations
PostgreSQL locales. Rejouer :

```bash
npx vitest run src/lib/vehicle-sharing.test.ts
DRIVIO_PUPPETEER_MODULE=/chemin/vers/node_modules/puppeteer npm run test:browser:sharing
```

La recette démarre son serveur sur 3211 avec cache et base isolés puis l'arrête.
Elle ne prouve pas un flux Kyros réel, une réception d'e-mail (non implémentée),
un appareil physique ou un déploiement. Aucun déploiement en production.

La revue indépendante a demandé de retirer deux consignes de modification dans
les textes visibles en lecture seule. La correction a été recapturée et notée
résolue, verdict **ship** sur ce point dans `sharing-finish-verdict.md`.
