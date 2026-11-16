# Pneumatiques : suivi par essieu et estimation

## Saisie et remplacement

Dans **Suivi véhicule → Pneumatiques**, choisir **Avant · 2 pneus**, **Arrière · 2 pneus** ou **Les 4 pneus**, puis renseigner la saison, la marque, la gamme, les dimensions, la date et le compteur du montage. Modèle, gamme et transmission peuvent rester inconnus ; les notes, la longévité personnalisée et le démontage sont regroupés dans les options.

Un nouveau montage clôture automatiquement les anciens pneus uniquement sur les essieux concernés, à sa date et à son compteur. Un remplacement avant après un montage des quatre pneus transforme l'ancien en deux historiques : l'avant démonté conserve son identifiant et l'arrière en service conserve sa date et son compteur de montage, ses caractéristiques, sa référence manuelle et ses anciennes observations. L'opération est transactionnelle. Un remplacement des quatre clôture les deux essieux.

Modifier sert à corriger un montage ; un remplacement s'enregistre comme un nouveau montage. Les chevauchements, dates futures et compteurs incompatibles avec les montages ou observations existants sont refusés. Supprimer un montage ne remet pas automatiquement les précédents en service. Un changement saisonnier s'enregistre comme un nouveau montage ; le produit ne suit pas encore un même jeu stocké puis remonté sur plusieurs périodes.

## Transmission du garage

Le Garage propose **Traction avant**, **Propulsion arrière**, **Transmission intégrale** ou **Je ne sais pas**, à la création et pour chaque véhicule existant. Cette donnée est utilisée directement par les calculs ; aucune transmission n'est déduite du nom commercial, de la motorisation ou de la finition. Une transmission inconnue n'applique aucune correction de motricité.

## Algorithme simple et explicable

Ce modèle fournit une **hypothèse de planification**, pas une mesure d'usure, une préconisation constructeur ou une prédiction étalonnée. Les facteurs ci-dessous sont des choix produit Drivio ; ils ne proviennent pas d'essais comparatifs des marques. Une marque premium ne garantit pas une meilleure longévité que chaque modèle d'une autre gamme. La marque reste libre, avec des suggestions de saisie, sans classement automatique.

Pour chaque essieu :

```text
longévité supposée = arrondi à 500 km(base de gamme × facteur saison × facteur motricité)
distance parcourue = compteur actuel − compteur au montage
km restants = longévité supposée − distance parcourue
part restante = borner(100 × km restants / longévité supposée, 0, 100)
compteur prévu = compteur au montage + longévité supposée
```

| Paramètre | Hypothèse initiale |
| --- | --- |
| Premium | Base 45 000 km |
| Intermédiaire ou gamme inconnue | Base 40 000 km |
| Budget | Base 30 000 km |
| Été ou saison ancienne non renseignée | × 1 |
| Hiver | × 0,90 |
| 4 saisons | × 0,95 |
| Essieu avant d'une traction ou arrière d'une propulsion | × 0,80 |
| Intégrale, chaque essieu | × 0,90 |
| Autre essieu ou transmission inconnue | × 1 |

Exemple : un montage premium 4 saisons sur une traction donne 45 000 × 0,95 × 0,80 = **34 000 km supposés à l'avant**, après arrondi, et **43 000 km à l'arrière**. Les deux essieux conservent chacun leur kilométrage de montage. Le formulaire affiche le résultat en direct et la formule dans **Comment est calculée cette estimation ?**

Une **longévité manuelle** renseignée (100 à 300 000 km) remplace entièrement la formule sur chaque essieu du montage : aucune correction supplémentaire n'est appliquée. Effacer cette valeur réactive le calcul automatique. Les références historiques, dont l'ancien défaut de 40 000 km, sont conservées pour éviter une modification silencieuse des jauges.

Le modèle ignore notamment pression, géométrie, charge, conduite, température, stockage et permutations. Il ne se calibre pas sur les démontages : ils peuvent correspondre à un changement saisonnier ou à une avarie, sans usure complète. Une future calibration historique nécessiterait de distinguer les remplacements pour usure confirmée et les périodes réellement parcourues avec chaque jeu.

## Affichage et prévisions

Dashboard, Suivi et Prévisions partagent la même fonction pure et deux suivis par essieu. Un montage complet est développé en deux estimations ; les anciens doublons en service sont résolus par le montage le plus récent sur chaque essieu. Le résultat reste **Estimé** et porte « Usure estimée — contrôle manuel nécessaire ». Un compteur inférieur à celui du montage ou un montage futur donne un pourcentage indisponible.

À 0 %, seule l'hypothèse est épuisée. Le résultat ne certifie jamais que les pneus sont réellement usés ou encore utilisables. La date prévisionnelle utilise le rythme des relevés réels ; sa confiance reste faible pour les pneus. Aucune profondeur de gomme n'est inventée.

Un coût explicite des quatre pneus est partagé entre les deux essieux pour éviter de le compter deux fois ; lors d'une scission, chaque historique reçoit la moitié du budget. Une dépense historique « Pneus » sans nombre de pneus connu ne permet plus de déduire un prix par essieu : le coût reste à renseigner.

Les [facteurs d'usure décrits par Continental](https://www.continental-tires.com/fr/fr/tire-knowledge/tire-mileage-factors/) et les [explications de Michelin sur la permutation](https://www.michelin.fr/auto/conseils/entretenir-pneus/permutation-des-pneus) motivent la distinction des essieux et la prudence du résultat. Ils ne valident pas nos bases ni nos multiplicateurs.

## Migration et validation

Migration **20261116100000_tire_axles_quality** dans les deux répertoires Prisma : ajout de `Vehicle.drivetrain` et `TireSet.quality` (défaut `UNKNOWN`), `TireSet.estimatedLifeKm` nullable et sans défaut pour les nouveaux montages. SQLite reconstruit `TireSet` en conservant ses identifiants, observations, index et références existantes ; PostgreSQL modifie les colonnes en place.

Après sauvegarde, appliquer la migration correspondant au provider, générer le client Prisma puis construire l'application selon le README. Aucune migration de production n'est exécutée par cette modification.

Tests : validation et propriété des API, conservation de la base historique et des liens, remplacements avant/arrière/complets, scission avec observations, rejet atomique des incohérences, priorité manuelle, formules et cohérence des jauges/prévisions, répartition des budgets. Les tests utilisent des bases SQLite temporaires. PostgreSQL doit encore être vérifié sur une base de test avant déploiement.
