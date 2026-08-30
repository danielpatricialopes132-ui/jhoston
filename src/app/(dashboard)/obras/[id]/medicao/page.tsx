"use client"

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  getMedicaoObra, 
  criarEtapaMedicao, 
  deletarEtapaMedicao,
  criarItemMedicao,
  deletarItemMedicao,
  atualizarProgressoItem,
  atualizarPrecoItem,
  renovarTokenMedicao
} from "./actions";

export default function MedicaoAdminPage() {
  const params = useParams();
  const obraId = parseInt(params.id as string);
  const [obra, setObra] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // States para novos itens
  const [novaEtapa, setNovaEtapa] = useState("");
  const [novoItem, setNovoItem] = useState({ etapaId: 0, descricao: "", unidade: "un", precoUnitario: 0 });

  const loadData = async () => {
    const data = await getMedicaoObra(obraId);
    setObra(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [obraId]);

  const handleAddEtapa = async () => {
    if (!novaEtapa) return;
    await criarEtapaMedicao(obraId, novaEtapa);
    setNovaEtapa("");
    loadData();
  };

  const handleAddItem = async (etapaId: number) => {
    if (!novoItem.descricao || novoItem.etapaId !== etapaId) return;
    await criarItemMedicao(etapaId, novoItem.descricao, novoItem.unidade, novoItem.precoUnitario);
    setNovoItem({ etapaId: 0, descricao: "", unidade: "un", precoUnitario: 0 });
    loadData();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Link copiado!");
  };

  if (loading) return <div className="p-6">Carregando...</div>;
  if (!obra) return <div className="p-6">Obra não encontrada</div>;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const linkFisico = `${baseUrl}/acompanhamento/${obra.tokenMedicaoFisica}`;
  const linkFinanceiro = `${baseUrl}/acompanhamento/${obra.tokenMedicaoFinanceira}`;

  return (
    <div className="p-6 max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Medição de Obra</h1>
          <p className="text-gray-500">{obra.nome}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-800">Link Público (Apenas Físico)</h3>
            <p className="text-xs text-gray-400">O cliente não verá valores.</p>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => copyToClipboard(linkFisico)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 w-full">
              Copiar Link
            </button>
            <button 
              onClick={async () => {
                if(confirm("Gerar novo link? O antigo deixará de funcionar.")) {
                  await renovarTokenMedicao(obraId, 'fisico');
                  loadData();
                }
              }} 
              className="text-xs text-red-500 hover:underline text-right"
            >
              Revogar e gerar novo
            </button>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-gray-800">Link Público (Físico + Financeiro)</h3>
            <p className="text-xs text-gray-400">O cliente verá todos os custos.</p>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => copyToClipboard(linkFinanceiro)} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 w-full">
              Copiar Link
            </button>
            <button 
              onClick={async () => {
                if(confirm("Gerar novo link? O antigo deixará de funcionar.")) {
                  await renovarTokenMedicao(obraId, 'financeiro');
                  loadData();
                }
              }} 
              className="text-xs text-red-500 hover:underline text-right"
            >
              Revogar e gerar novo
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {obra.etapasMedicao.map((etapa: any) => (
          <div key={etapa.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-zinc-800 text-white p-4 flex justify-between items-center">
              <h2 className="font-bold text-lg">{etapa.nome}</h2>
              <button 
                onClick={async () => {
                  if (confirm("Deletar etapa?")) {
                    await deletarEtapaMedicao(etapa.id);
                    loadData();
                  }
                }}
                className="text-red-400 hover:text-red-300 text-sm"
              >Excluir Etapa</button>
            </div>
            
            <div className="p-4 space-y-4">
              {etapa.itens.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">Nenhum item nesta etapa.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-sm text-gray-600">
                        <th className="py-2">Item</th>
                        <th className="py-2 w-20">Un.</th>
                        <th className="py-2 w-32">R$ Unit.</th>
                        <th className="py-2 w-48">Progresso (%)</th>
                        <th className="py-2 w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {etapa.itens.map((item: any) => (
                        <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3 font-medium text-gray-800">{item.descricao}</td>
                          <td className="py-3 text-sm text-gray-500">{item.unidade}</td>
                          <td className="py-3">
                            <input 
                              type="number" 
                              className="w-24 border rounded p-1 text-sm"
                              defaultValue={item.precoUnitario}
                              onBlur={(e) => atualizarPrecoItem(item.id, parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <input 
                                type="range" 
                                min="0" max="100" 
                                defaultValue={item.percentual}
                                className="w-full"
                                onChange={(e) => {
                                  document.getElementById(`perc-${item.id}`)!.innerText = e.target.value + '%';
                                }}
                                onMouseUp={(e) => {
                                  const val = parseFloat((e.target as HTMLInputElement).value);
                                  atualizarProgressoItem(item.id, val, 0);
                                }}
                                onTouchEnd={(e) => {
                                  const val = parseFloat((e.target as HTMLInputElement).value);
                                  atualizarProgressoItem(item.id, val, 0);
                                }}
                              />
                              <span id={`perc-${item.id}`} className="text-xs font-bold w-10 text-right">{item.percentual}%</span>
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <button 
                              onClick={async () => {
                                if (confirm("Deletar item?")) {
                                  await deletarItemMedicao(item.id);
                                  loadData();
                                }
                              }}
                              className="text-red-500 hover:text-red-700 font-bold"
                            >×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Form de novo item */}
              <div className="mt-4 bg-gray-50 p-3 rounded border border-dashed flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Descrição do serviço..." 
                  className="flex-1 border rounded p-2 text-sm"
                  value={novoItem.etapaId === etapa.id ? novoItem.descricao : ""}
                  onChange={e => setNovoItem({ ...novoItem, etapaId: etapa.id, descricao: e.target.value })}
                />
                <input 
                  type="text" 
                  placeholder="Un (m², un)" 
                  className="w-20 border rounded p-2 text-sm"
                  value={novoItem.etapaId === etapa.id ? novoItem.unidade : ""}
                  onChange={e => setNovoItem({ ...novoItem, etapaId: etapa.id, unidade: e.target.value })}
                />
                <input 
                  type="number" 
                  placeholder="R$ Unit." 
                  className="w-24 border rounded p-2 text-sm"
                  value={novoItem.etapaId === etapa.id ? novoItem.precoUnitario : ""}
                  onChange={e => setNovoItem({ ...novoItem, etapaId: etapa.id, precoUnitario: parseFloat(e.target.value) || 0 })}
                />
                <button 
                  onClick={() => handleAddItem(etapa.id)}
                  className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                >Add Item</button>
              </div>
            </div>
          </div>
        ))}

        {/* Form de nova etapa */}
        <div className="bg-gray-50 p-4 rounded-lg border flex items-center gap-4">
          <input 
            type="text" 
            placeholder="Nome da Nova Etapa (Ex: Fundações)" 
            className="flex-1 border rounded p-3"
            value={novaEtapa}
            onChange={e => setNovaEtapa(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddEtapa()}
          />
          <button 
            onClick={handleAddEtapa}
            className="bg-blue-600 text-white px-6 py-3 rounded font-bold hover:bg-blue-700"
          >+ Nova Etapa</button>
        </div>
      </div>
    </div>
  );
}
