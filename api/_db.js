const { neon } = require('@neondatabase/serverless');

let _sql = null;

function getDb() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

async function initDb() {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id          SERIAL PRIMARY KEY,
      code        VARCHAR(20) UNIQUE NOT NULL,
      client_name VARCHAR(255) NOT NULL,
      whatsapp    VARCHAR(20) NOT NULL,
      quantity    INTEGER NOT NULL,
      size        VARCHAR(100) NOT NULL,
      price_per_pcs INTEGER NOT NULL,
      eta         DATE,
      company     VARCHAR(255),
      status      VARCHAR(50) DEFAULT 'pending',
      progress    INTEGER DEFAULT 0,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS production_steps (
      id           SERIAL PRIMARY KEY,
      order_id     INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      step_name    VARCHAR(100) NOT NULL,
      status       VARCHAR(50) DEFAULT 'pending',
      notes        TEXT,
      started_at   TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS photos (
      id                   SERIAL PRIMARY KEY,
      order_id             INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      step_name            VARCHAR(100),
      photo_url            TEXT NOT NULL,
      cloudinary_public_id TEXT,
      notes                TEXT,
      created_at           TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id             SERIAL PRIMARY KEY,
      order_id       INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      order_code     VARCHAR(20) NOT NULL,
      invoice_number VARCHAR(50) UNIQUE NOT NULL,
      items          JSONB DEFAULT '[]',
      tax_rate       INTEGER DEFAULT 10,
      subtotal       BIGINT DEFAULT 0,
      tax            BIGINT DEFAULT 0,
      total          BIGINT DEFAULT 0,
      due_date       DATE,
      status         VARCHAR(20) DEFAULT 'draft',
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  return true;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Content-Type': 'application/json',
  };
}

module.exports = { getDb, initDb, corsHeaders };
