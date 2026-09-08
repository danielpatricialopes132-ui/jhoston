const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const client = await pool.connect();
  try {
    // Check if Plano de Conta "Saldo Inicial" exists
    let res = await client.query(`SELECT id FROM "PlanoConta" WHERE codigo = $1 AND descricao = $2`, ['0.0', 'Saldo Inicial']);
    let planoId;
    if (res.rows.length === 0) {
      const insertPlano = await client.query(`
        INSERT INTO "PlanoConta" (codigo, descricao, tipo, "updatedAt") 
        VALUES ($1, $2, $3, NOW()) 
        RETURNING id
      `, ['0.0', 'Saldo Inicial', 'RECEITA']);
      planoId = insertPlano.rows[0].id;
      console.log('Plano de Conta criado com ID:', planoId);
    } else {
      planoId = res.rows[0].id;
      console.log('Plano de Conta já existe com ID:', planoId);
    }

    // Insert 66775.00
    res = await client.query(`SELECT id FROM "TransacaoFinanceira" WHERE descricao = $1 AND valor = $2`, ['Saldo Recebido Anterior (Até 05.09.2026)', 66775.00]);
    if (res.rows.length === 0) {
      await client.query(`
        INSERT INTO "TransacaoFinanceira" (
          tipo, descricao, valor, status, "dataVencimento", "dataPagamento", empresa, "planoContaId", "updatedAt"
        ) VALUES (
          'RECEITA', 'Saldo Recebido Anterior (Até 05.09.2026)', 66775.00, 'PAGO', '2026-09-04 00:00:00', '2026-09-04 00:00:00', 'JHOSTON', $1, NOW()
        )
      `, [planoId]);
      console.log('Transação 66775.00 inserida.');
    } else {
      console.log('Transação 66775.00 já existe.');
    }

    // Insert 44.16
    res = await client.query(`SELECT id FROM "TransacaoFinanceira" WHERE descricao = $1 AND valor = $2`, ['Saldo em Conta Anterior (Até 05.09.2026)', 44.16]);
    if (res.rows.length === 0) {
      await client.query(`
        INSERT INTO "TransacaoFinanceira" (
          tipo, descricao, valor, status, "dataVencimento", "dataPagamento", empresa, "planoContaId", "updatedAt"
        ) VALUES (
          'RECEITA', 'Saldo em Conta Anterior (Até 05.09.2026)', 44.16, 'PAGO', '2026-09-04 00:00:00', '2026-09-04 00:00:00', 'JHOSTON', $1, NOW()
        )
      `, [planoId]);
      console.log('Transação 44.16 inserida.');
    } else {
      console.log('Transação 44.16 já existe.');
    }
  } finally {
    client.release();
  }
}

main().catch(console.error).finally(() => pool.end());
