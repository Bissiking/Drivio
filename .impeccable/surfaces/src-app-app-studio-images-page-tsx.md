---
version: 1
slug: "src-app-app-studio-images-page-tsx"
primary_target: "src/app/(app)/studio-images/page.tsx"
related_targets: ["src/components/forms/vehicle-image-studio.tsx","src/app/api/image-requests/route.ts","src/app/api/image-requests/[id]/route.ts"]
---

<!-- studio-images-input.md -->
# Studio images Drivio

## Portée et mode

Surface de gestion personnelle, mode Operate. Elle transforme les informations d’un véhicule et les choix visuels de l’utilisateur en un prompt exhaustif à générer manuellement hors de Drivio.

## Tâche et actions

Choisir le véhicule, préciser couleur, carrosserie, angle, format, décor, lumière, conditions et détails, enregistrer la demande, copier son prompt puis téléverser le résultat. L’utilisateur peut aussi appliquer directement sa propre photographie ou une URL.

## Direction approuvée

Composition A : grand aperçu à gauche et registre de réglages à droite. L’historique des demandes et l’import personnel prolongent l’atelier sous le premier écran sans modal.

Cette composition reprend l’asymétrie et la densité de la référence approuvée sans reprendre sa promesse de génération intégrée. La photo occupe la majorité visuelle du premier écran ; le formulaire reste néanmoins complet et immédiatement actionnable dans le rail droit. L’ensemble appartient au même registre graphite que le reste de Drivio, sans nouvelle sous-marque ni vocabulaire de cockpit.

## Vérité construite

Le premier panneau est une surface continue à deux zones sur grand écran : aperçu à gauche (`minmax(0, 1.15fr)`) et réglages à droite (`minmax(390px, .85fr)`). L’aperçu conserve une hauteur minimale de 620 px, affiche l’image active avec `object-contain` sur fond noir et superpose en bas l’identité factuelle du véhicule. Le rail droit expose dans le premier parcours le véhicule, la couleur, la carrosserie, l’angle, le format, le décor, l’éclairage, les conditions, le style photographique et les détails complémentaires.

L’action primaire est **Créer la demande**. Elle enregistre un prompt ; elle ne génère jamais une image. Le texte d’introduction doit conserver cette honnêteté en nommant le passage vers « l’outil de ton choix ». Après création, le prompt apparaît dans une surface dédiée, lisible et copiable. Les confirmations et erreurs restent dans le flux, avec `role="status"` ou `role="alert"`, plutôt que dans une notification éphémère.

Sous l’atelier, deux suites complètent le récit sans modal : l’import d’une photographie personnelle et le registre des demandes du véhicule sélectionné. Chaque demande expose sa couleur, son angle, sa date, son décor et un état textuel — **À générer** en ambre discontinu ou **Image ajoutée** en vert — puis permet d’ouvrir le prompt, de le copier et, si nécessaire, d’ajouter le résultat par fichier ou URL. L’ajout d’un résultat le définit comme image active du véhicule.

## Comportement responsive

Sous 1024 px, l’aperçu passe au-dessus du formulaire dans la même surface ; il conserve au moins 288 px de hauteur et une séparation basse. Les groupes de champs utilisent deux colonnes à partir de 640 px, une colonne sur mobile et de nouveau deux colonnes sur les très grands écrans lorsque le rail droit le permet. L’import personnel précède le registre des demandes jusqu’au breakpoint `xl`, où ils forment une grille asymétrique de 40/60.

Les actions du prompt et des demandes s’empilent sur mobile puis se réalignent horizontalement quand la largeur le permet. Aucun contrôle essentiel ne dépend du survol, aucun panneau n’introduit de défilement horizontal global et la barre de navigation mobile conserve sa réserve basse habituelle.

## États et garde-fous

- **Véhicule absent :** une surface centrée explique le prérequis et ouvre le garage ; aucun atelier vide artificiel n’est affiché.
- **Demande absente :** le registre invite à préparer le premier prompt pour le véhicule sélectionné.
- **En cours :** les soumissions partagent un état désactivé explicite et l’action principale devient « Préparation… ».
- **Copie indisponible :** le message demande de sélectionner le prompt manuellement.
- **Import personnel :** accepte JPG, PNG ou WebP, 5 Mo maximum, par fichier ou URL ; un fichier local reste prioritaire.
- **Résultat manquant :** une demande reste récupérable et conserve son prompt tant qu’aucun fichier ni URL n’a été ajouté.
- **Sélection du véhicule :** filtre immédiatement le registre associé et réinitialise le dernier prompt affiché.

## Inventaire de fidélité

| Élément | Engagement | Médium |
| --- | --- | --- |
| Aperçu | Image active ou fallback neutre, identité du véhicule superposée | Image raster et HTML |
| Réglages | Formulaire compact, exhaustif et immédiatement visible | HTML sémantique |
| Prompt | Texte copiable, conservé par demande | Base de données et presse-papiers |
| Résultat | Fichier physique ou URL appliqué au véhicule | API Next.js et stockage local |
| Historique | Liste continue avec état à générer ou image ajoutée | HTML et Prisma |

## Référence approuvée

- `.impeccable/mocks/vehicle-image-studio-a.png`
- Composition A, seed `954df9fd`.

La référence fixe la hiérarchie grand aperçu / réglages / registre. Son bouton « Générer l’image » est une anti-référence fonctionnelle : dans le produit construit, il devient « Créer la demande » et mène à un prompt copiable, conformément à la capacité réelle de Drivio.

## Contraintes

Aucun appel à une IA payante, aucun bouton prétendant générer une image dans Drivio, isolation stricte par utilisateur, import JPG/PNG/WebP limité à 5 Mo et fonctionnement mobile complet.
