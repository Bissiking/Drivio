<!-- DESIGN.md -->
---
name: Drivio
description: Un registre automobile nocturne, factuel et precis.
colors:
  ink: "#0d100f"
  navigation: "#0b0e0d"
  surface: "#131715"
  surface-raised: "#181d1a"
  surface-soft: "#1e2420"
  surface-hover: "#283029"
  line: "#303832"
  line-soft: "#252c27"
  text: "#eef2ed"
  muted: "#9ca9a1"
  quiet: "#87938b"
  accent: "#b8ef8d"
  accent-ink: "#15200f"
  warning: "#e1b86b"
  danger: "#ef9188"
  chart-actual: "#9db19f"
  chart-estimated: "#7b887f"
typography:
  display:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.04em"
    fontFeature: '"tnum" 1, "ss01" 1'
  headline:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: '"tnum" 1, "ss01" 1'
  label:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  bar: "4px"
  badge: "6px"
  control-sm: "8px"
  control: "12px"
  panel: "16px"
spacing:
  hairline: "1px"
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
    padding: "20px"
  source-real:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    typography: "{typography.label}"
    rounded: "{rounded.badge}"
    padding: "2px 6px"
  source-calculated:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.badge}"
    padding: "2px 6px"
  source-estimated:
    backgroundColor: "transparent"
    textColor: "{colors.warning}"
    typography: "{typography.label}"
    rounded: "{rounded.badge}"
    padding: "2px 6px"
---

# Design System: Drivio

## Overview

**Creative North Star: "Registre technique nocturne"**

Drivio ressemble a un registre d'atelier consulte la nuit : sombre, mat et mesure, avec la precision calme d'un instrument de suivi plutot que le spectacle d'un cockpit. Les faits viennent avant les ornements. La photographie automobile nocturne donne un ancrage editorial, puis les donnees reprennent immediatement le dessus dans une trame de surfaces graphite et de regles minerales.

Le systeme organise une lecture continue : voir le vehicule, comprendre son rythme, puis agir sur la prochaine echeance. Le vert clair ne peint pas l'interface ; il signale les faits reels, l'etat actif et les actions utiles. Les nombres dominants, les libelles courts et les sources explicites donnent au produit son autorite tranquille.

Le langage refuse le tableau de bord compose d'une mosaique de tuiles decoratives, les compteurs automobiles skeuomorphes, les halos neon et la surcharge. Les panneaux restent des fragments d'un meme registre, relies par leur rythme, leurs alignements et leurs separateurs.

**Key Characteristics:**

- Graphite mat et profondeur obtenue d'abord par couches tonales.
- Photographie nocturne editoriale, recadree comme une piece de dossier.
- Chiffres tabulaires dominants, titres compacts et libelles factuels.
- Vert precis et rare pour le reel, l'actif et l'actionnable.
- Regles minerales fines qui structurent sans enfermer.
- Distinction visible entre donnees reelles, calculees et estimees.

## Colors

La palette est un nocturne mineral : noirs verts, graphites faiblement chromatiques et accents fonctionnels peu nombreux.

### Primary

- **Vert de precision** (`accent`): reserve aux faits reels, a la navigation active, aux actions textuelles et aux focus ; sa rarete maintient la hierarchie.
- **Encre technique** (`accent-ink`): assure un contraste sombre net sur les commandes pleines vertes.

### Secondary

- **Ambre d'echeance** (`warning`): distingue les maintenances et les estimations, avec des contours en pointilles lorsqu'une valeur n'est pas mesuree.
- **Rouge d'alerte** (`danger`): limite aux retards, erreurs et actions dangereuses.

### Tertiary

- **Sauge mesuree** (`chart-actual`): remplit les barres de donnees observees sans rivaliser avec l'accent interactif.
- **Sauge projetee** (`chart-estimated`): trace les projections sous forme de contours discontinus.

### Neutral

- **Encre de fond** (`ink`): toile generale de l'application.
- **Noir de navigation** (`navigation`): rail et barre mobile, legerement plus profonds que la toile.
- **Graphite mat** (`surface`): panneaux, champs et bandeaux principaux.
- **Graphite releve** (`surface-raised`): surfaces qui chevauchent le contenu, notamment le menu mobile Plus.
- **Graphite actif** (`surface-soft`): navigation selectionnee, commandes secondaires et etats de survol.
- **Graphite de survol** (`surface-hover`): reponse plus claire des commandes secondaires.
- **Regle minerale** (`line`): contours de controles et separations fortes.
- **Regle minerale douce** (`line-soft`): divisions internes et rythme du registre.
- **Blanc craie** (`text`): texte principal et chiffres decisifs.
- **Gris descriptif** (`muted`): contexte, unites et texte secondaire.
- **Gris silencieux** (`quiet`): dates, aides et navigation inactive ; sa valeur normative est `#87938b`.

### Named Rules

**The Precision Green Rule.** Le vert est un signe, jamais un remplissage d'ambiance : il marque le reel, l'actif, le focus ou l'action.

**The Source Honesty Rule.** Reel, calcule et estime restent differenciables par le texte, la couleur et, pour l'estimation, un contour discontinu ; la couleur seule ne porte jamais le sens.

## Typography

**Display Font:** Geist Sans (avec `ui-sans-serif`, `system-ui`, `sans-serif`)
**Body Font:** Geist Sans (avec `ui-sans-serif`, `system-ui`, `sans-serif`)
**Label/Mono Font:** Geist Sans avec chiffres tabulaires

**Character:** Une seule famille neo-grotesque garde le registre direct et contemporain. La personnalite vient de la densite, des espacements de lettres serres sur les grands titres, et de chiffres tabulaires qui stabilisent les comparaisons.

### Hierarchy

- **Display** (medium, `display`, interligne compact): kilometrage principal et mesures qui doivent etre lues avant tout le reste.
- **Headline** (medium, `headline`, interligne serre): identite du vehicule et titres de premier niveau expressifs.
- **Title** (medium, `title`): titre de page et valeurs de metriques.
- **Body** (regular, `body`): navigation, descriptions, lignes d'historique et controles.
- **Label** (medium, `label`, capitales espacees): badges de provenance REEL, CALCULE et ESTIME.

### Named Rules

**The Tabular Fact Rule.** Toute valeur kilometrique, monetaire, datee ou comparative conserve les chiffres tabulaires actives globalement.

**The Quiet Label Rule.** Les libelles secondaires restent petits et sobres ; ils orientent la lecture sans concurrencer le fait chiffre.

## Layout

Le bureau repose sur un rail fixe de 240 px et une zone de travail fluide dont les marges passent de 36 px a 48 px sur les grands ecrans. Le rythme vertical principal est de 28 px. Le premier bandeau est une composition horizontale en trois parties — photographie, identite avec kilometrage dominant, prochaine echeance — puis les quatre metriques forment une seule bande divisee plutot que quatre cartes autonomes. L'analyse et l'historique suivent dans une grille asymetrique avec un rail droit de 360 px.

A partir de 1024 px, le rail lateral est visible et le bandeau adopte sa composition horizontale. En dessous, la navigation devient une barre inferieure fixe de 72 px et le bandeau se replie verticalement sans perdre l'ordre de lecture. A partir de 640 px, les metriques utilisent deux colonnes ; en dessous, elles forment un registre monocolonne. Le contenu mobile conserve 16 px de marge laterale et 112 px de reserve basse afin que la navigation ne masque jamais les actions.

La grille suit un rythme de base de 4 px, avec 12 a 16 px dans les controles, 20 a 24 px dans les panneaux et 28 a 32 px entre les groupes. Aucun defilement horizontal global n'est admis ; les graphiques adaptent leur densite et leurs libelles au viewport.

**The Continuous Register Rule.** Les metriques et listes apparentées partagent une surface et se separent par des regles ; elles ne deviennent pas une collection de cartes flottantes.

## Elevation & Depth

Le systeme est plat par defaut. La profondeur vient de la progression `ink` → `surface` → `surface-raised`, des lignes fines et du recadrage photographique. Une ombre ambiante apparait uniquement lorsqu'une surface doit clairement chevaucher une autre : le bandeau editorial porte une ombre tres diffuse, et le menu mobile Plus une ombre plus dense. Les panneaux ordinaires n'ont pas d'ombre.

### Shadow Vocabulary

- **Editorial ambient** (`0 18px 50px rgba(0,0,0,.18)`): sous le bandeau vehicule pour le detacher subtilement du fond.
- **Overlay ambient** (`0 18px 50px rgba(0,0,0,.42)`): sous le menu mobile Plus, seul panneau reellement superpose.

### Named Rules

**The Tonal-First Rule.** Une difference de niveau utilise d'abord une nuance graphite et une regle ; l'ombre est reservee au chevauchement.

## Shapes

Les formes sont doucement techniques : panneaux a angles arrondis de 16 px, controles a 12 px, petits controles a 8 px et badges a 6 px. Les courbes restent contenues ; aucune pilule gratuite ni silhouette de compteur n'est utilisee. Les panneaux decoupent leurs contenus avec des regles de 1 px et `overflow: hidden` lorsque l'image ou les lignes doivent suivre exactement le rayon externe.

Les barres du graphique ont un sommet legerement adouci de 4 px, tandis que leur base reste alignee sur la ligne de mesure. Les icones sont lineaires, generalement entre 16 et 20 px, avec un trait fin proche de 1.7.

**The Mineral Edge Rule.** Les rayons adoucissent le registre sans le transformer en interface ludique ; chaque courbe doit appartenir a une surface ou un controle reel.

## Components

### Buttons

- **Shape:** controle compact et stable, haut de 40 px avec angles doucement courbes (`control`). Les tailles observees vont de 32 px a 48 px.
- **Primary:** fond vert de precision, texte encre technique, graisse medium et 16 px de padding horizontal.
- **Hover / Focus:** leger assombrissement au survol ; focus visible par un contour vert de 2 px decale de 2 px. Les animations respectent `prefers-reduced-motion`.
- **Secondary / Outline / Danger / Ghost:** graphite doux devenant graphite de survol ; contour mineral transparent au repos ; danger rouge sur teinte translucide ; ghost gris devenant blanc sur graphite.

### Chips

- **Style:** badge de provenance en capitales de 10 px, espacement de 0.08em, padding de 2 px × 6 px et rayon de 6 px.
- **State:** REEL utilise un contour vert translucide ; CALCULE un contour mineral plein ; ESTIME un contour ambre discontinu. Le libelle reste toujours visible.

### Cards / Containers

- **Corner Style:** panneau arrondi contenu (`panel`).
- **Background:** graphite mat ; graphite releve uniquement pour les chevauchements.
- **Shadow Strategy:** aucune ombre sur les panneaux courants ; voir Elevation & Depth pour les deux exceptions.
- **Border:** pas de cadre externe systematique ; des regles douces divisent les en-tetes, lignes et colonnes.
- **Internal Padding:** 20 px sur mobile, generalement 24 px sur ecran large, jusqu'a 32 px dans le bandeau editorial.

### Inputs / Fields

- **Style:** champ graphite de 44 px, contour mineral, angles de 12 px, texte de 14 px et padding horizontal de 12 px.
- **Focus:** le contour bascule vers le vert de precision sans halo decoratif.
- **Error / Disabled:** les erreurs utilisent le rouge d'alerte ; un controle desactive conserve sa structure avec une opacite de 50 % et ne devient pas interactif.

### Navigation

Le bureau utilise un rail fixe noir de 240 px, avec marque en haut, huit destinations explicites et contexte de version en bas. Chaque destination mesure 44 px, utilise une icone lineaire et un libelle de 14 px ; l'etat actif gagne un fond graphite doux, un texte blanc et une icone verte.

Sur mobile, la barre inferieure comporte exactement quatre destinations directes — Dashboard, Garage, Kilometrage et Entretiens — puis un bouton Plus fonctionnel. Plus ouvre au-dessus de la barre un menu de 224 px contenant Carburant, Depenses, Historique et Parametres ; `aria-expanded`, `aria-controls`, `aria-current` et la fermeture apres navigation sont conserves. La barre mesure 72 px, reste fixe et utilise un fond noir a 95 % avec flou d'arriere-plan.

### Vehicle Register

Le bandeau vehicule est la signature du systeme. La photo nocturne ouvre la lecture, l'identite et le kilometrage occupent le centre, et la prochaine echeance termine la phrase. Sur mobile, ces trois fragments deviennent une pile continue dans la meme surface ; l'image reste en tete et aucune information prioritaire n'est repliee.

### Data Chart

Les mesures reelles sont des barres sauge pleines. Les mois futurs utilisent des contours sauge discontinus et transparents. La grille est horizontale, fine et pointillee ; le tooltip reprend le graphite releve, la regle minerale et un rayon de 10 px. La legende repete les badges de provenance.

## Do's and Don'ts

### Do:

- **Do** commencer la lecture par le vehicule, le fait dominant et la prochaine action utile.
- **Do** utiliser les surfaces graphite, les regles de 1 px et les alignements pour construire la profondeur avant toute ombre.
- **Do** garder REEL, CALCULE et ESTIME textuellement explicites dans les mesures et projections.
- **Do** reserver le vert de precision aux faits reels, a l'etat actif, au focus et aux actions utiles.
- **Do** conserver des actions clavieres, un focus visible et une navigation mobile dont le menu Plus fonctionne reellement.
- **Do** recadrer la photographie automobile comme une image editoriale nocturne, jamais comme un fond decoratif illisible.

### Don't:

- **Don't** transformer le dashboard en mosaique de tuiles independantes lorsque des bandes ou listes continues racontent mieux le registre.
- **Don't** ajouter de compteurs, cadrans, textures carbone, chromes, neon ou autres metaphores de cockpit.
- **Don't** utiliser des ombres sur les panneaux au repos ; elles signalent seulement un chevauchement reel.
- **Don't** confondre donnees mesurees, calculs derives et estimations, meme si leurs valeurs semblent proches.
- **Don't** surutiliser l'accent vert, arrondir les controles en pilules ou multiplier les couleurs d'ambiance.
- **Don't** masquer une action prioritaire derriere la barre mobile ni introduire un defilement horizontal global.
