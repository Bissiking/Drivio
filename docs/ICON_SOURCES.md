# Icônes mécaniques

`src/components/maintenance/maintenance-icon.tsx` centralise les pictogrammes des jauges, entretiens et pneumatiques. Lucide reste utilisé pour la navigation et les commandes.

## Material Design Icons — Pictogrammers

Les chemins SVG sont importés individuellement depuis `@mdi/js` (7.4.47), sans police d’icônes ni chargement depuis un CDN.

- Catalogue : https://pictogrammers.com/library/mdi/category/automotive/
- Sources et licence : https://github.com/Templarian/MaterialDesign-JS
- Licence des icônes : Apache-2.0, voir aussi `node_modules/@mdi/js/LICENSE`.
- Utilisation : huile, filtre à air, climatisation, carburant, pneus, freinage, batterie, essuie-glaces, contrôle technique, entretien constructeur, moteur et refroidissement.

## Icon Pantry — Green Pants Studio

Les SVG suivants sont adaptés en JSX dans le composant partagé. Seuls la présentation (taille, couleur, épaisseur du trait) et les attributs React/accessibilité changent ; les tracés d’origine sont conservés.

- Disques : https://iconpantry.com/icons/brake-disc
- Plaquettes : https://iconpantry.com/icons/brake-pads
- Distribution : https://iconpantry.com/icons/timing-belt
- Bougies : https://iconpantry.com/icons/spark-plug
- Filtre à huile : https://iconpantry.com/icons/oil-filter
- Amortisseurs : https://iconpantry.com/icons/shock-absorber
- Boîte de vitesses : https://iconpantry.com/icons/gearbox
- Turbo : https://iconpantry.com/icons/turbocharger

Licence : https://iconpantry.com/license (consultée le 16 novembre 2026). Utilisation dans des applications personnelles ou commerciales et adaptation de la présentation autorisées, sans attribution obligatoire. Les icônes ne peuvent pas être revendues séparément, republiées en tant que pack d’icônes ou revendiquées comme une création de Drivio.

Les icônes sont décoratives : les libellés et les textes accessibles des jauges restent la source d’information. Une catégorie inconnue conserve une icône d’entretien générique. Les intitulés précisent les variantes DSG/boîte, turbo, amortisseurs et filtres sans modifier les données ni les calculs.
