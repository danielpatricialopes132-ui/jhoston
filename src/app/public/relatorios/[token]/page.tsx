import { decryptToken } from "@/lib/crypto";
import { getRelatorioGerencialContabil, getLivroCaixa } from "@/app/(dashboard)/relatorios/actions";
import { getCompanyBranding } from "@/lib/branding";

export default async function PublicRelatorioPage({ params }: { params: { token: string } }) {
  const token = params.token;
  const payload = decryptToken(token);

  if (!payload || !payload.tipo || !payload.empresa) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
        <h2>Link inválido ou expirado.</h2>
      </div>
    );
  }

  const { tipo, empresa, dataInicio, dataFim } = payload;
  const branding = getCompanyBranding(empresa);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const formatDateBR = (dateInput: string | Date | any) => {
    if (!dateInput) return "";
    if (dateInput instanceof Date) {
      return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(dateInput);
    }
    try {
      if (typeof dateInput === 'string') {
        const parts = dateInput.split("T")[0].split("-");
        if (parts.length === 3) {
          const [year, month, day] = parts;
          return `${day}/${month}/${year}`;
        }
      }
      return String(dateInput);
    } catch {
      return String(dateInput);
    }
  };

  if (tipo === "gerencial") {
    const gerencialReport = await getRelatorioGerencialContabil(empresa);

    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", borderBottom: `2px solid ${branding.primaryColor}`, paddingBottom: "16px" }}>
          {branding.logo && (
            <img src={branding.logo} alt={branding.name} style={{ height: "50px", objectFit: "contain" }} />
          )}
          <div>
            <h1 style={{ margin: 0, color: branding.primaryColor, fontSize: "24px" }}>Relatório Gerencial Contábil</h1>
            <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "14px" }}>{branding.corporateName}</p>
          </div>
        </div>

        {gerencialReport.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
            Nenhuma obra encontrada ou com transações financeiras pagas.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {gerencialReport.map((obra: any) => (
              <div key={obra.obraId} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "24px", backgroundColor: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0f172a", paddingBottom: "12px", marginBottom: "20px" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>{obra.obraNome}</h4>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Status: {obra.obraStatus}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong style={{ fontSize: "14px", display: "block" }}>Lucro Caixa: <span style={{ color: obra.saldoObra >= 0 ? "#16a34a" : "#dc2626" }}>{formatCurrency(obra.saldoObra)}</span></strong>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Margem: {obra.margemRealizada.toFixed(2)}%</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                  {/* ENTRADAS */}
                  <div>
                    <h5 style={{ color: "#16a34a", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", margin: "0 0 12px 0" }}>Entradas (Faturamento)</h5>
                    <div style={{ marginBottom: "12px", fontSize: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Contrato Base (Previsto: {formatCurrency(obra.faturamentoContratoBase)})</span>
                        <strong>{formatCurrency(obra.receitasContratoBase)}</strong>
                      </div>
                    </div>
                    
                    {obra.detalheAdendos.length > 0 && (
                      <div style={{ marginBottom: "12px" }}>
                        <strong style={{ fontSize: "13px", color: "#64748b" }}>Adendos:</strong>
                        <ul style={{ listStyle: "none", padding: 0, margin: "4px 0", fontSize: "13px" }}>
                          {obra.detalheAdendos.map((ad: any) => (
                            <li key={ad.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dashed #e2e8f0" }}>
                              <span>{ad.descricao} (Prev: {formatCurrency(ad.valorPrevisto)})</span>
                              <strong>{formatCurrency(ad.recebido)}</strong>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", paddingTop: "8px", borderTop: "1px solid #e2e8f0", fontWeight: 700, fontSize: "15px" }}>
                      <span>Total Realizado:</span>
                      <span style={{ color: "#16a34a" }}>{formatCurrency(obra.entradasRealizadas)}</span>
                    </div>
                    <div style={{ fontSize: "11px", textAlign: "right", color: "#64748b" }}>
                      {obra.percentualRecebimento.toFixed(1)}% do Previsto Total ({formatCurrency(obra.faturamentoPrevisto)})
                    </div>
                  </div>

                  {/* SAÍDAS */}
                  <div>
                    <h5 style={{ color: "#dc2626", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", margin: "0 0 12px 0" }}>Saídas (Custos / Despesas)</h5>
                    
                    {obra.detalheColaboradores.length > 0 && (
                      <div style={{ marginBottom: "12px" }}>
                        <strong style={{ fontSize: "13px", color: "#64748b" }}>Folha de Pagamento (Colaboradores):</strong>
                        <ul style={{ listStyle: "none", padding: 0, margin: "4px 0", fontSize: "13px" }}>
                          {obra.detalheColaboradores.map((col: any, idx: number) => (
                            <li key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dashed #e2e8f0" }}>
                              <span>{col.nome}</span>
                              <strong>{formatCurrency(col.valor)}</strong>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div style={{ marginBottom: "12px", fontSize: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Outras Despesas (Fornecedores/Gerais)</span>
                        <strong>{formatCurrency(obra.outrasDespesasRealizadas)}</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", paddingTop: "8px", borderTop: "1px solid #e2e8f0", fontWeight: 700, fontSize: "15px" }}>
                      <span>Total Realizado:</span>
                      <span style={{ color: "#dc2626" }}>{formatCurrency(obra.despesasRealizadas)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (tipo === "livro_caixa") {
    const livroCaixaReport = await getLivroCaixa(dataInicio, dataFim, empresa);

    return (
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", borderBottom: `2px solid ${branding.primaryColor}`, paddingBottom: "16px" }}>
          {branding.logo && (
            <img src={branding.logo} alt={branding.name} style={{ height: "50px", objectFit: "contain" }} />
          )}
          <div>
            <h1 style={{ margin: 0, color: branding.primaryColor, fontSize: "24px" }}>Livro Caixa</h1>
            <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "14px" }}>{branding.corporateName}</p>
          </div>
        </div>

        <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "24px", backgroundColor: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "2px solid #94a3b8", paddingBottom: "12px" }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Extrato Financeiro</h4>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Período: {formatDateBR(dataInicio)} a {formatDateBR(dataFim)}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Saldo Anterior (até {formatDateBR(dataInicio)}):</span>
              <strong style={{ display: "block", fontSize: "16px", color: livroCaixaReport.saldoInicial >= 0 ? "#16a34a" : "#dc2626" }}>
                {formatCurrency(livroCaixaReport.saldoInicial)}
              </strong>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "8px" }}>Data Pagamento</th>
                  <th style={{ padding: "8px" }}>Descrição do Lançamento</th>
                  <th style={{ padding: "8px" }}>Plano de Contas</th>
                  <th style={{ padding: "8px" }}>Obra Relacionada</th>
                  <th style={{ padding: "8px", textAlign: "right" }}>Entrada</th>
                  <th style={{ padding: "8px", textAlign: "right" }}>Saída</th>
                  <th style={{ padding: "8px", textAlign: "right" }}>Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let saldoAcumulado = livroCaixaReport.saldoInicial;
                  return livroCaixaReport.transacoes.map((t: any) => {
                    if (t.tipo === "RECEITA") saldoAcumulado += t.valor;
                    else if (t.tipo === "DESPESA") saldoAcumulado -= t.valor;
                    
                    return (
                      <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "8px", whiteSpace: "nowrap" }}>{formatDateBR(t.dataPagamento?.toISOString() || t.dataPagamento)}</td>
                        <td style={{ padding: "8px" }}>{t.descricao}</td>
                        <td style={{ padding: "8px" }}>
                          <span style={{ backgroundColor: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>
                            {t.planoConta?.codigo} - {t.planoConta?.descricao}
                          </span>
                        </td>
                        <td style={{ padding: "8px" }}>{t.obra?.nome || <em style={{ color: "#64748b", fontSize: "11px" }}>--</em>}</td>
                        <td style={{ padding: "8px", textAlign: "right", color: "#16a34a" }}>
                          {t.tipo === "RECEITA" ? formatCurrency(t.valor) : "-"}
                        </td>
                        <td style={{ padding: "8px", textAlign: "right", color: "#dc2626" }}>
                          {t.tipo === "DESPESA" ? formatCurrency(t.valor) : "-"}
                        </td>
                        <td style={{ padding: "8px", textAlign: "right", fontWeight: 600, color: saldoAcumulado >= 0 ? "#0f172a" : "#dc2626" }}>
                          {formatCurrency(saldoAcumulado)}
                        </td>
                      </tr>
                    );
                  });
                })()}
                {livroCaixaReport.transacoes.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                      Nenhuma movimentação encontrada neste período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
      <h2>Tipo de relatório desconhecido.</h2>
    </div>
  );
}
