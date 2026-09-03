export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  trim TEXT NOT NULL,
  powertrain TEXT,
  year INTEGER NOT NULL,
  registration TEXT,
  vin TEXT,
  purchase_date TEXT NOT NULL,
  purchase_mileage INTEGER NOT NULL,
  purchase_price REAL,
  sale_date TEXT,
  final_mileage INTEGER,
  sale_price REAL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  is_primary INTEGER NOT NULL DEFAULT 0,
  photo_path TEXT,
  photo_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_synced INTEGER NOT NULL DEFAULT 1,
  pending_operation TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  server_version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS mileage_readings (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  mileage INTEGER NOT NULL,
  date TEXT NOT NULL,
  comment TEXT,
  is_correction INTEGER NOT NULL DEFAULT 0,
  distance_from_previous INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_synced INTEGER NOT NULL DEFAULT 1,
  pending_operation TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  server_version INTEGER DEFAULT 1,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS maintenance_records (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  mileage INTEGER,
  cost REAL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_synced INTEGER NOT NULL DEFAULT 1,
  pending_operation TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  server_version INTEGER DEFAULT 1,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  due_date TEXT,
  due_mileage INTEGER,
  warning_days INTEGER NOT NULL DEFAULT 30,
  warning_km INTEGER NOT NULL DEFAULT 1500,
  notes TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_synced INTEGER NOT NULL DEFAULT 1,
  pending_operation TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  server_version INTEGER DEFAULT 1,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  mileage INTEGER,
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_synced INTEGER NOT NULL DEFAULT 1,
  pending_operation TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  server_version INTEGER DEFAULT 1,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fuel_entries (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  date TEXT NOT NULL,
  mileage INTEGER NOT NULL,
  liters REAL NOT NULL,
  total_price REAL NOT NULL,
  unit_price REAL NOT NULL,
  is_full INTEGER NOT NULL DEFAULT 1,
  distance_since_previous INTEGER,
  consumption_per_100_km REAL,
  cost_per_100_km REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_synced INTEGER NOT NULL DEFAULT 1,
  pending_operation TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  server_version INTEGER DEFAULT 1,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_vehicles_user ON vehicles(user_id, status);
CREATE INDEX IF NOT EXISTS idx_mileage_vehicle ON mileage_readings(vehicle_id, date);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance_records(vehicle_id, date);
CREATE INDEX IF NOT EXISTS idx_schedules_vehicle ON maintenance_schedules(vehicle_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle ON expenses(vehicle_id, date);
CREATE INDEX IF NOT EXISTS idx_fuel_vehicle ON fuel_entries(vehicle_id, date);
CREATE INDEX IF NOT EXISTS idx_sync_pending ON sync_queue(status, created_at);
`;
