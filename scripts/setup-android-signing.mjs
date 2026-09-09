import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const signingDirectory = join(homedir(), ".config", "drivio");
const keystorePath = join(signingDirectory, "drivio-release.jks");
const propertiesPath = join(signingDirectory, "android-signing.properties");

if (existsSync(keystorePath) && existsSync(propertiesPath)) {
  chmodSync(keystorePath, 0o600);
  chmodSync(propertiesPath, 0o600);
  console.log(`La clé Drivio existe déjà : ${keystorePath}`);
  console.log("Aucun fichier n’a été remplacé.");
  process.exit(0);
}

if (existsSync(keystorePath) || existsSync(propertiesPath)) {
  console.error(
    `Configuration incomplète dans ${signingDirectory}. Aucun fichier n’a été remplacé.`,
  );
  process.exit(1);
}

mkdirSync(signingDirectory, { recursive: true, mode: 0o700 });

const temporaryKeystorePath = `${keystorePath}.tmp`;
const temporaryPropertiesPath = `${propertiesPath}.tmp`;
const storePassword = randomBytes(32).toString("base64url");
const keyPassword = randomBytes(32).toString("base64url");
const keyAlias = "drivio";

const keytool = spawnSync(
  "keytool",
  [
    "-genkeypair",
    "-keystore",
    temporaryKeystorePath,
    "-storetype",
    "JKS",
    "-storepass:env",
    "DRIVIO_GENERATED_STORE_PASSWORD",
    "-alias",
    keyAlias,
    "-keypass:env",
    "DRIVIO_GENERATED_KEY_PASSWORD",
    "-keyalg",
    "RSA",
    "-keysize",
    "4096",
    "-validity",
    "36500",
    "-dname",
    "CN=Drivio, OU=Mobile, O=mhemery.fr, L=Paris, C=FR",
  ],
  {
    encoding: "utf8",
    env: {
      ...process.env,
      DRIVIO_GENERATED_STORE_PASSWORD: storePassword,
      DRIVIO_GENERATED_KEY_PASSWORD: keyPassword,
    },
  },
);

if (keytool.status !== 0) {
  rmSync(temporaryKeystorePath, { force: true });
  console.error("Impossible de générer la clé Android Drivio avec keytool.");
  console.error(keytool.stderr.trim());
  process.exit(keytool.status ?? 1);
}

writeFileSync(
  temporaryPropertiesPath,
  [
    `storeFile=${keystorePath}`,
    `storePassword=${storePassword}`,
    `keyAlias=${keyAlias}`,
    `keyPassword=${keyPassword}`,
    "",
  ].join("\n"),
  { mode: 0o600 },
);

renameSync(temporaryKeystorePath, keystorePath);
renameSync(temporaryPropertiesPath, propertiesPath);
chmodSync(keystorePath, 0o600);
chmodSync(propertiesPath, 0o600);

console.log("Clé de signature Android Drivio créée.");
console.log(`Keystore : ${keystorePath}`);
console.log(`Configuration privée : ${propertiesPath}`);
console.log("Sauvegardez ces deux fichiers ensemble dans un emplacement sécurisé.");
