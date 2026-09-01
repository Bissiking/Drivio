<!-- dashboard.md -->
# Dashboard Drivio

## Portee et mode

Surface principale de l'application web, mode Operate. Elle doit permettre de comprendre l'etat du vehicule principal et d'atteindre chaque saisie courante en quelques secondes.

## Direction approuvee

Fusion approuvee des maquettes `dashboard-a-photo-ledger.png` et `dashboard-c-horizontal-register.png` : photographie editoriale et navigation explicite de A, lecture horizontale et hierarchie analytique de C.

## Inventaire de fidelite

| Ingredient visible | Engagement | Medium |
| --- | --- | --- |
| Navigation | Rail desktop libelle, navigation mobile compacte, etat actif net | HTML/CSS et Lucide |
| Bandeau vehicule | Photo nocturne, identite, kilometrage et prochaine echeance en une composition horizontale | Image raster generee + HTML/CSS |
| Statistiques | Quatre valeurs alignees, etiquettes REEL/CALCULE/ESTIME toujours explicites | HTML/CSS |
| Graphique | Distance mensuelle avec valeurs reelles pleines et projection en tirets | Recharts/SVG |
| Depenses | Mois et annee dans un rail continu, sans carte imbriquee | HTML/CSS |
| Historique | Lignes datees, icones homogenes et liens fonctionnels | HTML/CSS et Lucide |
| Regles et profondeur | Separateurs fins, surfaces graphite mates, ombre seulement sur les chevauchements | CSS |

## Adaptation

Sous 1024 px, le rail lateral devient une barre inferieure et le bandeau vehicule se replie verticalement. Sous 640 px, les statistiques passent en grille 2x2, le graphique conserve des libelles lisibles et les formulaires restent monocolonne.

## References approuvees

- `.impeccable/mocks/dashboard-a-photo-ledger.png`
- `.impeccable/mocks/dashboard-c-horizontal-register.png`
