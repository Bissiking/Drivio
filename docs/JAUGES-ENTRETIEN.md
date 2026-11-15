<!-- docs/JAUGES-ENTRETIEN.md -->
# Jauges du Dashboard et Suivi véhicule

Le Dashboard affiche une jauge segmentée et une icône pour chaque échéance active : pneus, plaquettes, disques, bougies, vidange, filtres, boîte, distribution, contrôle technique, liquide de frein et batterie. Les intitulés proviennent des données du propriétaire ; le jeu d'exemples fourni n'est pas ajouté comme préconisations constructeur.

Cliquer sur une jauge ouvre son détail dans **Suivi véhicule → Usure et entretiens**. Cette page centralise le calcul affiché, ses références, les kilomètres et dates restants, l'ajout d'échéances et l'action « Marquer réalisé » existante.

## Pneus : estimation automatique

La saisie et l'affichage des mesures de gomme sont retirés de l'interface, à la demande du propriétaire. Le montage et le compteur suffisent pour estimer une marge restante :

```text
distance parcourue = compteur connu − compteur au montage
pourcentage estimé restant = 100 × (longévité supposée − distance parcourue) / longévité supposée
```

Le résultat est borné entre 0 et 100 %. La longévité supposée est proposée à **40 000 km** pour tous les montages, anciens et nouveaux, et se règle dans **Suivi véhicule → Pneumatiques → Modifier ou supprimer**. Il s'agit d'une hypothèse du produit, sans affirmation sur la durée réelle ni recommandation constructeur. Un montage futur ou un compteur inférieur à celui du montage produit une valeur indisponible.

La mention **« Usure estimée — contrôle manuel nécessaire »** accompagne les pneus dans le Dashboard, le détail et les prévisions. Le modèle n'estime aucune profondeur en millimètres. À 0 %, la durée supposée est atteinte : le pneu est à faire contrôler, sans déclaration automatique qu'il est réellement usé. La couleur d'avertissement sous 25 % aide à anticiper ; elle n'est pas un seuil technique ou réglementaire.

Les prévisions d'entretien et le budget prudent utilisent la même hypothèse. Le coût de remplacement reste renseigné par le propriétaire ou estimé à partir de ses dépenses passées, et la confiance de cette prévision reste faible.

## Autres entretiens : marge avant échéance

La jauge représente l'intervalle restant avant le prochain contrôle ou remplacement ; elle ne mesure pas l'état physique de la pièce :

```text
marge kilométrique = 100 × (compteur d'échéance − compteur connu) / (compteur d'échéance − compteur de départ)
marge calendaire = 100 × (date d'échéance − aujourd'hui) / (date d'échéance − date de départ)
```

Lorsque les deux références sont connues, la jauge retient la plus petite marge. Une échéance atteinte affiche 0 %. Les kilomètres et dates restent visibles lorsque le pourcentage n'est pas calculable.

La référence provient d'abord des champs facultatifs **Début de l'intervalle** et **Compteur au début de l'intervalle**, réglables dans Suivi véhicule ou à la création d'une échéance. Sinon, Drivio recherche un entretien réalisé compatible ou une ancienne échéance de même nature marquée réalisée. Une correspondance exacte d'intitulé est prioritaire. Les filtres et tâches personnalisées demandent un intitulé correspondant pour éviter de mélanger filtre à huile, filtre habitacle ou plusieurs opérations personnalisées.

Sans référence exploitable, la jauge affiche **À renseigner**. Une référence purement kilométrique ne fabrique pas de date de départ, et inversement. Si seule une des dimensions dispose d'une référence, le détail le précise. Vider les deux champs rétablit la recherche automatique.

Le réglage de la référence ne marque pas l'entretien réalisé. L'action de clôture existante garde son comportement et la création du prochain cycle reste explicite.

## Données et déploiement

La migration additive `20261115210000_maintenance_gauges` existe pour SQLite et PostgreSQL. Elle ajoute `MaintenanceSchedule.cycleStartDate`, `MaintenanceSchedule.cycleStartMileage` et `TireSet.estimatedLifeKm` (défaut 40 000). Les données historiques restent conservées.

Les références sont enregistrées via `PATCH /api/maintenance/[id]/baseline`, avec session et contrôle de propriété. Elles doivent précéder l'échéance, et une date de référence future est refusée. Une échéance déjà réalisée ne peut plus recevoir de référence active. La longévité supposée réutilise l'API de montage existante et sa validation.

Développement : `npm run db:generate`, puis `npm run db:deploy`. Production PostgreSQL : `npm run db:generate:postgres`, puis `npm run db:migrate:postgres`, avant le build et redémarrage du serveur.
