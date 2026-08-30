import Link from "next/link";
import { getRelatoriosObra, criarRelatorio } from "./actions";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function RelatoriosPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const obraId = parseInt(params.id);
  const relatorios = await getRelatoriosObra(obraId);
  const obra = await prisma.obra.findUnique({ where: { id: obraId } });

  if (!obra) return <div>Obra não encontrada</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Relatórios de Progresso</h1>
          <p className="text-gray-500">{obra.nome}</p>
        </div>
        
        <form action={async (formData) => {
          "use server"
          const mesReferencia = formData.get("mesReferencia") as string;
          if (mesReferencia) {
            await criarRelatorio(obraId, mesReferencia);
          }
        }} className="flex gap-2">
          <input 
            name="mesReferencia" 
            placeholder="Mês (Ex: Agosto/2026)" 
            required 
            className="border rounded p-2 text-sm"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 text-sm font-medium">
            Novo Relatório
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatorios.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500 border rounded bg-gray-50">
            Nenhum relatório criado para esta obra.
          </div>
        ) : (
          relatorios.map((relatorio) => (
            <div key={relatorio.id} className="border rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition">
              <h3 className="font-semibold text-lg mb-2">{relatorio.mesReferencia}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                {relatorio.relatoEngenheiro || "Sem relato inserido."}
              </p>
              <div className="flex justify-between items-center mt-4 border-t pt-4">
                <span className="text-xs text-gray-400">
                  Criado em: {new Date(relatorio.createdAt).toLocaleDateString()}
                </span>
                <Link 
                  href={`/obras/${obraId}/relatorios/${relatorio.id}`}
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  Editar Relatório
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
