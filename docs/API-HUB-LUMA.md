# API Hub LUMA v1 — Drivio 2.1.0

API serveur à serveur, en lecture seule. Préfixe : `/api/hub/v1`.
Toutes les réponses sont JSON, `Cache-Control: private, no-store`,
`Vary: Authorization`. Dates ISO 8601 UTC, montants numériques en EUR,
distances en km. Les valeurs indisponibles valent `null`, jamais un zéro fictif.

## Authentification et révocation

1. Se connecter à Drivio via Kyros SSO v4.
2. Paramètres → Hub LUMA → Créer un jeton LUMA.
3. Copier le jeton, affiché une seule fois, dans les secrets **serveur** du Hub.
4. Envoyer `Authorization: Bearer <jeton>` à chaque requête.

Le jeton possède 256 bits aléatoires, expire après 90 jours et autorise
uniquement `widgets:read`. La base conserve son SHA-256 et son expiration,
jamais le secret. Un seul accès par compte : remplacer ou révoquer invalide
immédiatement le précédent. Le compte propriétaire est déterminé par le jeton,
jamais par un identifiant utilisateur fourni par LUMA. Un jeton Hub ne donne
pas accès aux mutations Drivio, qui continuent d'exiger une session Kyros.

Les cookies Drivio et les JWT Kyros ne sont pas acceptés par les routes Hub.
Le dépôt ne définit aucun échange/délégation de jeton Kyros entre LUMA et
Drivio ; aucun protocole SSO externe n'est inventé. Cette première intégration
repose donc sur un consentement explicite depuis la session Drivio existante.
Utiliser HTTPS hors développement. Ne pas exposer le jeton dans une URL,
le navigateur du Hub, ses journaux, ni un stockage client.

Gestion réservée à la session Drivio :

| Méthode | Route | Réponse |
| --- | --- | --- |
| POST | `/api/preferences/hub` | `{ "token": "drv_hub_…", "scope": "widgets:read", "expiresAt": "…" }` |
| DELETE | `/api/preferences/hub` | `{ "ok": true }` |

## GET /api/hub/v1/vehicles

Liste tous les véhicules du compte, actifs et archivés, principal en premier.
Pagination de 50 résultats : `?offset=50`. `offset` : entier 0–10000.
Continuer avec `nextOffset` jusqu'à `null`.

```json
{
  "version": "1",
  "generatedAt": "2026-11-18T09:00:00.000Z",
  "vehicles": [{
    "id": "vehicle-id",
    "brand": "CUPRA",
    "model": "Formentor",
    "year": 2024,
    "status": "ACTIVE",
    "isPrimary": true,
    "mileage": {
      "value": 35620,
      "unit": "km",
      "source": "recorded",
      "recordedAt": "2026-11-17T00:00:00.000Z"
    }
  }],
  "nextOffset": null
}
```

Compteur : kilométrage final s'il existe, sinon dernier relevé non futur,
sinon compteur d'achat. `recordedAt` peut être `null` si le compteur final
n'a pas de date de vente. Pas de VIN, immatriculation, photo, e-mail ou secret.

## GET /api/hub/v1/summary?vehicle=vehicle-id

Le paramètre `vehicle` est obligatoire, 100 caractères maximum.
Un véhicule absent ou appartenant à un autre compte renvoie le même 404.

```json
{
  "version": "1",
  "generatedAt": "2026-11-18T09:00:00.000Z",
  "vehicleId": "vehicle-id",
  "mileage": { "value": 35620, "unit": "km", "source": "recorded" },
  "maintenance": {
    "items": [{
      "id": "schedule-id", "type": "VIDANGE", "category": "MOTEUR",
      "subcategory": "VIDANGE", "title": "Vidange moteur",
      "dueDate": null, "dueMileage": 36000,
      "status": "SOON", "daysRemaining": null, "kmRemaining": 380,
      "estimatedDate": null
    }],
    "totalInSample": 1, "truncated": false
  },
  "alerts": { "items": [], "truncated": false },
  "expenses": {
    "recent": [{
      "id": "expense-id", "category": "CARBURANT", "subcategory": null,
      "amount": 40, "date": "2026-11-17T00:00:00.000Z"
    }],
    "month": {
      "from": "2026-11-01T00:00:00.000Z", "to": "2026-11-18T09:00:00.000Z",
      "total": 40, "count": 1, "currency": "EUR",
      "source": "recorded", "basis": "expense-ledger"
    }
  },
  "fuel": {
    "entriesInSample": 0, "truncated": false, "from": null, "to": null,
    "consumptionPer100Km": null, "costPer100Km": null,
    "total": 0, "liters": 0, "currency": "EUR", "source": "calculated"
  }
}
```

Exemple de forme, avec données synthétiques. `maintenance.items` contient les
5 premières échéances parmi un maximum de 100 : retards, puis échéances
proches, puis autres ; date et compteur départagent les égalités. Aucun rythme
annuel n'est extrapolé ici. `totalInSample` compte l'échantillon avant la limite
de 5 ; `truncated` indique plus de 100 échéances. `category` et `subcategory`
suivent la classification 2.1.0 ; le code historique `type` est conservé.
Les codes non reconnus n'imposent aucune classification (`null`).

Alertes : au maximum 10 objets `{ key, category, title, detail, urgent }`, issus
des mêmes règles que Drivio : entretien, garantie, contrôle, assurance. La
lecture des garanties est bornée à 20 et les autres contrats au dernier connu.
`truncated` signale une limite atteinte. Les prédictions d'usure ne sont pas
incluses dans cette API. Le Hub peut ajouter des liens vers les routes Drivio
à partir du `vehicleId`, sans interpréter les textes comme des instructions.

Dépenses : 5 dernières écritures jusqu'à maintenant ; total du mois UTC
calculé en SQL sur le registre, **sans échéances d'assurance virtuelles**,
ni achat/revente. Les pleins et entretiens liés sont déjà représentés dans
ce registre et ne sont jamais ajoutés une seconde fois. Les commentaires
personnels des dépenses ne sont pas exposés.

Carburant : calculs bornés aux 100 derniers pleins non futurs. La moyenne est
pondérée par la distance des trajets clôturés entre pleins complets et inclut
leurs appoints. Les données incohérentes sont exclues et l'intervalle avant
le premier plein de l'échantillon est inconnu. `from`, `to` et `truncated`
précisent cette limite : ce n'est pas une moyenne sur toute la vie du véhicule.

## Erreurs

```json
{ "error": { "code": "NOT_FOUND", "message": "Véhicule introuvable." } }
```

| Statut | Code | Situation |
| --- | --- | --- |
| 400 | INVALID_QUERY | Paramètre absent ou invalide |
| 401 | UNAUTHORIZED | Jeton absent, invalide, expiré ou révoqué |
| 404 | NOT_FOUND | Véhicule inaccessible |
| 500 | INTERNAL_ERROR | Service indisponible ; détails internes masqués |

Les méthodes d'écriture ne sont pas implémentées sous `/api/hub/v1` (405).
Pas de CORS public : consommation prévue côté serveur. Recommandation
d'intégration : mutualiser la lecture par compte et véhicule côté Hub,
rafraîchir à la demande ou toutes les 5 minutes, traiter les 401 en demandant
un nouveau jeton. Ajouter une limitation de débit au reverse proxy selon son
infrastructure ; aucune limitation distribuée n'est prétendue par cette version.

## Validation

Tests locaux : `npx vitest run src/lib/hub.test.ts`. Les données et sessions
sont synthétiques dans une base SQLite temporaire. Le consommateur LUMA et
le SSO Kyros réel nécessitent une recette d'intégration séparée.
