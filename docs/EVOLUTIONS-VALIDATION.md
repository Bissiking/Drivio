<!-- docs/EVOLUTIONS-VALIDATION.md -->
# Validation des évolutions — 15 novembre 2026

Les validations ont utilisé des bases et comptes de test jetables. Aucune base de production, connexion Kyros réelle ou configuration Aion distante n'a été modifiée.

## Contrôles automatisés

- `npm run lint` : réussi, sans avertissement ESLint.
- `npm run typecheck` : réussi.
- `npm test` : 87 tests, 12 fichiers, tous réussis.
- `npm run build` : compilation Next.js et génération des routes réussies.
- Validation Prisma des deux schémas : réussie.
- SQLite : toutes les migrations appliquées avec `prisma migrate deploy` sur une base temporaire ; comparaison entre base migrée et schéma par `prisma migrate diff --exit-code` sans différence.
- Tests de migration SQLite sur des données anciennes : véhicules, compteurs, photos, dépenses et liens conservés ; aucune violation de clé étrangère.
- PostgreSQL : chaîne de migrations exécutée sur PostgreSQL embarqué PGlite ; anciennes lignes User/Vehicle/FuelEntry/Expense et lien de dépense conservés, nouveaux paramètres désactivés. Aucun serveur PostgreSQL distant n'était disponible. Un script de vérification sur serveur de test est fourni : `scripts/validate-postgres-migrations.mjs`.

Les nouveaux tests couvrent : rythme observé et corrections de compteur, confiance et données insuffisantes, seuils physiques, prévisions sans recommandation inventée, déduplication des dépenses passées/futures et assurances, scénarios, archivage, format et encodage du ZIP/XML, dates françaises et anomalies, rejet des flux incomplets, répétition, variations/déclarations, clôture des ruptures, concurrence du bail, reprise après expiration et annulation transactionnelle.

Les tests d'API refusent les requêtes personnelles sans session, les véhicules/pneus/pièces d'autrui et les comparaisons sur un véhicule non autorisé. Ils vérifient les trois modèles PDF, les périodes invalides, l'autorisation explicite des annexes, le masquage des identifiants et textes libres, le téléchargement privé, la pagination, la clé Bearer Aion et l'affichage unique de la modale entre requêtes concurrentes. Les tests de consommation existants continuent de passer.

Un test d'authentification préexistant a été stabilisé : modifier le dernier caractère Base64 pouvait laisser les octets inchangés. Le test altère désormais les bits significatifs du tag d'authentification. Un test supplémentaire confirme que l'identifiant de connexion est conservé lors d'une rotation, sans modifier le fonctionnement cryptographique de Kyros.

Clarification du registre carburant : cas de régression du 3 au 14 novembre (38 467 → 39 099 km, 42,6 L et 83,01 €), soit 632 km, environ 6,7 L/100 km et 13,13 €/100 km pour le trajet terminé. Le test vérifie qu'aucun trajet futur n'est calculé sans nouveau plein. Un autre cas vérifie que les appoints n'écourtent pas la période entre pleins complets. Le tableau rendu a été contrôlé sur bureau et mobile avec ces valeurs, sans débordement horizontal global ; seul le tableau défile sur petit écran.

## Flux officiel complet

Archive téléchargée depuis `https://donnees.roulez-eco.fr/opendata/instantane_ruptures`, SHA-256 :

```text
f206b79d67a473fe020ecd263edb2e5c11ececfc20d47800290aa18111f8f8d8
```

Import initial dans SQLite :

| Indicateur | Résultat |
| --- | ---: |
| Stations | 9 831 |
| Déclarations de prix | 31 304 |
| Événements de rupture valides | 25 134 |
| Ruptures avec date incohérente | 13 |
| Types de rupture non renseignés | 1 013 |
| Durée d'import mesurée | environ 28 secondes |

Répétition du même flux : 9 831 stations inchangées, aucune nouvelle déclaration, variation ou rupture ; environ 34 ms dans la base de test. Ces temps locaux ne constituent pas un engagement de performance pour PostgreSQL distant. L'historique n'est pas dupliqué.

Les anomalies du flux ont été conservées comme anomalies de qualité, sans correction arbitraire de date ni assimilation d'un type inconnu à une rupture temporaire. Une disponibilité incertaine désactive l'estimation du prochain plein.

## Navigateur et PDF

Contrôles avec Edge via Playwright, bureau 1 440 × 1 000 et mobile tactile 390 × 844 :

- formulaire de plein situé avant les statistiques ; saisie et enregistrement réussis depuis les deux appareils ;
- modale automatique affichée une seule fois, y compris après rechargement et navigation ;
- ouverture manuelle indépendante du formulaire dépliable ;
- focus clavier contenu dans la modale, fermeture par Échap et bouton Fermer ;
- formulaire mobile défilable et application accessible après fermeture ;
- recherche d'une station, prix et historique consultables ;
- pages Prévisions, Rapports et Paramètres sans débordement horizontal global ;
- téléchargement des trois modèles PDF sur les deux appareils ;
- alerte du Dashboard après enregistrement d'une profondeur physique sous le seuil choisi ;
- aucune erreur JavaScript de page observée.

Trois PDF représentatifs ont été générés, rendus en PNG et inspectés visuellement, dont un dossier d'entretien sur plusieurs pages. Les retours à la ligne respectent les mots, les tableaux répètent leurs en-têtes, les pages sont numérotées et la palette graphite/cuivre est présente. Les exemples et captures de test sont temporaires, sous `tmp/`, exclus de Git.

Le détecteur Impeccable a été exécuté une fois sur les surfaces modifiées. Son unique remarque concernait la couleur du fond de modale ; ce fond utilise maintenant le jeton d'encre existant. Il n'a pas signalé d'autre problème sur ces cibles. Les métadonnées Impeccable du dépôt sont anciennes et ne sont pas régénérées dans ce chantier ; DESIGN.md reste la référence. Une version plus récente du skill est disponible.

## Limites et vérifications au déploiement

### Jauges et simplification des pneus

À la demande du propriétaire, les jauges segmentées avec icônes sont ajoutées au Dashboard et détaillées dans Suivi véhicule. La saisie et l'affichage des mesures de gomme sont retirés de l'interface. Les pneus sont estimés selon le kilométrage depuis le montage et une longévité supposée de 40 000 km, modifiable ; aucune profondeur n'est inventée. La mention « Usure estimée — contrôle manuel nécessaire » est visible.

Les essais navigateur sur bureau et mobile ont vérifié les icônes et jauges, le lien vers le détail, l'enregistrement d'une référence d'entretien, la modification de la longévité supposée et la cohérence des prévisions. Aucune erreur JavaScript ni aucun débordement horizontal de page n'a été observé. Les tests couvrent les pourcentages 100/50/0, les seuils calendaires et kilométriques, les références manuelles/automatiques, les données insuffisantes, les filtres et tâches personnalisées distincts, les montages incohérents et la sécurité de l'API des références.

La migration additive `20261115210000_maintenance_gauges` est validée sur SQLite et PostgreSQL embarqué. La base SQLite locale possède les trois nouvelles colonnes et son schéma est comparé à Prisma sans dérive. Le détail des choix et du déploiement est dans [JAUGES-ENTRETIEN.md](JAUGES-ENTRETIEN.md).

- Le job Aion expose le contrat vérifié dans son dépôt ; sa configuration distante et une exécution de bout en bout depuis l'instance réelle restent à effectuer après renseignement de la clé et déploiement.
- Valider les migrations sur une copie de la base PostgreSQL cible, puis sauvegarder avant application.
- Configurer une durée HTTP d'au moins 600 secondes pour l'import synchrone. L'hébergement doit permettre l'exécution serveur Node.js et le stockage persistant déjà utilisé par Drivio.
- Les prévisions restent dépendantes des données saisies ; coûts et profondeurs inconnus restent explicitement indisponibles.
- L'historique officiel commence au premier import. Les anciens pleins sans station/carburant ne sont pas rattachés automatiquement.
- Les annexes PDF/JPG/PNG sélectionnées explicitement peuvent contenir des informations personnelles et exigent l'option sensible. Les notes et coordonnées du propriétaire restent exclues du rapport généré.
