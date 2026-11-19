---
name: Drivio
description: Un registre automobile personnel, graphite et cuivre, aux variantes claire et ardoise.
colors:
  ink: "#111214"
  navigation: "#141518"
  surface: "#1a1b1e"
  surface-raised: "#222327"
  surface-soft: "#2a2b30"
  line: "#404148"
  line-soft: "#303137"
  text: "#f4f0eb"
  muted: "#b2aea9"
  quiet: "#96938e"
  accent: "#e7b58b"
  accent-ink: "#2b1b11"
  warning: "#edc379"
  danger: "#f19a96"
  light-navigation: "#eeece9"
  light-ink: "#f6f4f1"
  light-surface: "#ffffff"
  light-surface-raised: "#ffffff"
  light-surface-soft: "#e7e4df"
  light-line: "#aaa49d"
  light-line-soft: "#d8d3cd"
  light-text: "#262320"
  light-muted: "#5e5851"
  light-quiet: "#6d665f"
  light-accent: "#875029"
  light-accent-ink: "#ffffff"
  light-warning: "#835c13"
  light-danger: "#ab302a"
  slate-accent: "#9ac5f5"
  slate-accent-ink: "#12283e"
  light-slate-accent: "#285e93"
  horizon-ink: "#101720"
  horizon-navigation: "#141d27"
  horizon-surface: "#1b2632"
  horizon-surface-raised: "#25323f"
  horizon-surface-soft: "#2b3948"
  horizon-line: "#465362"
  horizon-line-soft: "#34414f"
  horizon-text: "#f2f4f7"
  horizon-muted: "#bec6cf"
  horizon-quiet: "#a5b0bd"
typography:
  display:
    fontSize: "3.75rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.04em"
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontFeature: "\"tnum\" 1, \"ss01\" 1"
  headline:
    fontSize: "2.25rem"
    fontWeight: 500
    lineHeight: "2.5rem"
    letterSpacing: "-0.035em"
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontFeature: "\"tnum\" 1, \"ss01\" 1"
  title:
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: "2rem"
    letterSpacing: "-0.03em"
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontFeature: "\"tnum\" 1, \"ss01\" 1"
  body:
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontFeature: "\"tnum\" 1, \"ss01\" 1"
  label:
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1rem"
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontFeature: "\"tnum\" 1, \"ss01\" 1"
  source:
    fontSize: "0.625rem"
    fontWeight: 500
    letterSpacing: "0.08em"
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontFeature: "\"tnum\" 1, \"ss01\" 1"
rounded:
  bar: "4px"
  badge: "6px"
  control-sm: "8px"
  control: "12px"
  panel: "16px"
  horizon-panel: "14px"
  horizon-control: "10px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  lg: "20px"
  xl: "24px"
  section: "28px"
  spacious: "32px"
  major: "48px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-danger:
    backgroundColor: "color-mix(in srgb, var(--danger) 12%, transparent)"
    textColor: "{colors.danger}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
  source-real:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    typography: "{typography.source}"
    rounded: "{rounded.badge}"
    padding: "2px 6px"
  source-calculated:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.source}"
    rounded: "{rounded.badge}"
    padding: "2px 6px"
  source-estimated:
    backgroundColor: "transparent"
    textColor: "{colors.warning}"
    typography: "{typography.source}"
    rounded: "{rounded.badge}"
    padding: "2px 6px"
---

# Design System: Drivio

## Overview

**Creative North Star: "Registre technique nocturne"**

Drivio est un registre automobile personnel mat et précis, sombre par défaut. Les surfaces graphite, les règles minérales et les chiffres tabulaires font passer les faits avant les ornements. Le cuivre apporte une chaleur mesurée aux commandes et aux informations utiles ; le logo conserve son éclair angulaire cuivre. La variante claire minérale et l’accent ardoise prolongent ce même registre, avec les mêmes rôles et hiérarchies.

La photographie donne au véhicule sa place dans le dossier lorsqu’elle est affichée ; les données gardent la priorité de lecture. Une photo personnelle est prioritaire ; les images de modèles générées servent de fallback et portent une mention explicite d'illustration. Les panneaux restent lisibles par leur hiérarchie, leurs alignements et leurs séparateurs.

**Key Characteristics:**

- Graphite mat par défaut, variante claire minérale et profondeur par couches tonales.
- Cuivre fonctionnel ou accent ardoise pour les actions, la sélection et les données visualisées.
- Geist Sans, chiffres tabulaires et titres directs.
- Photographies personnelles prioritaires, illustrations générées identifiées.
- Registres continus et séparateurs fins.
- Provenance Réel, Calculé et Estimé explicitement lisible.

Classic reste l’interface par défaut. Horizon est une présentation alternative choisie dans « Accueil et interface » : fonds ardoise, contours visibles, marque automobile linéaire et navigation regroupée. Cette extension conserve les données, la provenance et les droits de Classic. Les règles ci-dessous restent celles de Classic sauf lorsqu’un paragraphe est explicitement marqué Horizon ; les variantes de luminosité et de palette restent indépendantes du choix d’interface.

## Colors

Le graphite neutre accueille un accent cuivre chaud par défaut ; le mode clair inverse les rôles de luminosité et la palette ardoise substitue un accent bleu. Les alertes gardent leurs propres couleurs sémantiques. Le frontmatter enregistre les rôles sombres sans préfixe, leurs variantes `light-*` et les substitutions `slate-*` ; les composants consomment toujours les variables CSS sémantiques, jamais une valeur sombre figée.

### Primary

- **Cuivre utile** (`accent`) : boutons principaux, actions textuelles, icônes actives, focus, mesures réelles et graphiques calculés.
- **Encre cuivre** (`accent-ink`) : texte sombre des commandes pleines cuivre ; blanc en mode clair (`light-accent-ink`).
- **Cuivre minéral** (`light-accent`) : même rôle d’action et de focus en mode clair.
- **Ardoise lumineuse / ardoise profonde** (`slate-accent`, `light-slate-accent`) : accent alternatif des commandes, sélections et graphiques ; `slate-accent-ink` fournit le texte sombre en mode sombre et `light-accent-ink` le texte blanc en mode clair. Le logo garde son cuivre d’identité.

### Secondary

- **Ambre d'échéance** (`warning`) : entretiens, échéances et valeurs estimées.
- **Rouge d'alerte** (`danger`) : retards, erreurs et commandes de suppression.

### Neutral

- **Graphite de fond** (`ink`) : toile générale et cadre sombre des images.
- **Graphite de navigation** (`navigation`) : rail et barre mobile.
- **Graphite mat** (`surface`) : panneaux, champs et registres.
- **Graphite relevé** (`surface-raised`) : menu Plus, tooltips et survol secondaire.
- **Graphite actif** (`surface-soft`) : destination sélectionnée, commandes secondaires et réponses de survol.
- **Règle minérale** (`line`) : champs, contours et séparations fortes.
- **Règle douce** (`line-soft`) : divisions internes des listes et panneaux.
- **Blanc chaud** (`text`) : textes et faits dominants.
- **Gris descriptif** (`muted`) : descriptions, unités et navigation inactive de bureau.
- **Gris discret** (`quiet`) : dates, placeholders, graduations et navigation inactive mobile.

Les rôles `light-navigation`, `light-ink`, `light-surface`, `light-surface-raised` et `light-surface-soft` composent le fond minéral, les panneaux blancs et les états actifs. `light-line` et `light-line-soft` maintiennent les séparations ; `light-text`, `light-muted` et `light-quiet` remplacent les textes clairs par des encres lisibles. `light-warning` et `light-danger` conservent les rôles d’échéance et d’erreur.

La luminosité propose Sombre, Clair et Automatique ; la palette propose Cuivre et Ardoise. Les choix sont conservés sur le compte. Le layout serveur applique `data-theme` et `data-palette` sur `<html>` depuis ce compte, avec le cookie comme repli hors session. Automatique suit `prefers-color-scheme` en CSS, y compris lors d’un changement système, sans script de détection de luminosité.

### Horizon

Les jetons `horizon-*` remplacent uniquement les rôles neutres pour Horizon en Sombre, ou en Automatique lorsque le système est sombre. Ils décrivent l’ardoise bleutée du fond, de la navigation et des surfaces, les contours ardoise et les textes froids. Les accents Cuivre/Ardoise et les couleurs d’alerte restent ceux de la palette choisie. En Clair ou en Automatique clair, Horizon consomme les rôles `light-*` existants. Le dernier bloc Horizon de la feuille globale fait autorité sur les premières règles Horizon : les cartes sont bordées et légèrement dégradées, plutôt que des registres graphite sans contour.

### Named Rules

**The Useful Copper Rule.** Le cuivre, ou l’accent ardoise choisi, indique une action, une sélection, un focus ou une donnée visualisée ; il ne remplit pas les surfaces d’ambiance.

**The Source Honesty Rule.** Réel, Calculé et Estimé gardent leur libellé explicite ; l'estimation ajoute un contour discontinu. La couleur seule ne porte jamais la provenance.

## Typography

**Display Font:** Geist Sans avec `ui-sans-serif`, `system-ui`, `sans-serif`.
**Body Font:** Geist Sans avec les mêmes fallbacks.
**Label/Mono Font:** Geist Sans avec chiffres tabulaires, sans famille mono distincte.

**Character:** Une famille néo-grotesque unique donne une lecture directe. Les grands titres utilisent un espacement resserré, les chiffres tabulaires stabilisent montants, kilométrages et comparaisons.

### Hierarchy

- **Display** (`display`) : compteur principal ; variante mobile de 3 rem avant le passage à 3.75 rem à partir de 640 px.
- **Headline** (`headline`) : titres de page de grande taille ; variante mobile de 1.875 rem, puis 2.25 rem à partir de 640 px. Les pages denses peuvent commencer à 1.5 rem pour garder la place des commandes.
- **Title** (`title`) : titre du registre et valeurs importantes ; les titres de panneaux restent plus compacts à 1 rem, medium.
- **Body** (`body`) : contrôles, navigation, descriptions et lignes de registre. Les descriptions de page utilisent un interligne de 1.5 rem et une largeur maximale de 42 rem.
- **Label** (`label`) : libellés de champs et métadonnées courtes.
- **Source** (`source`) : badges de provenance en capitales espacées ; ce traitement ne devient pas un surtitre de page.

### Named Rules

**The Tabular Fact Rule.** Les nombres kilométriques, monétaires et comparatifs conservent les chiffres tabulaires activés globalement.

**The Direct Title Rule.** Un titre de page commence directement par son intitulé ; les badges de provenance restent attachés aux valeurs qu'ils qualifient.

Horizon conserve cette famille et les chiffres tabulaires, avec une hiérarchie plus affirmée : titre de bureau de 1.9 rem en graisse 600, valeurs des mesures en graisse 600, réduites à 1 rem sur mobile. Les intitulés de groupes dans le rail servent à organiser les destinations ; ce traitement fonctionnel ne crée pas de surtitre décoratif de page.

## Layout

La coque Classic de bureau utilise un rail fixe de 240 px à partir de 1024 px. Le contenu est fluide, avec des marges latérales de 16 px sur mobile, 28 px à partir de 640 px, 36 px à partir de 1024 px et 48 px à partir de 1280 px. L'espacement courant entre groupes est de 28 px.

Sous 1024 px, une barre inférieure fixe de 72 px remplace le rail. La réserve basse du contenu est de 112 px ; les champs et ancres gardent une marge de défilement adaptée à cette barre. Les formulaires sont monocolonne sur mobile et peuvent passer à deux colonnes à partir de 640 px. Les bandes de statistiques restent en deux colonnes sur mobile et passent à quatre à partir de 1280 px lorsqu’elles comportent quatre valeurs. Les commandes courantes se replient en grille mobile avec une action principale sur toute la largeur, puis se disposent en ligne souple à partir de 640 px. Les liens d’action du dashboard gardent une hauteur minimale de 44 px.

Le rythme repose sur des pas de 4 px : 12 à 16 px dans les contrôles, 20 à 24 px dans les panneaux, 28 à 32 px entre les groupes. Les tableaux larges défilent horizontalement dans leur panneau. Ce défilement local ne doit pas produire de défilement horizontal global.

Dans le Garage, les détails de partage s’ouvrent sous la rangée photo et métadonnées, sur toute la largeur du véhicule. Sur bureau, cette extension occupe les deux colonnes ; sa hauteur ne doit pas agrandir la rangée photographique. Sur mobile, les champs s’empilent et les adresses longues peuvent se couper dans leur ligne.

**The Continuous Register Rule.** Les mesures apparentées et les listes partagent une surface et se séparent par des règles ; leur lecture reste alignée et continue.

### Horizon responsive

Horizon conserve le rail de 240 px à partir de 1024 px et la barre basse sous ce seuil ; son contenu a une largeur maximale de 1800 px. Le dashboard utilise des écarts de 22 px sur bureau et 14 px sous 768 px. À partir de 768 px, la synthèse véhicule est un bandeau photographique immersif, avec identité à droite et quatre mesures bordées en une rangée ; les prochaines actions et l’activité occupent deux colonnes. Les trois commandes d’ajout rapide partagent une rangée sur toute la largeur.

Sous 768 px, une identité compacte avec vignette et sélecteur remplace le bandeau et sa grande photo. Les quatre mesures passent à deux colonnes, puis viennent les prochaines actions, l’ajout rapide et l’activité, dans cet ordre. Le sélecteur occupe toute la largeur ; le lien Garage adjacent du bureau est masqué. Les mesures mobiles ont une hauteur minimale de 80 px, avec une icône de 20 px et une valeur de 1 rem sur la même ligne de lecture. Les détails supplémentaires et les badges de provenance de cette synthèse sont masqués visuellement mais restent accessibles dans le DOM ; les analyses détaillées plus bas conservent leur provenance visible. Le titre principal reste accessible et visuellement masqué, sans répétition visible du titre mobile. Les en-têtes de panneaux utilisent un padding de 12 px × 16 px ; les liens de pied gardent une cible minimale de 44 px.

### Safe areas partagées

La barre basse de Classic et Horizon ajoute `env(safe-area-inset-bottom, 0px)` à sa hauteur de 72 px et à son padding inférieur. Le menu mobile se positionne à 82 px plus cette zone ; la confirmation de saisie à 90 px plus cette zone. Le contenu garde sa réserve basse de 112 px. La modale de saisie mobile réserve aussi la zone sûre basse dans son corps et la zone sûre haute dans sa hauteur maximale.

## Elevation & Depth

Les panneaux courants et les bandeaux photographiques sont plats au repos. La profondeur vient des couches tonales, des séparateurs et du cadre photographique, graphite en mode sombre et minérale en mode clair. Le menu mobile Plus utilise une ombre diffuse parce qu'il chevauche le contenu ; les tooltips combinent surface relevée et contour minéral.

Horizon ajoute des contours ardoise et de faibles dégradés entre `surface-raised` et `surface`. Le cadre photographique de bureau est limité à 375 px de large, au plus 52 % du bandeau, et 250 px de haut ; l’image entière est contenue dans ce cadre, avec un fondu sur son bord droit. L’identité conserve une hauteur minimale de 250 px ; le fondu vers la surface sert la lisibilité du texte. Les cartes et mesures restent sans ombre au repos.

### Shadow Vocabulary

- **Overlay ambient** (`0 18px 50px rgba(0,0,0,.42)`) : menu mobile Plus.

### Named Rules

**The Tonal-First Rule.** Un niveau visuel utilise d’abord une nuance de surface et une règle ; l’ombre signale une surface superposée.

## Shapes

Les panneaux ont des angles arrondis contenus (`panel`), les contrôles des angles plus serrés (`control`), les petits contrôles et sélecteurs de véhicule des coins compacts (`control-sm`), et les badges de provenance de petites courbes (`badge`). Les règles mesurent 1 px. Les images et lignes sont découpées au rayon du panneau quand elles rejoignent son bord.

Les sommets des barres de données utilisent le petit rayon `bar`, avec une base alignée. Les icônes Lucide sont linéaires, généralement de 16 à 20 px, avec un trait de 1.7 dans la navigation. La chronologie peut utiliser des repères circulaires fonctionnels ; cette forme n'étend pas les contrôles ordinaires en pilules.

Horizon utilise `horizon-panel` pour les panneaux et le bandeau, `control` pour les mesures, et `horizon-control` pour le sélecteur et les tuiles d’action. Ses destinations de rail gardent des coins `control-sm`. Le bouton central Ajouter est un disque fonctionnel de 46 px : cette silhouette distingue l’action centrale de saisie.

## Components

### Buttons

Commandes compactes, explicites et stables.

- **Shape:** hauteur courante de 40 px, coins `control`, padding horizontal de 16 px ; petite taille de 32 px et grande taille de 48 px.
- **Primary:** accent choisi, texte contrasté `accent-ink` et graisse medium.
- **Hover / Focus:** léger assombrissement du primaire ; contour dans l’accent choisi de 2 px au clavier. Les transitions respectent `prefers-reduced-motion`.
- **Secondary / Outline / Ghost / Danger:** graphite actif vers graphite relevé ; contour minéral vers graphite actif ; texte descriptif vers blanc chaud ; rouge sur fond rouge translucide pour les actions dangereuses.
- **Disabled:** interaction neutralisée et opacité réduite ; la forme du contrôle reste identifiable.

### Chips

La provenance est courte et explicite.

- **Style:** `source`, capitales, padding de 2 px × 6 px, coins `badge`.
- **State:** Réel dans l’accent choisi avec contour translucide ; Calculé en texte descriptif avec contour minéral ; Estimé en ambre avec contour discontinu.

### Cards / Containers

Des fragments de registre, divisés intérieurement.

- **Corner Style:** `panel`, avec découpe des images lorsque nécessaire.
- **Background:** surface mate du thème ; surface relevée pour les superpositions.
- **Shadow Strategy:** plat au repos ; voir Elevation & Depth.
- **Border:** séparateurs internes doux ; les champs et tableaux peuvent utiliser une règle plus forte.
- **Internal Padding:** généralement 20 px sur mobile et 24 px sur écran large ; jusqu'à 32 px dans les compositions véhicule.

### Inputs / Fields

Champs accordés au thème, lisibles et sobres.

- **Style:** hauteur de 44 px, fond de surface du thème, contour minéral, coins `control`, texte `body` et padding horizontal de 12 px. Les zones de texte démarrent à 96 px et se redimensionnent verticalement.
- **Focus:** contour et caret dans l’accent choisi, sans halo décoratif.
- **Error / Disabled:** messages explicites et rouge sémantique ; les champs désactivés utilisent une opacité réduite.

Les sélecteurs de périmètre et de droits restent natifs. Les options courtes « Simple » et « Complet » évitent de tronquer le choix ; un texte voisin explique les fonctions couvertes. « Lecture » et « Lecture/Modification » désignent les droits séparément du périmètre.

### Navigation

Le rail Classic de bureau affiche normalement quatorze destinations avec icône linéaire et libellé. Pour un compte ne contenant que des véhicules reçus en partage Simple, il en affiche huit : Dashboard, Garage, Kilométrage, Carburant, Dépenses, Historique, Paramètres et Ajouter. Les lignes mesurent 44 px, avec texte de 14 px et icône de 18 px. L’état actif combine surface active, texte principal, icône dans l’accent choisi et `aria-current`.

La barre mobile affiche Dashboard, Garage, Kilométrage, Entretiens et Plus. Pour les comptes limités aux partages Simple, Carburant remplace Entretiens. Plus ouvre les dix destinations restantes, ou les quatre restantes en navigation Simple, dans un menu de 224 px, limité à 65dvh avec défilement local. Les liens mesurent 48 px. Le bouton expose `aria-expanded` et `aria-controls` ; le menu se ferme après navigation et via Échap. L’accent choisi distingue la destination active.

### Horizon Navigation

Le rail utilise une marque automobile Lucide CarFront, le nom Drivio et la version réelle ; Classic conserve son éclair et les icônes PWA restent inchangées. « Ajouter au registre » précède quatre groupes : Vue d’ensemble, Suivi, Entretien, Documents et analyses. Les groupes sans destination autorisée sont omis ; Pneumatiques et Échéances rejoignent les destinations d’entretien. Paramètres reste à la base du rail. Le menu central défile localement si la hauteur manque. Les liens courants mesurent au moins 40 px, avec des libellés de 14 px, des icônes de 18 px et un fond d’accent mélangé à la navigation pour la destination active.

Sur mobile, Dashboard et Garage précèdent le bouton central Ajouter ; Suivi véhicule et Menu le suivent. Historique remplace Suivi véhicule pour un compte limité aux partages Simple. Le bouton Ajouter ouvre la modale partagée et est désactivé sans véhicule actif modifiable. Menu réutilise les comportements accessibles de Plus, avec les destinations restantes et sans doublonner Ajouter. Les destinations du rail liées au véhicule conservent son contexte dans l’URL.

L’activité récente utilise une icône correspondant à son type réel : compteur pour un kilométrage, pompe pour un plein, reçu pour une dépense, clé pour un entretien.

### Quick Entry Dialog

Classic et Horizon partagent le même dialogue natif `<dialog>`, titré par `aria-labelledby` et ouvert avec `showModal()`. Le titre reçoit le focus à l’ouverture et le défilement du document est verrouillé. Le dialogue reste centré sur bureau, limité à 48 rem et 90dvh, avec un en-tête fixe dans sa zone de défilement et une fermeture d’au moins 44 px. Sous 640 px, il devient une feuille pleine largeur ancrée en bas, arrondie en haut, avec hauteur adaptée aux zones sûres. Les champs mobiles utilisent 16 px. L’arrivée dure 180 ms et respecte la réduction des animations.

Kilométrage, Plein de carburant et Dépense ouvrent les formulaires partagés ; la page Ajouter reste accessible directement. Les champs restent montés lors d’un changement de type ou d’une fermeture : le brouillon reste dans cet onglet jusqu’à l’enregistrement réussi ou au rechargement de la page. Un envoi en cours bloque fermeture, Échap et changement de type ; hors envoi, Échap, la croix et le fond ferment le dialogue natif. Une réussite ferme la modale, réinitialise le formulaire concerné et annonce la confirmation dans `role="status"`. Les commandes de saisie restent cohérentes avec le droit de modification ; les états vides expliquent la condition requise.

### Vehicle Sharing

Le partage prolonge les panneaux mats du Garage, avec des séparateurs fins et les mêmes contrôles. Le bouton du propriétaire « Partager le véhicule », voisin du compteur, ouvre le panneau natif dépliable « Partager ce véhicule », le fait défiler dans la vue et donne le focus à son résumé. Les invitations reçues précèdent la liste ; lorsqu’une invitation attend une réponse, le formulaire d’ajout de véhicule reste replié.

Le périmètre et les droits sont lisibles avant acceptation, puis dans une notice « Véhicule partagé » sur le dossier reçu. Simple présente une synthèse et des liens limités au carburant, aux dépenses et aux kilomètres ; Complet ouvre les sections du dossier automobile. Le propriétaire garde les commandes d’invitation, de gestion des accès et de choix du véhicule principal. Le destinataire dispose d’une commande explicite pour quitter le partage.

La lecture seule retire les formulaires et commandes de modification des données ; les aides et liens de consultation emploient une formulation neutre, par exemple « Voir au garage » et « Voir ce montage ». Les commandes de consultation, de téléchargement ou d’export autorisées et la sortie du partage restent disponibles. Une action de modification ne doit pas être suggérée par le texte lorsqu’elle est absente de l’interface.

### Vehicle Image

La photo personnelle locale précède l'URL personnelle, puis l'illustration du modèle ou l'illustration générique. Les images générées portent « Illustration · image générée » et un texte alternatif explicite. L’image occupe son cadre lorsqu’elle est affichée. Dans le dashboard Classic, la photographie est masquée sous 1280 px pour privilégier identité, compteur et prochaine échéance ; elle reste contenue dans la première colonne du bandeau sur bureau. Le Garage conserve ses photos sur mobile. La photo se change dans le Garage.

Dans Horizon, le bandeau photographique est affiché à partir de 768 px ; sous ce seuil, seule la vignette du sélecteur véhicule conserve l’image avec sa mention « Illustration » si nécessaire. La grande image garde « Illustration · image générée » et un texte alternatif qui annonce sa nature lorsqu’il s’agit d’un modèle généré.

### Data Chart

Les séries calculées utilisent l’accent choisi ; les projections utilisent un contour gris discontinu et transparent. La grille horizontale est fine et pointillée, les graduations en gris discret. Les tooltips reprennent la surface relevée du thème et le contour minéral. Les légendes indiquent Calculé et Estimé lorsque les deux provenances coexistent ; les séries manquantes ne sont pas reliées artificiellement.

### Maintenance Classification

L’intitulé reste un champ libre distinct des deux sélecteurs Catégorie et Sous-catégorie. Les familles regroupent Freinage, Moteur, Transmission, Échappement, Carrosserie, Pneumatiques, Filtres, Suspension et direction, Électricité et visibilité, Révisions et contrôles, et À classer / personnalisé. « Non précisée » conserve une famille sans imposer une précision artificielle.

Une suggestion locale apparaît sous les champs avec une commande explicite « Utiliser cette suggestion ». Elle ne remplace ni l’intitulé ni le choix manuel sans action. Le retour mentionne les ambiguïtés et l’absence de correspondance certaine ; les messages se lisent en texte dans une région `aria-live`.

### Edit and Preference Forms

Les formulaires d’édition reprennent les valeurs enregistrées et gardent une action d’enregistrement explicite ainsi qu’un retour. Les préférences d’apparence utilisent deux sélecteurs et une commande « Appliquer l’apparence », avec état d’attente désactivé et message `role="status"`. Les accès Hub présentent création, remplacement et révocation comme des actions distinctes ; le jeton révélé une fois reste un champ de copie sélectionnable, accompagné de son expiration et de son périmètre en lecture seule.

Les préférences « Accueil et interface » ajoutent deux choix indépendants : page d’accueil Automatique/Dashboard/Ajouter et interface Classic/Horizon. Elles conservent les mêmes contrôles de formulaire et une confirmation explicite ; leur enregistrement ne remplace pas les préférences de luminosité et de palette.

## Do's and Don'ts

### Do:

- **Do** utiliser les surfaces sémantiques du thème, les règles fines et les alignements pour construire la profondeur.
- **Do** réserver l’accent choisi aux actions, sélections, focus et données visualisées.
- **Do** garder Réel, Calculé et Estimé textuellement explicites.
- **Do** conserver Geist Sans et les chiffres tabulaires pour les faits comparables.
- **Do** privilégier la photo personnelle et identifier les images générées comme illustrations.
- **Do** garder un focus clavier visible, des libellés explicites et le menu mobile Plus fonctionnel.
- **Do** appliquer les règles Horizon uniquement à cette interface et préserver les variantes de luminosité et de palette.
- **Do** conserver la modale native, les brouillons de cet onglet et les conditions de modification dans chaque accès à la saisie.
- **Do** contenir le défilement des tableaux dans leur panneau.
- **Do** préserver les valeurs saisies et laisser les suggestions de classification facultatives et modifiables.
- **Do** présenter ensemble le périmètre et les droits du véhicule partagé, avec des commandes et des aides cohérentes avec cet accès.

### Don't:

- **Don't** ajouter un surtitre décoratif au-dessus des titres de page.
- **Don't** transformer les registres apparentés en mosaïque de tuiles décoratives.
- **Don't** ajouter des compteurs skeuomorphes, des textures carbone ou des halos néon.
- **Don't** utiliser une illustration générée comme preuve photographique du véhicule personnel.
- **Don't** confondre fait mesuré, calcul et estimation.
- **Don't** ajouter une ombre aux panneaux au repos ou multiplier les couleurs d'ambiance.
- **Don't** masquer une action derrière la navigation mobile ou créer un défilement horizontal global.
- **Don't** inviter à modifier une donnée depuis une aide ou un lien affiché en lecture seule.
