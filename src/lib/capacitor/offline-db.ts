import { getDb } from "./sqlite";
import { isNativePlatform } from "./is-native";

export interface OfflineVehicle {
  id: string;
  userId: string;
  brand: string;
  model: string;
  trim: string;
  powertrain: string | null;
  year: number;
  registration: string | null;
  vin: string | null;
  purchaseDate: string;
  purchaseMileage: number;
  purchasePrice: number | null;
  saleDate: string | null;
  finalMileage: number | null;
  salePrice: number | null;
  status: string;
  isPrimary: number;
  photoPath: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  isSynced: number;
  pendingOperation: string | null;
  isDeleted: number;
  serverVersion: number;
}

export type OfflineEntityType =
  | "vehicle"
  | "mileage_reading"
  | "maintenance_record"
  | "maintenance_schedule"
  | "expense"
  | "fuel_entry";

const TABLE_MAP: Record<OfflineEntityType, string> = {
  vehicle: "vehicles",
  mileage_reading: "mileage_readings",
  maintenance_record: "maintenance_records",
  maintenance_schedule: "maintenance_schedules",
  expense: "expenses",
  fuel_entry: "fuel_entries",
};

export async function upsertEntity<T extends Record<string, unknown>>(
  entityType: OfflineEntityType,
  data: T
): Promise<void> {
  if (!isNativePlatform()) return;
  const db = getDb();
  if (!db) return;

  const table = TABLE_MAP[entityType];
  const columns = Object.keys(data);
  const placeholders = columns.map(() => "?").join(", ");
  const values = Object.values(data);

  const sql = `
    INSERT INTO ${table} (${columns.join(", ")}, is_synced, pending_operation, updated_at)
    VALUES (${placeholders}, 0, 'upsert', datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      ${columns.map((c) => `${c} = excluded.${c}`).join(", ")},
      is_synced = 0,
      pending_operation = 'upsert',
      updated_at = datetime('now')
  `;

  await db.run(sql, values as string[]);
}

export async function markSynced(
  entityType: OfflineEntityType,
  id: string,
  serverVersion: number
): Promise<void> {
  if (!isNativePlatform()) return;
  const db = getDb();
  if (!db) return;

  const table = TABLE_MAP[entityType];
  await db.run(
    `UPDATE ${table} SET is_synced = 1, pending_operation = NULL, server_version = ? WHERE id = ?`,
    [serverVersion, id]
  );
}

export async function markDeleted(entityType: OfflineEntityType, id: string): Promise<void> {
  if (!isNativePlatform()) return;
  const db = getDb();
  if (!db) return;

  const table = TABLE_MAP[entityType];
  await db.run(
    `UPDATE ${table} SET is_deleted = 1, is_synced = 0, pending_operation = 'delete', updated_at = datetime('now') WHERE id = ?`,
    [id]
  );
}

export async function getPendingChanges(): Promise<
  Array<{
    entityType: OfflineEntityType;
    entityId: string;
    operation: string;
    payload: Record<string, unknown>;
  }>
> {
  if (!isNativePlatform()) return [];
  const db = getDb();
  if (!db) return [];

  const result = await db.query(
    `SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT 50`
  );

  return (result.values ?? []).map((row) => ({
    entityType: row.entity_type as OfflineEntityType,
    entityId: row.entity_id as string,
    operation: row.operation as string,
    payload: row.payload ? JSON.parse(row.payload as string) : {},
  }));
}

export async function enqueueChange(
  entityType: OfflineEntityType,
  entityId: string,
  operation: string,
  payload: Record<string, unknown>
): Promise<void> {
  if (!isNativePlatform()) return;
  const db = getDb();
  if (!db) return;

  const id = crypto.randomUUID();
  await db.run(
    `INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload)
     VALUES (?, ?, ?, ?, ?)`,
    [id, entityType, entityId, operation, JSON.stringify(payload)]
  );
}

export async function removeSyncedQueueItem(queueId: string): Promise<void> {
  if (!isNativePlatform()) return;
  const db = getDb();
  if (!db) return;

  await db.run(`DELETE FROM sync_queue WHERE id = ?`, [queueId]);
}

export async function markQueueItemFailed(queueId: string): Promise<void> {
  if (!isNativePlatform()) return;
  const db = getDb();
  if (!db) return;

  await db.run(
    `UPDATE sync_queue SET status = 'failed', attempt_count = attempt_count + 1, last_attempt_at = datetime('now')
     WHERE id = ?`,
    [queueId]
  );
}

export async function getUnsyncedCount(): Promise<number> {
  if (!isNativePlatform()) return 0;
  const db = getDb();
  if (!db) return 0;

  const result = await db.query(
    `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'`
  );

  return (result.values?.[0]?.count as number) ?? 0;
}
