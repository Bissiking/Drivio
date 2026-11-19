# Revue indépendante Horizon — 19 novembre 2026

Revue complète effectuée après la demande explicite de ressemblance aux deux
maquettes du dépôt. Extension du produit existant par le code, sans composition
mesurée au pixel. Sept captures valides : bureau Horizon et Classic, mobile
Horizon et échéance dépassée, Ajouter à 320 px, paramètres clairs et modale plein.

## Première disposition : `fix`

La revue confirme la typographie, les matières photographiques, les contours,
la palette ardoise/cuivre, la navigation regroupée et la structure générale.
Classic, les paramètres clairs, la modale et les états d’alerte ne présentent pas
de régression visuelle matérielle.

Trois corrections demandées :

1. Compacter les indicateurs et panneaux mobiles afin de lire entièrement les
   trois commandes d’ajout rapide au-dessus de la navigation à 390 × 960 px.
   Conserver les cibles tactiles et la provenance accessible.
2. Montrer le véhicule entier dans le bandeau bureau, avec un fondu continu
   entre la photographie et la surface, sans coupure verticale.
3. Rétablir les icônes cuivre des indicateurs mobiles et distinguer les types
   d’événements dans l’activité récente.

Les trois corrections sont appliquées en un lot. La recette Chrome vérifie
explicitement la position des trois commandes par rapport à la navigation et
la visibilité des quatre icônes. Le verdict après nouvelles captures est
consigné ci-dessous à la fin de la revue.

## Verdict après nouvelles captures : `ship`

1. Résolu : indicateurs mobiles compacts ; les trois commandes et leurs libellés
   tiennent au-dessus de la navigation fixe à 390 × 960 px.
2. Résolu : véhicule entier sur bureau, photographie fondue dans la surface,
   sans l’ancienne coupure verticale.
3. Résolu : quatre icônes d’indicateur visibles sur mobile et icônes propres
   aux types d’événement dans l’activité.

Aucune régression matérielle observée dans le lot de corrections. Ce verdict
couvre les trois points de la revue, sans valider un déploiement ou un appareil
physique.
