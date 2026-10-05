---
name: Drivio
description: Un registre automobile personnel, graphite et cuivre.
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

Drivio est un registre automobile personnel sombre, mat et précis. Les surfaces graphite, les règles minérales et les chiffres tabulaires font passer les faits avant les ornements. Le cuivre apporte une chaleur mesurée aux commandes et aux informations utiles ; le logo associe un éclair angulaire cuivre au mot-symbole blanc.

La photographie donne au véhicule sa place dans le dossier, puis les données reprennent la lecture. Une photo personnelle est prioritaire ; les images de modèles générées servent de fallback et portent une mention explicite d'illustration. Les panneaux restent lisibles par leur hiérarchie, leurs alignements et leurs séparateurs.

**Key Characteristics:**

- Graphite mat et profondeur par couches tonales.
- Cuivre fonctionnel pour les actions, la sélection et les données visualisées.
- Geist Sans, chiffres tabulaires et titres directs.
- Photographies personnelles prioritaires, illustrations générées identifiées.
- Registres continus et séparateurs fins.
- Provenance Réel, Calculé et Estimé explicitement lisible.

## Colors

Le graphite neutre accueille un accent cuivre chaud ; les alertes ont leurs propres couleurs sémantiques.

### Primary

- **Cuivre utile** (`accent`) : boutons principaux, actions textuelles, icônes actives, focus, mesures réelles et graphiques calculés.
- **Encre cuivre** (`accent-ink`) : texte sombre des commandes pleines cuivre.

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

### Named Rules

**The Useful Copper Rule.** Le cuivre indique une action, une sélection, un focus ou une donnée visualisée ; il ne remplit pas les surfaces d'ambiance.

**The Source Honesty Rule.** Réel, Calculé et Estimé gardent leur libellé explicite ; l'estimation ajoute un contour discontinu. La couleur seule ne porte jamais la provenance.

## Typography

**Display Font:** Geist Sans avec `ui-sans-serif`, `system-ui`, `sans-serif`.
**Body Font:** Geist Sans avec les mêmes fallbacks.
**Label/Mono Font:** Geist Sans avec chiffres tabulaires, sans famille mono distincte.

**Character:** Une famille néo-grotesque unique donne une lecture directe. Les grands titres utilisent un espacement resserré, les chiffres tabulaires stabilisent montants, kilométrages et comparaisons.

### Hierarchy

- **Display** (`display`) : compteur principal ; variante mobile de 3 rem avant le passage à 3.75 rem à partir de 640 px.
- **Headline** (`headline`) : titres de page ; variante mobile de 1.875 rem, puis 2.25 rem à partir de 640 px.
- **Title** (`title`) : titre du registre et valeurs importantes ; les titres de panneaux restent plus compacts à 1 rem, medium.
- **Body** (`body`) : contrôles, navigation, descriptions et lignes de registre. Les descriptions de page utilisent un interligne de 1.5 rem et une largeur maximale de 42 rem.
- **Label** (`label`) : libellés de champs et métadonnées courtes.
- **Source** (`source`) : badges de provenance en capitales espacées ; ce traitement ne devient pas un surtitre de page.

### Named Rules

**The Tabular Fact Rule.** Les nombres kilométriques, monétaires et comparatifs conservent les chiffres tabulaires activés globalement.

**The Direct Title Rule.** Un titre de page commence directement par son intitulé ; les badges de provenance restent attachés aux valeurs qu'ils qualifient.

## Layout

La coque de bureau utilise un rail fixe de 240 px à partir de 1024 px. Le contenu est fluide, avec des marges latérales de 16 px sur mobile, 28 px à partir de 640 px, 36 px à partir de 1024 px et 48 px à partir de 1280 px. L'espacement courant entre groupes est de 28 px.

Sous 1024 px, une barre inférieure fixe de 72 px remplace le rail. La réserve basse du contenu est de 112 px ; les champs et ancres gardent une marge de défilement adaptée à cette barre. Les formulaires sont monocolonne sur mobile et peuvent passer à deux colonnes à partir de 640 px. Les bandes de statistiques restent en deux colonnes sur mobile et passent à quatre sur grand écran lorsqu'elles comportent quatre valeurs.

Le rythme repose sur des pas de 4 px : 12 à 16 px dans les contrôles, 20 à 24 px dans les panneaux, 28 à 32 px entre les groupes. Les tableaux larges défilent horizontalement dans leur panneau. Ce défilement local ne doit pas produire de défilement horizontal global.

**The Continuous Register Rule.** Les mesures apparentées et les listes partagent une surface et se séparent par des règles ; leur lecture reste alignée et continue.

## Elevation & Depth

Les panneaux courants et les bandeaux photographiques sont plats au repos. La profondeur vient des graphites, des séparateurs et du cadre photographique. Le menu mobile Plus utilise une ombre diffuse parce qu'il chevauche le contenu ; les tooltips combinent surface relevée et contour minéral.

### Shadow Vocabulary

- **Overlay ambient** (`0 18px 50px rgba(0,0,0,.42)`) : menu mobile Plus.

### Named Rules

**The Tonal-First Rule.** Un niveau visuel utilise d'abord une nuance graphite et une règle ; l'ombre signale une surface superposée.

## Shapes

Les panneaux ont des angles arrondis contenus (`panel`), les contrôles des angles plus serrés (`control`), les petits contrôles et sélecteurs de véhicule des coins compacts (`control-sm`), et les badges de provenance de petites courbes (`badge`). Les règles mesurent 1 px. Les images et lignes sont découpées au rayon du panneau quand elles rejoignent son bord.

Les sommets des barres de données utilisent le petit rayon `bar`, avec une base alignée. Les icônes Lucide sont linéaires, généralement de 16 à 20 px, avec un trait de 1.7 dans la navigation. La chronologie peut utiliser des repères circulaires fonctionnels ; cette forme n'étend pas les contrôles ordinaires en pilules.

## Components

### Buttons

Commandes compactes, explicites et stables.

- **Shape:** hauteur courante de 40 px, coins `control`, padding horizontal de 16 px ; petite taille de 32 px et grande taille de 48 px.
- **Primary:** cuivre utile avec texte encre cuivre et graisse medium.
- **Hover / Focus:** léger assombrissement du primaire ; contour cuivre de 2 px au clavier. Les transitions respectent `prefers-reduced-motion`.
- **Secondary / Outline / Ghost / Danger:** graphite actif vers graphite relevé ; contour minéral vers graphite actif ; texte descriptif vers blanc chaud ; rouge sur fond rouge translucide pour les actions dangereuses.
- **Disabled:** interaction neutralisée et opacité réduite ; la forme du contrôle reste identifiable.

### Chips

La provenance est courte et explicite.

- **Style:** `source`, capitales, padding de 2 px × 6 px, coins `badge`.
- **State:** Réel en cuivre avec contour translucide ; Calculé en gris descriptif avec contour minéral ; Estimé en ambre avec contour discontinu.

### Cards / Containers

Des fragments de registre, divisés intérieurement.

- **Corner Style:** `panel`, avec découpe des images lorsque nécessaire.
- **Background:** graphite mat ; graphite relevé pour les superpositions.
- **Shadow Strategy:** plat au repos ; voir Elevation & Depth.
- **Border:** séparateurs internes doux ; les champs et tableaux peuvent utiliser une règle plus forte.
- **Internal Padding:** généralement 20 px sur mobile et 24 px sur écran large ; jusqu'à 32 px dans les compositions véhicule.

### Inputs / Fields

Champs sombres, lisibles et sobres.

- **Style:** hauteur de 44 px, fond graphite mat, contour minéral, coins `control`, texte `body` et padding horizontal de 12 px. Les zones de texte démarrent à 96 px et se redimensionnent verticalement.
- **Focus:** contour cuivre, sans halo décoratif ; caret cuivre.
- **Error / Disabled:** messages explicites et rouge sémantique ; les champs désactivés utilisent une opacité réduite.

### Navigation

Le rail de bureau affiche onze destinations avec icône linéaire et libellé. Les lignes mesurent 44 px, avec texte de 14 px et icône de 18 px. L'état actif combine graphite actif, texte blanc chaud, icône cuivre et `aria-current`.

La barre mobile affiche Dashboard, Garage, Kilométrage, Entretiens et Plus. Plus ouvre les sept destinations restantes dans un menu de 224 px, limité à 65dvh avec défilement local. Les liens mesurent 48 px. Le bouton expose `aria-expanded` et `aria-controls` ; le menu se ferme après navigation et via Échap. Le cuivre distingue la destination active.

### Vehicle Image

La photo personnelle locale précède l'URL personnelle, puis l'illustration du modèle ou l'illustration générique. Les images générées portent « Illustration · image générée » et un texte alternatif explicite. L'image occupe son cadre sombre ; elle est recadrée sur mobile et contenue sur bureau. La photo se change dans le Garage.

### Data Chart

Les séries calculées utilisent le cuivre ; les projections utilisent un contour gris discontinu et transparent. La grille horizontale est fine et pointillée, les graduations en gris discret. Les tooltips reprennent le graphite relevé et le contour minéral. Les légendes indiquent Calculé et Estimé lorsque les deux provenances coexistent ; les séries manquantes ne sont pas reliées artificiellement.

## Do's and Don'ts

### Do:

- **Do** utiliser les surfaces graphite, les règles fines et les alignements pour construire la profondeur.
- **Do** réserver le cuivre aux actions, sélections, focus et données visualisées.
- **Do** garder Réel, Calculé et Estimé textuellement explicites.
- **Do** conserver Geist Sans et les chiffres tabulaires pour les faits comparables.
- **Do** privilégier la photo personnelle et identifier les images générées comme illustrations.
- **Do** garder un focus clavier visible, des libellés explicites et le menu mobile Plus fonctionnel.
- **Do** contenir le défilement des tableaux dans leur panneau.

### Don't:

- **Don't** ajouter un surtitre décoratif au-dessus des titres de page.
- **Don't** transformer les registres apparentés en mosaïque de tuiles décoratives.
- **Don't** ajouter des compteurs skeuomorphes, des textures carbone ou des halos néon.
- **Don't** utiliser une illustration générée comme preuve photographique du véhicule personnel.
- **Don't** confondre fait mesuré, calcul et estimation.
- **Don't** ajouter une ombre aux panneaux au repos ou multiplier les couleurs d'ambiance.
- **Don't** masquer une action derrière la navigation mobile ou créer un défilement horizontal global.
