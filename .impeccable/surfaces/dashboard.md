# Dashboard Drivio

## Portée et mode

Surface principale de l'application web, mode Operate. Elle permet de choisir un véhicule du compte, puis montre ses mesures, ses contrats et la prochaine échéance. Les valeurs et les actions restent attachées à ce véhicule, identifié dans l’URL.

## Direction contract 2.1.0

THESIS: Un registre qui permet de choisir son véhicule, agir et lire les priorités avant les détails.
OWN-WORLD: Identité graphite et cuivre conservée, Geist, surfaces mates et séparateurs ; variante claire minérale et palette ardoise.
STORY: Choisir le véhicule, enregistrer un fait, traiter une alerte, comprendre coûts et usage.
FIRST VIEWPORT: Titre et choix véhicule, commandes courantes, identité et compteur avec prochaine échéance, alertes puis synthèse des coûts.
FORM: Extension du registre horizontal existant, sans remplacement de son identité ; graphiques et contrats suivent les priorités.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Direction en vigueur

Évolution 2.1.0 du registre existant, graphite et cuivre, avec les variantes claire et ardoise décrites dans `DESIGN.md`. Le contrat ci-dessus et le code actuel font autorité ; `.impeccable/direction-1.2.0.md` conserve le contexte historique. La composition conserve le bandeau horizontal et les registres continus ; aucune nouvelle maquette de composition n'a été approuvée pour cette évolution.

Les maquettes initiales A et C sont des références historiques de structure, sans autorité sur l'ancienne palette verte ou les photographies nocturnes. `DESIGN.md` documente les règles actuelles partagées.

## Inventaire de fidélité

| Ingredient visible | Engagement | Medium |
| --- | --- | --- |
| Navigation | Treize destinations de bureau ; quatre directes sur mobile et neuf dans Plus ; état actif explicite | HTML/CSS et Lucide |
| Titre | « Votre registre » commence directement la page, sans surtitre décoratif ; accès Garage puis sélecteur explicite du véhicule | HTML/CSS |
| Actions courantes | Plein en primaire, relevé kilométrique et entretiens ; liens associés au véhicule choisi | HTML/CSS et Lucide |
| Bandeau véhicule | Photo personnelle prioritaire sur bureau, fallback modèle ou générique marqué Illustration ; identité, compteur réel et prochaine échéance prioritaires sur mobile | Image raster + HTML/CSS |
| Statistiques | Bandes de valeurs alignées : distance du mois, consommation fiable, carburant et coût d’usage ; provenance attachée aux mesures, absence indiquée | HTML/CSS |
| Entretiens | Prochaines échéances et répartition des interventions réalisées par catégorie ; coûts absents explicitement signalés | HTML/CSS |
| Contrats | Garantie, contrôle technique et assurance dans une surface commune ; lien de suivi pour le véhicule affiché | HTML/CSS |
| Alertes | Échéances avec texte et sévérité, liens vers la saisie concernée | HTML/CSS et Lucide |
| Graphique | Distances observées calculées dans l’accent choisi ; projection grise en tirets ; légende explicite | Recharts/SVG |
| Dépenses et historique | Lignes datées, montants alignés, liens vers les registres | HTML/CSS et Lucide |
| Profondeur et thèmes | Surfaces mates graphite ou minérales, séparateurs fins ; pas d’ombre sur les panneaux au repos ; palettes cuivre ou ardoise | CSS et préférences du compte |

## Adaptation

Sous 1024 px, le rail devient une barre inférieure de 72 px avec Dashboard, Garage, Kilométrage, Entretiens et Plus ; ce dernier ouvre les neuf autres destinations. Le contenu garde une réserve basse de 112 px.

Sous 1280 px, la photo du dashboard est masquée. Le même panneau empile l’identité et le compteur, puis la prochaine échéance ; l’action Plein occupe toute la largeur et les deux autres commandes partagent la ligne suivante sous 640 px. Le titre et le sélecteur précèdent les commandes. Les alertes puis la synthèse des coûts suivent le bandeau et peuvent se poursuivre sous le premier écran mobile. Le Garage conserve les photos à ces largeurs.

À partir de 1280 px, le bandeau devient une grille de trois colonnes (photo contenue, identité/compteur, prochaine échéance), avec un minimum de 300 px pour la zone photographique. Les quatre statistiques principales passent de deux à quatre colonnes. Les prochains entretiens et leur répartition par catégorie se placent côte à côte ; le graphique mensuel partage ensuite la largeur avec un rail de dépenses et d’historique de 360 px. Les contrats se répartissent en trois colonnes à partir de 640 px. Le graphique et les montants restent lisibles sans défilement horizontal global.

## Provenance et comportement

Le compteur est Réel ; les distances observées, la consommation fiable et les sommes des registres sont Calculés. La consommation attend deux pleins complets. L’annualisation est présentée comme un « rythme annualisé estimé depuis l’achat », distinct du kilométrage déjà observé cette année ; les mois futurs restent estimés. Les échéances et jauges partagent la référence et l’arrondi de `src/lib/maintenance-date.ts`.

Les réglages Sombre, Clair et Automatique, ainsi que Cuivre et Ardoise, sont enregistrés sur le compte puis rendus sur `<html>` par le serveur. Le mode automatique suit les changements système par CSS. Les mêmes variables sémantiques alimentent champs, navigation et graphiques.

Les entretiens exposent un intitulé libre puis Catégorie et Sous-catégorie ; les suggestions locales restent explicites, facultatives et modifiables. Les formulaires d’édition conservent leurs valeurs et une action d’enregistrement dédiée.

## Sources de vérification

- `src/app/(app)/dashboard/page.tsx`
- `src/components/dashboard/distance-chart.tsx`
- `src/components/layout/navigation.tsx`
- `src/lib/vehicle-images.ts`
- `src/app/globals.css`, `src/app/layout.tsx`, `src/components/forms/theme-preferences.tsx`
- `src/components/forms/maintenance-type-fields.tsx`, `src/lib/taxonomy.ts`, `src/lib/maintenance-date.ts`
- `.impeccable/review/210-finish-review.md` : revue 2.1.0 et écarts identifiés ; les captures nommées `210-*` documentent les routes locales avec données synthétiques. Leur présence ne prouve ni Kyros réel, ni LUMA réel, ni déploiement, ni appareil physique.
