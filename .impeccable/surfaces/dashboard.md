# Dashboard Drivio

## Portée et mode

Surface principale de l'application web, mode Operate. Elle montre le véhicule actif principal, ses mesures, ses contrats et la prochaine échéance. Les valeurs restent attachées à ce véhicule.

## Direction en vigueur

Évolution 1.2.0 du registre existant, graphite et cuivre, décrite dans `.impeccable/direction-1.2.0.md` et le contrat de `src/app/layout.tsx`. La composition conserve le bandeau horizontal et les registres continus ; aucune nouvelle maquette de composition n'a été approuvée pour cette évolution.

Les maquettes initiales A et C sont des références historiques de structure, sans autorité sur l'ancienne palette verte ou les photographies nocturnes. `DESIGN.md` documente les règles actuelles partagées.

## Inventaire de fidélité

| Ingredient visible | Engagement | Medium |
| --- | --- | --- |
| Navigation | Onze destinations de bureau ; quatre directes sur mobile et sept dans Plus ; état actif explicite | HTML/CSS et Lucide |
| Titre | « Votre registre » commence directement la page, sans surtitre décoratif ; accès Garage avec identité du véhicule | HTML/CSS |
| Bandeau véhicule | Photo personnelle prioritaire, fallback modèle ou générique marqué Illustration ; identité, compteur réel et prochaine échéance | Image raster + HTML/CSS |
| Statistiques | Bandes de valeurs alignées, provenance Calculé ou Estimé attachée aux mesures | HTML/CSS |
| Coûts et carburant | Coût du mois, consommation fiable et distance entre pleins ; absence de valeur indiquée explicitement | HTML/CSS |
| Contrats | Garantie, contrôle technique et assurance dans une surface commune ; lien de suivi pour le véhicule affiché | HTML/CSS |
| Alertes | Échéances avec texte et sévérité, liens vers la saisie concernée | HTML/CSS et Lucide |
| Graphique | Distances observées calculées en cuivre ; projection grise en tirets ; légende explicite | Recharts/SVG |
| Dépenses et historique | Lignes datées, montants alignés, liens vers les registres | HTML/CSS et Lucide |
| Profondeur | Surfaces graphite mates, séparateurs fins ; pas d'ombre sur le bandeau ou les panneaux au repos | CSS |

## Adaptation

Sous 1024 px, le rail devient une barre inférieure de 72 px et le bandeau se replie verticalement dans la même surface. Les statistiques principales gardent deux colonnes sur mobile et passent à quatre à partir de 1280 px. La bande des coûts et du carburant passe de deux à trois colonnes à partir de 640 px. À partir de 1280 px, le graphique partage la largeur avec un rail de dépenses et d'historique de 360 px.

L'image est recadrée sur mobile et contenue sur bureau. Le contenu garde une réserve basse de 112 px sous 1024 px. Le graphique et les montants doivent rester lisibles sans défilement horizontal global.

## Sources de vérification

- `src/app/(app)/dashboard/page.tsx`
- `src/components/dashboard/distance-chart.tsx`
- `src/components/layout/navigation.tsx`
- `src/lib/vehicle-images.ts`
- `.impeccable/review/` : 24 captures finales de revue, bureau et mobile, après les corrections de contraste et de titres.
