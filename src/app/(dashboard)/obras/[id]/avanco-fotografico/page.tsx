import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { getRascunhoAtual, getRelatoriosFinalizados } from "./actions";
import FormRelatorioFotografico from "./FormRelatorioFotografico";

export default async function AvancoFotograficoPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const obraId = parseInt(params.id, 10);
  if (isNaN(obraId)) notFound();

  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
    select: { id: true, nome: true },
  });

  if (!obra) notFound();

  const rascunhoAtual = await getRascunhoAtual(obraId);
  const relatoriosFinalizados = await getRelatoriosFinalizados(obraId);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-heading)" }}>
            Avanço Fotográfico - {obra.nome}
          </h2>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>
            Crie relatórios comparativos de Antes e Depois para acompanhar a evolução da obra.
          </p>
        </div>
        <a href="/obras" className="btn btn-secondary">
          &larr; Voltar para Obras
        </a>
      </div>

      <div style={{ display: "flex", gap: "30px", flexDirection: "column" }}>
        {/* Editor do Rascunho / Novo Relatório */}
        <div style={{ backgroundColor: "var(--bg-card)", padding: "24px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
            {rascunhoAtual ? "Continuar Rascunho" : "Novo Relatório Fotográfico"}
          </h3>
          <FormRelatorioFotografico obraId={obraId} rascunhoAtual={rascunhoAtual} />
        </div>

        {/* Relatórios Finalizados */}
        {relatoriosFinalizados.length > 0 && (
          <div style={{ backgroundColor: "var(--bg-card)", padding: "24px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
              Relatórios Finalizados
            </h3>
            <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
              {relatoriosFinalizados.map((rel) => (
                <div key={rel.id} style={{ padding: "16px", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
                  <h4 style={{ fontWeight: 600, marginBottom: "8px" }}>{rel.titulo}</h4>
                  <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "8px" }}>
                    Criado em: {new Date(rel.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                  <p style={{ fontSize: "14px", marginBottom: "12px" }}>
                    {rel.paresFotos.length} pares de fotos
                  </p>
                  <a href={`/obras/${obraId}/avanco-fotografico/${rel.id}`} className="btn btn-secondary btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                    Ver Relatório
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
