const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

async function run() {
  try {
    const updateMaster = fs.readFileSync('update_master.sql', 'utf8');
    const updateDaniel = fs.readFileSync('update_daniel.sql', 'utf8');
    
    await pool.query(updateMaster);
    console.log('Master updated successfully');
    
    await pool.query(updateDaniel);
    console.log('Daniel updated successfully');
    
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await pool.end();
  }
}

run();
