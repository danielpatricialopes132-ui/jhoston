const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM "PlanoConta" ORDER BY codigo ASC');
    console.log(JSON.stringify(res.rows, null, 2));
  } finally {
    client.release();
  }
}

main().catch(console.error).finally(() => pool.end());
