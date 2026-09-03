import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import { isNativePlatform } from "./is-native";
import { SCHEMA_SQL } from "./schema";

const DB_NAME = "drivio";

let sqlite: SQLiteConnection | null = null;
let db: SQLiteDBConnection | null = null;
let isInitialized = false;

export async function initDatabase(): Promise<SQLiteDBConnection | null> {
  if (!isNativePlatform()) return null;
  if (isInitialized && db) return db;

  sqlite = new SQLiteConnection(CapacitorSQLite);

  try {
    const ret = await sqlite.checkConnectionsConsistency();
    const isConn = (await sqlite.isConnection(DB_NAME, false)).result;

    if (ret.result && isConn) {
      db = await sqlite.retrieveConnection(DB_NAME, false);
    } else {
      db = await sqlite.createConnection(DB_NAME, false, "no-encryption", 1, false);
    }

    await db.open();
    await db.execute(SCHEMA_SQL);

    isInitialized = true;
    return db;
  } catch (error) {
    console.error("Failed to initialize SQLite:", error);
    return null;
  }
}

export function getDb(): SQLiteDBConnection | null {
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db && sqlite) {
    await sqlite.closeConnection(DB_NAME, false);
    db = null;
    sqlite = null;
    isInitialized = false;
  }
}
