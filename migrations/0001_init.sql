CREATE TABLE service_requests (
  id TEXT PRIMARY KEY,
  reference_number TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  service_type TEXT NOT NULL,
  address TEXT NOT NULL,
  address_secondary TEXT,
  preferred_date TEXT NOT NULL,
  preferred_time_window TEXT,
  notes TEXT,
  calculator_input_json TEXT NOT NULL,
  pricing_version TEXT NOT NULL,
  estimate_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONFIRMED', 'CLOSED', 'CANCELLED')),
  ip_hash TEXT NOT NULL
);

CREATE INDEX idx_service_requests_created_at ON service_requests (created_at);
CREATE INDEX idx_service_requests_ip_created ON service_requests (ip_hash, created_at);
CREATE INDEX idx_service_requests_status ON service_requests (status);
