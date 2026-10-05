import "dotenv/config";
import { db } from "../src/lib/db";
import { sendNotifications } from "../src/lib/gotify";
async function main() {
  try {
    const result = await sendNotifications(undefined, !process.argv.includes("--send"));
    console.log(JSON.stringify(result));
    if (result.failed) process.exitCode = 1;
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error("Traitement des notifications impossible. Vérifiez la base et la configuration serveur."); process.exitCode = 1; });
