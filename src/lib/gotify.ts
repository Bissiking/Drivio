import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { db } from "./db";
import { vehicleAlerts } from "./alerts";
function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("Clé serveur de chiffrement non configurée.");
  return createHash("sha256").update(`drivio-gotify:${secret}`).digest();
}
export function encryptGotifyToken(token: string) {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map(b => b.toString("base64url")).join(".");
}
export function decryptGotifyToken(encrypted: string) {
  const [iv, tag, data] = encrypted.split(".").map(v => Buffer.from(v, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", key(), iv); decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
export async function pushGotify(token: string, title: string, message: string, urgent = false) {
  const url = new URL(process.env.GOTIFY_URL ?? "https://notify.mhemery.fr");
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("GOTIFY_URL doit être une URL HTTPS sans identifiants.");
  url.pathname = `${url.pathname.replace(/\/$/, "")}/message`; url.search = ""; url.hash = "";
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "X-Gotify-Key": token }, body: JSON.stringify({ title, message, priority: urgent ? 8 : 5 }), signal: AbortSignal.timeout(10000), redirect: "error" });
  if (!response.ok) throw new Error(`Gotify a refusé l’envoi (HTTP ${response.status}).`);
}
export async function sendNotifications(userId?: string, dryRun = false) {
  const settings = await db.notificationSettings.findMany({ where: { enabled: true, tokenEncrypted: { not: null }, ...(userId ? { userId } : {}) } });
  let sent = 0, skipped = 0, failed = 0;
  for (const setting of settings) {
    const vehicles = await db.vehicle.findMany({ where: { userId: setting.userId, status: "ACTIVE" }, include: { mileageReadings: true, schedules: true, warranties: true, inspections: true, insurancePolicies: true } });
    const alerts = vehicles.flatMap(v => vehicleAlerts(v, new Date(), setting)).filter(a => setting[a.category] && a.types.some(type => setting.enabledTypes.split(",").includes(type)));
    for (const alert of alerts) {
      if (dryRun) { skipped++; continue; }
      let claimed = false;
      try {
        await db.notificationDelivery.upsert({ where: { userId_key: { userId: setting.userId, key: alert.key } }, create: { userId: setting.userId, key: alert.key }, update: {} });
        const claim = await db.notificationDelivery.updateMany({ where: { userId: setting.userId, key: alert.key, sentAt: null, OR: [{ claimedAt: null }, { claimedAt: { lt: new Date(Date.now() - 5 * 60000) } }] }, data: { claimedAt: new Date() } });
        if (!claim.count) { skipped++; continue; }
        claimed = true;
        await pushGotify(decryptGotifyToken(setting.tokenEncrypted!), alert.title, alert.detail, alert.urgent);
        await db.notificationDelivery.update({ where: { userId_key: { userId: setting.userId, key: alert.key } }, data: { sentAt: new Date(), claimedAt: null } });
        sent++;
      } catch {
        failed++;
        if (claimed) await db.notificationDelivery.updateMany({ where: { userId: setting.userId, key: alert.key, sentAt: null }, data: { claimedAt: null } });
      }
    }
  }
  return { sent, skipped, failed, dryRun };
}
