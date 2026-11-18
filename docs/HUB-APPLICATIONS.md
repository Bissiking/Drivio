# Autoriser LUMA Hub depuis Drivio

Depuis **LUMA Hub → Personnaliser → Connecter Drivio**, une page dédiée Drivio permet de cocher les véhicules puis **Autoriser LUMA Hub**. Le retour est automatique. Aucun jeton à copier et aucune commande utilisateur. Même compte Kyros requis dans les deux applications. La page `/hub/authorize` est absente de la navigation et non indexable.

Le garage est celui du compte courant ; seuls ses véhicules sélectionnés sont exposés. Les choix précédents sont repris pour modifier une autorisation. Les futurs véhicules et ceux reçus en partage ne sont pas ajoutés automatiquement. Le bouton est inactif lorsque rien n’est sélectionné. L’accès se retire dans **Paramètres → Hub LUMA → Retirer l’accès**, et expire au bout de 90 jours. L’accès manuel antérieur reste sous **Accès manuel avancé**, séparé de l’autorisation applicative.

## Contrat

- Application enregistrée `luma-hub` ; `LUMA_HUB_URL` fixe son origine, défaut local `http://localhost:3000`, callback exact `/api/connectors/drivio/callback`. HTTPS en production.
- Page GET `/hub/authorize` : paramètres stricts `client_id`, `redirect_uri`, `state`, `code_challenge`, `code_challenge_method=S256`. Le retour après connexion Kyros est limité à cette route locale.
- POST `/api/hub/authorize` : session Drivio, origine exacte, intent HMAC lié au compte et au cookie, véhicules possédés et sélection non vide. Refus ou autorisation explicite. Une demande expirée retourne à une page de récupération lisible.
- POST `/api/hub/token` : code aléatoire stocké par empreinte, validité dix minutes, consommation unique atomique et vérification PKCE/callback/client/sujet Kyros. Réponse serveur seulement : jeton `drv_app_…`, scope `widgets:read`, expiration et sujet. Le jeton remplace l’ancien pour ce compte/application.
- POST `/api/hub/revoke` : Bearer applicatif, révocation idempotente. DELETE `/api/preferences/hub/applications?id=…` : session propriétaire et contrôle d’origine.
- Les API v1 existantes acceptent l’accès applicatif en plus du jeton personnel. Liste filtrée par propriétaire ET sélection ; résumé d’un véhicule exclu/tiers/inconnu : 404. Ni cookie Drivio ni JWT Kyros ne remplacent un jeton de lecture de l’API.
- Drivio ne stocke que SHA-256 du jeton. Aucun jeton brut dans les paramètres d’URL, la liste des applications ou les logs applicatifs. Corps d’échange et de consentement bornés avant parsing. Réponses privées `no-store`.

## Migration et validation

Migration additive `20261118120000_hub_application_consent`, présente pour SQLite et PostgreSQL : `HubAuthorization` et `HubApplication`, index et relations utilisateur avec suppression en cascade. Aucun changement d’entretiens, dépenses, véhicules, compteurs ou jetons personnels. Utiliser les migrations du fournisseur correspondant et régénérer Prisma. Les opérations normales d’installation relèvent de l’administration ; le parcours utilisateur est entièrement graphique.

Localement, cette seule migration a été ajoutée au SQLite courant après sauvegarde privée dans `storage/backups/`, avec conservation des nombres d’enregistrements et vérification des clés étrangères. Aucun changement de base en production. Les autres migrations en cours du chantier 2.1.0 ne sont pas déployées par cette intégration.

Tests : `src/lib/hub-authorization.test.ts`, `src/lib/hub.test.ts` ; suite complète de 180 tests/25 fichiers, typecheck et lint passés ; build Next réussi dans une copie isolée. Dans le dépôt voisin LUMA Hub, `npm run test:drivio` lance les vrais serveurs avec bases et sessions synthétiques jetables (Kyros simulé), et vérifie consentement, sélection, widget, annulation et révocation dans Chrome aux largeurs 320/390/1440. Le script `scripts/hub-consent-fixture.ts` est réservé à cette recette isolée et ne modifie aucun garage existant.

Restent hors preuve : compte réel de l’utilisateur, connexion Kyros Drivio réelle, appareil physique et application de la migration PostgreSQL du consentement. Aucun déploiement, push ou tag.
