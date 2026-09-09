<!-- README.md -->
# Drivio

Drivio 1.0.3 est une application web personnelle de suivi automobile. Elle réunit le garage, les relevés kilométriques, les entretiens, les pleins, les dépenses et leur historique dans une interface responsive sombre.

## Fonctionnalités

- dashboard du véhicule principal avec valeurs réelles, calculées et estimées clairement distinguées ;
- garage multi-véhicules avec photo physique ou URL, archivage et véhicule principal unique ;
- relevés kilométriques monotones par défaut et corrections explicites ;
- échéances d’entretien par date, kilométrage ou les deux ;
- dépenses consolidées et coût par kilomètre ;
- pleins avec prix au litre automatique et consommation fiable entre pleins complets ;
- chronologie unifiée ;
- Studio images sans abonnement : demandes détaillées à copier, suivi des résultats et import de sa propre photo ;
- authentification Kyros SSO v4 uniquement.

## Stack

Next.js 16, React 19, TypeScript strict, Tailwind CSS 4, composants shadcn/ui locaux, Prisma 7, SQLite en développement et PostgreSQL en production.

## Installation locale

Prérequis : Node.js 24, npm et une application Kyros configurée en SSO v4.

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Ouvrir `http://localhost:3000`. Le `KYROS_DEMO_SUB` du fichier `.env` doit correspondre au claim `sub` du compte Kyros utilisé pour retrouver les données seed.

Le seed crée une CUPRA Formentor 2024, motorisation 1.5 TSI 150 DSG7, avec relevés, pleins, entretiens, dépenses et échéances autour de 35 000 km.

## Configuration Kyros v4

Créer une application Kyros v4 avec le callback exact :

```text
http://localhost:3000/auth/callback
```

Drivio exécute le flux suivant :

1. génération de `state` et d’un couple PKCE S256 ;
2. `POST /par` avec le handshake `kyros_sso_version=v4` ;
3. redirection vers `/authorize` avec le `request_uri` ;
4. contrôle de `state` et de `iss` au callback ;
5. échange du code sur `/token` avec le `code_verifier` ;
6. vérification RS256 depuis `/sso/v4/jwks`, puis contrôle de `iss`, `aud`, `resource_aud`, `exp` et `nbf` ;
7. conservation chiffrée du refresh token dans le cookie `HttpOnly`, avec rotation silencieuse avant expiration de l'access token.

Variables requises :

- `NEXT_PUBLIC_APP_URL`
- `SESSION_SECRET` (32 caractères minimum)
- `KYROS_BASE_URL`
- `KYROS_ISSUER` (valeur du claim `iss`, généralement `kyros`)
- `KYROS_CLIENT_ID`
- `KYROS_CLIENT_SECRET` si le client est confidentiel
- `KYROS_AUDIENCE` (audience JWT globale, généralement `kyros-modules`)
- `KYROS_RESOURCE_AUDIENCE`
- `KYROS_SCOPES` (inclure `offline_access`)

Il n’existe pas de mot de passe local ni de contournement d’authentification en développement.

## Base de données

Le schéma de développement est [prisma/schema.prisma](prisma/schema.prisma). Le schéma PostgreSQL compatible est [prisma/schema.postgresql.prisma](prisma/schema.postgresql.prisma). Les modèles métier et index sont identiques.

Développement SQLite :

```bash
DATABASE_URL="file:./prisma/dev.db" npm run db:generate
DATABASE_URL="file:./prisma/dev.db" npm run db:migrate
DATABASE_URL="file:./prisma/dev.db" npm run db:seed
```

Production PostgreSQL :

```bash
DATABASE_URL="postgresql://user:password@host:5432/drivio" npm run db:generate:postgres
DATABASE_URL="postgresql://user:password@host:5432/drivio" npm run db:migrate:postgres
npm run build
```

La génération PostgreSQL doit précéder le build de production afin que le client Prisma corresponde à l’adaptateur PostgreSQL.

## Photos

Les téléversements JPG, PNG et WebP sont limités à 5 Mo et écrits sous `public/uploads`. Le contenu de ce dossier est ignoré par Git. En production, monter ce dossier sur un volume persistant. Une URL externe peut être fournie à la place.

Le Studio images ne contacte aucun service d’IA. Il construit et conserve un prompt détaillé à utiliser manuellement dans l’outil choisi par l’utilisateur. Le résultat peut ensuite être téléversé ou référencé par URL et devient l’image active du véhicule. Une photo personnelle peut être appliquée directement, sans créer de demande. Les véhicules sans photo utilisent le fallback générique `public/demo/vehicle-default.png`.

## Calculs

- distance : nouveau kilométrage moins relevé précédent ;
- moyenne quotidienne : distance totale divisée par le nombre de jours observés ;
- moyenne mensuelle : distance totale divisée par le nombre de mois observés ;
- projection annuelle : moyenne quotidienne multipliée par 365 ;
- prix au litre : prix total divisé par les litres ;
- consommation fiable : litres cumulés depuis le plein complet précédent divisés par la distance, multipliés par 100 ;
- coût aux 100 km : coût carburant de la période divisé par la distance, multiplié par 100 ;
- coût par kilomètre : dépenses totales divisées par les kilomètres parcourus depuis l’achat.

Les fonctions pures et leurs tests se trouvent dans `src/lib/calculations.ts` et `src/lib/calculations.test.ts`.

## Architecture

```text
src/
  app/
    (app)/                 pages authentifiées
    api/                   SSO, uploads, demandes d’images et mutations métier
  components/
    dashboard/             graphiques
    forms/                 formulaires connectés aux API
    layout/                navigation et surfaces
    ui/                    composants shadcn/ui locaux
  lib/                     auth, Kyros, Prisma, calculs, validation Zod
prisma/
  migrations/              migration SQLite V1
  schema.prisma            développement SQLite
  schema.postgresql.prisma production PostgreSQL
  seed.ts                  données de démonstration
public/
  demo/                    photos de démonstration et fallback générique
  uploads/                 photos utilisateur non versionnées
```

## Qualité

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev
```

Les données sont systématiquement filtrées par l’utilisateur Kyros côté serveur. Les entrées sont validées avec Zod et les erreurs métier sont affichées dans les formulaires.

## Sécurité

- aucun secret n’est versionné ;
- cookie de session chiffré `A256GCM`, `HttpOnly`, `SameSite=Lax` et `Secure` en production ;
- refresh Kyros v4 rotatif, sérialisé contre les requêtes concurrentes et révoqué à la déconnexion ;
- validation stricte du type et de la taille des photos ;
- callback Kyros exact et jetons limités à RS256 ;
- propriété des véhicules vérifiée avant toute mutation.
