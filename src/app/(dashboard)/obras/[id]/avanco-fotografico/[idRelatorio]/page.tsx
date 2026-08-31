import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function DetalhesRelatorioFotograficoPage(props: {
  params: Promise<{ id: string; idRelatorio: string }>;
}) {
  const params = await props.params;
  const obraId = parseInt(params.id, 10);
  const relatorioId = parseInt(params.idRelatorio, 10);
  if (isNaN(obraId) || isNaN(relatorioId)) notFound();

  const relatorio = await prisma.relatorioFotografico.findUnique({
    where: { id: relatorioId },
    include: {
      obra: { select: { nome: true } },
      paresFotos: { orderBy: { ordem: "asc" } },
    },
  });

  if (!relatorio || relatorio.obraId !== obraId) notFound();

  return (
    <div className="print-area" style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-heading)" }}>
            {relatorio.titulo} - {relatorio.obra.nome}
          </h2>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>
            Finalizado em: {new Date(relatorio.updatedAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="no-print" style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-primary" onClick={() => window.print()}>
            🖨️ Imprimir / Gerar PDF
          </button>
          <a href={`/obras/${obraId}/avanco-fotografico`} className="btn btn-secondary">
            &larr; Voltar
          </a>
        </div>
      </div>

      <div style={{ backgroundColor: "var(--bg-card)", padding: "24px", borderRadius: "8px", border: "1px solid var(--border-color)", marginBottom: "30px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>Relato da Empresa</h3>
        <p style={{ whiteSpace: "pre-wrap", color: "var(--text-heading)", lineHeight: "1.6" }}>
          {relatorio.relatoEmpresa || "Nenhum relato fornecido."}
        </p>
      </div>

      <div>
        <h3 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "20px" }}>Avanço Fotográfico</h3>
        
        {relatorio.paresFotos.map((par, index) => (
          <div key={par.id} className="page-break-inside-avoid" style={{ backgroundColor: "var(--bg-card)", padding: "24px", borderRadius: "8px", border: "1px solid var(--border-color)", marginBottom: "30px" }}>
            <h4 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", textAlign: "center" }}>
              {par.descricao || `Estrutura ${index + 1}`}
            </h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div>
                <p style={{ fontWeight: 600, marginBottom: "12px", textAlign: "center", color: "var(--error)" }}>ANTES</p>
                {par.fotoAntesBase64 ? (
                  <img src={par.fotoAntesBase64} alt="Antes" style={{ width: "100%", borderRadius: "8px", border: "2px solid var(--error)", objectFit: "cover" }} />
                ) : (
                  <div style={{ padding: "40px", textAlign: "center", border: "1px dashed var(--border-color)", borderRadius: "8px", color: "var(--text-muted)" }}>
                    Sem imagem
                  </div>
                )}
              </div>
              
              <div>
                <p style={{ fontWeight: 600, marginBottom: "12px", textAlign: "center", color: "var(--success)" }}>DEPOIS</p>
                {par.fotoDepoisBase64 ? (
                  <img src={par.fotoDepoisBase64} alt="Depois" style={{ width: "100%", borderRadius: "8px", border: "2px solid var(--success)", objectFit: "cover" }} />
                ) : (
                  <div style={{ padding: "40px", textAlign: "center", border: "1px dashed var(--border-color)", borderRadius: "8px", color: "var(--text-muted)" }}>
                    Sem imagem
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {relatorio.paresFotos.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
            Nenhuma foto registrada neste relatório.
          </p>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .sidebar, .navbar, .no-print {
            display: none !important;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Evita quebras de página no meio de um par de fotos */
          .page-break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}} />
    </div>
  );
}
