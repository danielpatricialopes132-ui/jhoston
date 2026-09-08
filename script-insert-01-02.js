const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    // 1. Create PlanoConta 0.1 and 0.2
    const check01 = await pool.query(`SELECT id FROM "PlanoConta" WHERE codigo = '0.1'`);
    let id01;
    if (check01.rows.length === 0) {
      const res01 = await pool.query(
        `INSERT INTO "PlanoConta" (codigo, descricao, tipo, "createdAt", "updatedAt") VALUES ('0.1', 'Valores Recebidos na PF', 'RECEITA', NOW(), NOW()) RETURNING id`
      );
      id01 = res01.rows[0].id;
      console.log("Criado 0.1 com ID:", id01);
    } else {
      id01 = check01.rows[0].id;
    }

    const check02 = await pool.query(`SELECT id FROM "PlanoConta" WHERE codigo = '0.2'`);
    let id02;
    if (check02.rows.length === 0) {
      const res02 = await pool.query(
        `INSERT INTO "PlanoConta" (codigo, descricao, tipo, "createdAt", "updatedAt") VALUES ('0.2', 'Saldo Conta Anterior', 'RECEITA', NOW(), NOW()) RETURNING id`
      );
      id02 = res02.rows[0].id;
      console.log("Criado 0.2 com ID:", id02);
    } else {
      id02 = check02.rows[0].id;
    }

    // Achar a Obra ECO STONE
    const obraRes = await pool.query(`SELECT id FROM "Obra" WHERE nome ILIKE '%ECO STONE%' LIMIT 1`);
    let obraId = null;
    if (obraRes.rows.length > 0) {
      obraId = obraRes.rows[0].id;
    }

    // Delete old test transactions we created for saldo
    await pool.query(`DELETE FROM "TransacaoFinanceira" WHERE descricao ILIKE '%Saldo%' AND empresa = 'ECO_STONE'`);
    await pool.query(`DELETE FROM "TransacaoFinanceira" WHERE descricao ILIKE '%Recebido%' AND empresa = 'ECO_STONE' AND "dataVencimento" < '2026-09-08'`);

    // Valores para lançar (05.09.2026 - wait, user said "anteriores a 05.09.2026", let's use 2026-09-04)
    // 0.2: 108884.55 + 44.16 = 108928.71
    // 0.1: 181689.55 - 108928.71 = 72760.84

    // Inserting transactions
    await pool.query(
      `INSERT INTO "TransacaoFinanceira" (tipo, descricao, valor, "dataVencimento", status, "dataPagamento", empresa, "planoContaId", "obraId", "createdAt", "updatedAt")
       VALUES 
       ('RECEITA', 'Valores Recebidos na PF (ECO STONE)', 72760.84, '2026-09-04', 'PAGO', '2026-09-04', 'ECO_STONE', $1, $3, NOW(), NOW()),
       ('RECEITA', 'Saldo em Conta Anterior (ECO STONE)', 108884.55, '2026-09-04', 'PAGO', '2026-09-04', 'ECO_STONE', $2, null, NOW(), NOW()),
       ('RECEITA', 'Saldo em Conta Anterior (ECO STONE - residual)', 44.16, '2026-09-04', 'PAGO', '2026-09-04', 'ECO_STONE', $2, null, NOW(), NOW())
       `,
       [id01, id02, obraId]
    );

    console.log("Lançamentos criados com sucesso.");
  } catch (error) {
    console.error(error);
  } finally {
    pool.end();
  }
}

main();
