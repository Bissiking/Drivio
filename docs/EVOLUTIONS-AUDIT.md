<!-- docs/EVOLUTIONS-AUDIT.md -->
# Audit et périmètre des évolutions

L'application utilise des pages serveur Next.js, des formulaires ApiForm, des routes authentifiées par Kyros SSO v4 et un workspace filtré par propriétaire. Les schémas SQLite et PostgreSQL partagent les mêmes modèles.

Les fonctions `fuelStats` / `fuelIntervals` et `operatingCosts` gèrent déjà les pleins partiels et les dépenses miroir. Elles restent les sources des consommations et coûts. `calculateScheduleState` fournit les alertes d'échéance. Pneumatiques, assurances, documents privés et notifications Gotify existent déjà.

Extensions prévues : mesures de gomme et provenance des échéances, prévisions communes usure/budget, rapports PDF privés, référentiel carburant officiel local avec import atomique, contrat Node Aion V1, préférences de formulaire après connexion et chargements Next.js.

Contrat Aion analysé sur `Bissiking/Aion`, commit `86c55d48f271dc56c2f056494764a69d997d3775` : `contracts/aion-node-contract.yaml`, `docs/NODE_CONTRACT_V1.md`, `aion/app/clients/node_client.py`, exemple Node.js. Authentification Aion → Drivio par `Authorization: Bearer`; exécution synchrone admise par le contrat.

Flux officiel téléchargé et inspecté : ZIP contenant `PrixCarburants_instantane_ruptures.xml`, encodage ISO-8859-1, racine `pdv_liste`, identifiants officiels `pdv.id`, coordonnées divisées par 100000, prix décimaux en euros et date `prix.maj` propre à chaque carburant. Les ruptures indiquent `debut`, `fin` éventuellement vide et `type` temporaire/définitive. La date de téléchargement ne remplace jamais `prix.maj`.

Aucune recommandation constructeur, durée de vie standard de pneu ou mesure de gomme n'est déduite arbitrairement du kilométrage. Une référence constructeur doit être saisie explicitement.
