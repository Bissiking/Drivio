# Partage des véhicules

Mode Operate, extension du Garage Drivio existant. Identité graphite/cuivre,
Geist, surfaces mates et contrôles natifs conservés. Pas de nouvelle imagerie.

## Direction contract

THESIS: Partager un dossier unique en rendant visibles le périmètre et les droits avant d'accepter ou de saisir.
OWN-WORLD: Registre Drivio existant, contrôles alignés, séparateurs fins et accent fonctionnel.
STORY: Le propriétaire invite par e-mail, le destinataire accepte au Garage, chacun retrouve le même véhicule avec ses droits.
FIRST VIEWPORT: Invitations avant la liste ; véhicule partagé explicitement identifié, droits lisibles et accès utiles directs. Sur mobile les champs s'empilent.
FORM: Extension du Garage ; gestion des accès dans un panneau dépliable pleine largeur sous la rangée photo et métadonnées du véhicule, aucune duplication du dossier.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Contrats d'interface

- Simple : carburant, dépenses et kilomètres, avec une synthèse dédiée et des liens limités à ce périmètre.
- Complet : dossier véhicule, entretiens, contrats, documents, statistiques et rapports ; les paramètres privés du propriétaire restent propres à son compte.
- Lecture : formulaires et commandes de modification absents ; aides et liens de consultation formulés sans invitation à modifier. Le serveur contrôle aussi chaque action.
- Lecture/Modification : saisie et correction dans le périmètre autorisé.
- Gestion des partages et choix du véhicule principal réservés au propriétaire.
- Invitation par adresse e-mail du compte Kyros, disponible dans le Garage du destinataire ; aucun e-mail envoyé. Acceptation ou refus explicite, validité de sept jours avant acceptation.
- Invitation en attente / acceptée / expirée, droits modifiables par le propriétaire et retrait explicite.
- Quitter un partage conserve le véhicule et toutes ses données.
- Navigation normale à treize destinations ; sept pour un compte ne contenant que des partages Simple : Dashboard, Garage, Kilométrage, Carburant, Dépenses, Historique, Paramètres.
- Barre mobile normale : Dashboard, Garage, Kilométrage, Entretiens, Plus. En navigation Simple, Carburant remplace Entretiens ; Plus contient Dépenses, Historique et Paramètres.

## Composition réalisée

- Le bouton « Partager le véhicule » du propriétaire se trouve près du compteur. Il ouvre le `<details>` du véhicule, défile jusqu’à lui et place le focus sur son résumé « Partager ce véhicule ».
- Le panneau de partage occupe les deux colonnes du véhicule sur bureau, après la rangée photo et métadonnées. Son ouverture ne prolonge pas la hauteur de la colonne photographique.
- Les invitations reçues sont présentées avant la liste du Garage. Le formulaire « Ajouter un véhicule » reste replié lorsqu’il existe une invitation en attente.
- Les champs s’empilent sur mobile ; les sélecteurs natifs utilisent les options courtes « Simple » / « Complet » et « Lecture » / « Lecture/Modification ». Les définitions de périmètre restent dans le texte voisin et les droits dans les notices d’accès.
- Les partages Simple utilisent un résumé de Garage et un dashboard dédiés. Le Complet en lecture seule conserve les données et liens de consultation, avec des formulations comme « Voir au garage » et « Voir ce montage ».
- Le dossier partagé reste unique. Le partage ne recopie aucun véhicule ni enregistrement et ne change pas son propriétaire.

## Système conservé

Le partage réutilise le registre graphite/cuivre établi, ses variantes claire et
ardoise, Geist Sans, les surfaces mates, les règles minérales et les contrôles
natifs. Cette extension Operate n’introduit ni nouveau monde visuel ni nouvelle
imagerie. Les règles durables sont fusionnées dans `DESIGN.md` ; le sidecar
`.impeccable/design.json` conserve ses primitives et reflète les règles à jour.

## Vérification

Recette locale isolée avec deux contextes Chrome, sessions synthétiques :
`scripts/validate-sharing-browser.mjs`. Preuves sous `.impeccable/review/` :

- `sharing-owner-desktop.png` et `sharing-owner-320.png` : panneau du propriétaire sur bureau et à 320 px.
- `sharing-invitation-mobile.png` : acceptation depuis le Garage mobile.
- `sharing-simple-read-mobile.png` : synthèse et navigation Simple en lecture.
- `sharing-complete-read-mobile.png` : dossier Complet en lecture.
- `sharing-finish-review.md` : revue indépendante et corrections de libellés en lecture seule.

Ces captures et la recette locale utilisent des sessions synthétiques. Elles ne
prouvent ni Kyros réel, ni un appareil physique, ni un envoi d’e-mail, ni un
déploiement en production. Le détail fonctionnel et les limites des droits se
trouvent dans `docs/PARTAGE-VEHICULE.md`.
