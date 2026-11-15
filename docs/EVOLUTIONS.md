<!-- docs/EVOLUTIONS.md -->
# Prévisions, rapports et carburants officiels

## Fonctionnalités et conventions

La page **Prévisions** regroupe l'usure et les budgets par véhicule. Elle propose 3, 6 et 12 mois glissants, le scénario habituel et le prudent. Le prudent ajoute les postes potentiels et une marge explicite de 15 % sur les estimations, jamais sur les engagements connus. Le total ne comprend pas les postes dont le coût reste inconnu ; ils sont signalés.

Le rythme kilométrique provient des relevés réels récents et des compteurs des mesures de pneus, sur 180 jours si possible. Une baisse du compteur démarre un nouveau segment. Un intervalle inférieur à 7 jours ne permet pas de calculer un rythme. La confiance baisse si le dernier relevé a plus de 60 jours, si moins de trois points ou moins de 30 jours sont disponibles. Six relevés couvrant au moins 90 jours permettent une confiance élevée sur le rythme. Cette confiance ne garantit pas une durée de vie mécanique.

Les échéances existantes restent prioritaires. Une référence est obligatoire pour marquer une échéance « constructeur ». Aucun catalogue constructeur n'est inventé. Sans échéance, des interventions répétées peuvent produire une estimation historique explicitement potentielle. Le dernier contrôle technique et sa contre-visite éventuelle sont pris en compte.

Les profondeurs de pneus sont des mesures physiques saisies en millimètres. Une projection nécessite un seuil de remplacement choisi, deux mesures cohérentes espacées d'au moins 1 000 km et 14 jours, et une diminution constatée de la gomme. Deux mesures seules gardent une confiance faible. Une mesure supérieure à la précédente empêche d'utiliser cette série comme tendance. Il n'existe aucune conversion automatique du kilométrage en profondeur de gomme.

Les statuts et alertes visuelles figurent dans Prévisions et le panneau d'alertes du Dashboard. Une projection passée demande confirmation ; un seuil choisi atteint lors d'une mesure physique est distingué. Gotify conserve ses alertes d'échéances existantes ; aucune estimation de gomme n'est envoyée comme mesure réelle.

Le budget réutilise `operatingCosts` et `fuelStats`. Les frais miroirs des pleins et entretiens ne sont pas additionnés une seconde fois. Les assurances respectent l'option existante d'intégration aux coûts et s'arrêtent au renouvellement connu, sans reconduction supposée. Les dépenses futures enregistrées remplacent leur estimation correspondante. Les interventions enregistrées après une échéance dépassée sont signalées comme échéances à clôturer, sans nouveau coût. Les rapprochements sans lien explicite utilisent catégorie, montant et proximité de date : vérifier les postes lorsque plusieurs interventions identiques coexistent.

## Rapports PDF

La page **Rapports PDF** permet de sélectionner le véhicule, la période, les sections et les modèles Synthèse, Entretien ou Cession. Le modèle préselectionne les sections, qui restent modifiables. Les échéances décrivent l'état actuel du registre et portent cet intitulé ; le rapport ne reconstitue pas un ancien état des échéances.

Par défaut : immatriculation et VIN masqués, intitulés libres remplacés par les catégories d'entretien ; notes, coordonnées du propriétaire, références de contrat et noms des fichiers exclus. Inclure les champs sensibles exige une action explicite. Les justificatifs originaux exigent cette même autorisation : Drivio ne prétend pas masquer automatiquement une facture ou un scan. Seuls les documents du véhicule, dans la période sélectionnée, sont acceptés. Formats annexables : PDF, JPG et PNG ; WebP reste téléchargeable dans Documents mais n'est pas annexé.

Limites : 5 000 lignes de rapport, 8 pièces et 30 Mo au total, 100 pages par PDF joint et 300 pages au maximum lors de l'ajout des annexes. Les annotations et actions de page des PDF reproduits sont retirées. Les PDF chiffrés ou endommagés doivent être réexportés avant intégration. Chaque téléchargement est authentifié, filtré par propriétaire et envoyé avec `Cache-Control: private, no-store`.

## Saisie de plein et chargements

« Enregistrer un plein » précède les statistiques et graphiques. Le formulaire dépliable et la modale manuelle utilisent le même `FuelForm`, avec les mêmes validations. Station et carburant sont facultatifs pour préserver les anciens pleins.

Dans le registre, la consommation affichée sur une ligne de plein complet décrit le trajet terminé à cette date, depuis le précédent plein complet. Les dates et la distance de cette période sont explicites, y compris en présence d'appoints. Le trajet après le dernier plein complet reste en attente jusqu'au prochain plein complet. Le coût rapporté à 100 km utilise le coût des ravitaillements de clôture, avec les appoints éventuels ; il ne prétend pas identifier le prix d'achat exact de chaque litre effectivement consommé.

Les paramètres mobile et ordinateur sont enregistrés séparément, désactivés par défaut. Le contexte repose sur la largeur et le pointeur tactile, sans dépendance au User-Agent. Un identifiant aléatoire de connexion est conservé lors des rotations Kyros et une contrainte unique en base assure un seul affichage automatique entre onglets et navigations. Les sessions antérieures à cette évolution commencent à utiliser cette fonction lors de leur prochaine connexion. Le registre d'affichage ne contient aucun jeton Kyros.

La modale native gère le focus, Échap et la restitution du focus. Elle est défilable sur petits écrans et se ferme aussi par son bouton ou le fond. Une erreur du déclenchement automatique n'empêche pas l'utilisation de l'application.

Les pages authentifiées bénéficient de `loading.tsx`, d'indicateurs de navigation et de `error.tsx` avec réessai. Les requêtes des nouveaux composants ont une durée limitée ; ApiForm conserve son indicateur de soumission et signale une expiration au bout de 30 secondes. Après expiration d'une écriture, vérifier le registre avant de recommencer, car le serveur peut avoir terminé l'enregistrement.

## Référentiel officiel français

Source : [ZIP/XML instantané enrichi des ruptures](https://donnees.roulez-eco.fr/opendata/instantane_ruptures). Documentation : [site gouvernemental des prix des carburants](https://www.prix-carburants.gouv.fr/rubrique/opendata/). Données publiques sous Licence ouverte, conservées dans la base Drivio.

Le fichier réel `PrixCarburants_instantane_ruptures.xml` est en ISO-8859-1. Les stations sont identifiées par `pdv.id`, sans identifiant reconstitué depuis leur adresse. Les coordonnées officielles sont divisées par 100000. Les prix décimaux du flux instantané sont en euros par litre. Les carburants sont identifiés par leurs IDs officiels : 1 Gazole, 2 SP95, 3 E85, 4 GPLc, 5 E10 et 6 SP98.

`prix.maj` est une date française sans offset, interprétée dans Europe/Paris avec heure d'été/hiver. Elle reste distincte de la date d'observation/import. Un prix inchangé ne prend jamais la date du téléchargement comme date de déclaration. Une nouvelle déclaration à prix identique est conservée séparément d'une variation de montant. Une correction de montant à la même date est conservée ; une déclaration antérieure à la donnée courante provoque un rejet atomique.

Les ruptures comportent le début, la fin éventuelle et leur type. Un type vide reste inconnu. Une date de rupture incohérente est comptée en anomalie, sans date inventée ; la disponibilité de la station est alors signalée incertaine, les estimations de plein sont désactivées et les ruptures déjà connues ne sont pas clôturées par déduction. Quand une rupture disparaît d'un flux valide, sa fin est marquée « absence constatée » ; elle reste distinguée d'une fin officiellement déclarée.

Les prix absents sont désactivés, les stations absentes sont marquées inactives, jamais supprimées. Les historiques et liens des pleins sont conservés ; une station réapparue retrouve son identifiant. Les recherches affichent au plus 50 stations, triées par disponibilité puis prix. La distance est à vol d'oiseau. Les déclarations de plus de 7 jours portent un avertissement. Ce seuil signale une donnée ancienne ; il ne certifie pas les données plus récentes.

La comparaison historique concerne uniquement les pleins explicitement associés à la même station et au même carburant. Elle utilise la dernière déclaration conservée antérieure à la date enregistrée du plein. Le formulaire historique ne connaît pas l'heure du passage : ce rapprochement n'est pas une preuve du prix affiché au moment exact de l'achat. Aucun historique antérieur au premier import n'est reconstitué.

## Contrat Aion

Références analysées dans [Bissiking/Aion](https://github.com/Bissiking/Aion), commit `86c55d48f271dc56c2f056494764a69d997d3775` : [contrat OpenAPI](https://github.com/Bissiking/Aion/blob/86c55d48f271dc56c2f056494764a69d997d3775/contracts/aion-node-contract.yaml), `docs/NODE_CONTRACT_V1.md` et `aion/app/clients/node_client.py`.

**Aion orchestre, Drivio exécute, Aion supervise.** Aucun cron interne, traitement métier ou référentiel public supplémentaire n'est ajouté dans Aion. L'exécution synchrone est autorisée par le contrat.

Configurer Drivio côté serveur :

```dotenv
# Clé entrante utilisée par Aion pour appeler les API Drivio.
AION_API_KEY=<au-moins-32-caracteres-aleatoires>
AION_API_VERSION=1.0
AION_MODULE_ID=drivio
```

La version de contrat supportée est 1.0. La clé entrante est distincte d'un éventuel token de push Aion ; aucun push n'est nécessaire à ce fonctionnement synchrone. Sans clé configurée d'au moins 32 caractères, toutes les API Aion refusent l'accès. La comparaison utilise des empreintes de taille constante.

Routes :

| Méthode | Route | Fonction |
| --- | --- | --- |
| GET | `/health` | Disponibilité HTTP, sans données personnelles |
| GET | `/api/aion/manifest` | Contrat et capacités |
| GET | `/api/aion/jobs` | Découverte des jobs |
| GET | `/api/aion/jobs/fuel-prices-sync` | Description du job |
| POST | `/api/aion/jobs/fuel-prices-sync/start` | Téléchargement, validation et import |

Toutes les routes `/api/aion/*` exigent `Authorization: Bearer <AION_API_KEY>`. Le job annonce `supports_manual_run` et `supports_schedule`, sans arrêt distant. Le résultat renvoie `execution_id`, `status`, `exit_code`, `message`, `logs` structurés et `stats`. Aion conserve la planification, les logs et l'historique. Une concurrence refusée renvoie 409 avec résultat d'exécution échoué ; les autres erreurs d'import renvoient 500. Le dernier import réussi reste consultable.

Dans Aion : ajouter un Node avec l'URL racine de Drivio et la clé entrante ; synchroniser manifest/jobs ; sélectionner `fuel-prices-sync` ; configurer `*/15 * * * *` et un timeout de 600 secondes. Utiliser « Exécuter » pour l'import initial ou manuel. Conserver la planification dans Aion pour pouvoir la modifier librement. Le reverse proxy et l'hébergement Next.js doivent accepter une requête d'au moins 600 secondes ; les offres limitées à quelques secondes ne conviennent pas à ce job synchrone.

## Import, reprise et supervision

Une ligne `FuelSyncState`, créée par la migration, assure un bail de coordination atomique partagé entre processus. Elle ne constitue pas un second historique d'exécutions. Le téléchargement est limité à 60 secondes et 10 Mo ; le XML décompressé à 60 Mo. Les déclarations d'entités et DTD sont refusées. Les identifiants, coordonnées, dates, prix et doublons sont validés avant publication.

Toutes les écritures de référentiel sont dans une transaction de 480 secondes maximum. Une écriture de contrôle du propriétaire du bail empêche une ancienne exécution de publier après une reprise. Le bail initial dure 9 minutes et est renouvelé à l'entrée de la transaction. Une erreur annule les écritures métier, libère le bail lorsque la base répond et conserve le dernier jeu réussi. Après un arrêt brutal, le bail expire ; le lancement suivant peut reprendre.

Les garde-fous refusent un flux de moins de 1 000 stations, une baisse de plus de 15 % du nombre de stations ou des prix actifs lorsqu'un référentiel conséquent existe. Une modification exceptionnelle réelle dépassant ce seuil requiert une investigation et une adaptation explicite du garde-fou ; ne pas supprimer les données pour forcer l'import.

Statistiques : stations créées/modifiées/inchangées/absentes, variations de prix, nouvelles déclarations, changements de rupture, ruptures à date invalide, types de rupture inconnus et durée. Les stations dont l'empreinte métier est inchangée ne recréent ni prix ni historique. Le timestamp de dernière observation est mis à jour séparément.

## Déploiement

1. Sauvegarder la base et le volume privé de documents ; conserver `SESSION_SECRET` pour les sessions et tokens existants.
2. Installer avec `npm ci`.
3. SQLite : `npm run db:generate`, puis `npm run db:deploy` avec l'URL DEV. PostgreSQL : `npm run db:generate:postgres`, puis `npm run db:migrate:postgres` avec l'URL PROD. Ne pas appliquer les migrations d'un provider sur l'autre.
4. La migration ajoutée s'appelle `20261115193000_predictions_fuel_reports` dans les deux répertoires. Elle est additive ; la variante SQLite utilise des `ALTER TABLE ADD COLUMN`, sans reconstruction des tables existantes.
5. Exécuter `npm run lint`, `npm run typecheck`, `npm test`, puis `npm run build`. Le client généré pour la production doit correspondre à PostgreSQL.
6. Configurer les trois variables Aion, le timeout du proxy et le Node Aion. Déclencher le premier import, contrôler ses statistiques, puis activer la planification toutes les 15 minutes.
7. Les nouvelles préférences sont désactivées par défaut. Les utilisateurs intéressés les activent dans Paramètres et se reconnectent.

Validation PostgreSQL supplémentaire : `DRIVIO_TEST_POSTGRES_URL` vers une base de test, puis `node scripts/validate-postgres-migrations.mjs`. Ce script crée un schéma isolé dans une transaction, vérifie les migrations et la conservation de liens anciens, puis annule entièrement sa transaction. Il exige le droit de créer un schéma et ne remplace pas la sauvegarde avant déploiement.
