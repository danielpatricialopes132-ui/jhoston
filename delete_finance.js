const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    console.log("Deletando Vales...");
    await pool.query('DELETE FROM "Vale"');
    
    console.log("Deletando Diárias de Viagem...");
    await pool.query('DELETE FROM "DiariaViagem"');
    
    console.log("Deletando Boletos...");
    await pool.query('DELETE FROM "Boleto"');

    console.log("Deletando Transações Financeiras...");
    await pool.query('DELETE FROM "TransacaoFinanceira"');

    console.log("Limpando empresas do DB para conferência...");
    const res = await pool.query('SELECT nome FROM "ConfiguracaoEmpresa"');
    console.log("Empresas:", res.rows.map(r => r.nome));
    
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
