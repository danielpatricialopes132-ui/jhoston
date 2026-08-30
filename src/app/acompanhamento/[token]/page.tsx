"use client"

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getObraByToken, adicionarComentario } from "../../(dashboard)/obras/[id]/medicao/actions";

export default function AcompanhamentoClientePage() {
  const params = useParams();
  const token = params.token as string;
  const [obra, setObra] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFinanceiro, setIsFinanceiro] = useState(false);
  const [comentarioTexto, setComentarioTexto] = useState("");
  const [itemComentarioAtivo, setItemComentarioAtivo] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);

  const loadData = async () => {
    const data = await getObraByToken(token);
    if (data) {
      setObra(data);
      setIsFinanceiro(data.tokenMedicaoFinanceira === token);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleEnviarComentario = async (itemId: number) => {
    if (!comentarioTexto.trim()) return;
    setEnviando(true);
    await adicionarComentario(itemId, comentarioTexto);
    setComentarioTexto("");
    setItemComentarioAtivo(null);
    await loadData();
    setEnviando(false);
    alert("Mensagem enviada com sucesso!");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">Carregando acompanhamento...</div>;
  if (!obra) return <div className="min-h-screen flex items-center justify-center bg-gray-100 text-red-500 font-bold">Link inválido ou expirado.</div>;

  // Calculando progresso total
  let totalItens = 0;
  let somaProgresso = 0;
  let custoTotal = 0;
  let custoRealizado = 0;

  obra.etapasMedicao.forEach((etapa: any) => {
    etapa.itens.forEach((item: any) => {
      totalItens++;
      somaProgresso += item.percentual;
      
      const custoItem = item.precoUnitario * item.quantidadeTotal;
      custoTotal += custoItem;
      custoRealizado += custoItem * (item.percentual / 100);
    });
  });

  const percentualGeral = totalItens > 0 ? (somaProgresso / totalItens) : 0;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      {/* Header Premium */}
      <div className="bg-zinc-900 text-white pt-12 pb-24 px-6 rounded-b-3xl shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
          
          <div className="relative w-40 h-40 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-700"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-500 transition-all duration-1000 ease-out"
                strokeWidth="3"
                strokeDasharray={`${percentualGeral}, 100`}
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <span className="text-3xl font-extrabold">{percentualGeral.toFixed(0)}%</span>
              <span className="text-xs text-gray-400 uppercase tracking-widest mt-1">Concluído</span>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="text-blue-400 font-bold tracking-widest uppercase text-sm mb-2">{obra.empresa}</div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{obra.nome}</h1>
            {isFinanceiro && (
              <div className="bg-white/10 inline-block px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
                <div className="text-sm text-gray-300">Progresso Financeiro</div>
                <div className="text-xl font-bold text-green-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoRealizado)} 
                  <span className="text-sm text-gray-400 font-normal"> / {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custoTotal)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-10 space-y-6">
        {obra.etapasMedicao.map((etapa: any) => {
          
          let etapaPercentualSoma = 0;
          let etapaCusto = 0;
          let etapaRealizado = 0;
          
          etapa.itens.forEach((item: any) => {
            etapaPercentualSoma += item.percentual;
            etapaCusto += (item.precoUnitario * item.quantidadeTotal);
            etapaRealizado += (item.precoUnitario * item.quantidadeTotal) * (item.percentual / 100);
          });
          
          const etapaProgresso = etapa.itens.length > 0 ? (etapaPercentualSoma / etapa.itens.length) : 0;

          return (
            <div key={etapa.id} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transition-all hover:shadow-2xl">
              
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{etapa.nome}</h2>
                  {isFinanceiro && etapaCusto > 0 && (
                    <p className="text-sm text-gray-500 font-medium mt-1">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(etapaRealizado)} de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(etapaCusto)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-blue-600">{etapaProgresso.toFixed(0)}%</div>
                </div>
              </div>

              {/* Barra de progresso da etapa */}
              <div className="h-2 w-full bg-gray-100">
                <div 
                  className="h-full bg-blue-500 transition-all duration-1000 ease-out" 
                  style={{ width: \`\${etapaProgresso}%\` }}
                ></div>
              </div>

              <div className="p-4 space-y-3">
                {etapa.itens.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">Nenhum serviço registrado.</p>
                ) : (
                  etapa.itens.map((item: any) => (
                    <div key={item.id} className="group flex flex-col p-4 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-700">{item.descricao}</h3>
                          {isFinanceiro && item.precoUnitario > 0 && (
                            <p className="text-xs text-gray-400">
                              {item.quantidadeTotal} {item.unidade} x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.precoUnitario)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-gray-800">{item.percentual}%</span>
                          <button 
                            onClick={() => setItemComentarioAtivo(itemComentarioAtivo === item.id ? null : item.id)}
                            className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center transition-colors"
                            title="Deixar comentário"
                          >
                            💬
                          </button>
                        </div>
                      </div>
                      
                      {/* Mini barra do item */}
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={\`h-full rounded-full transition-all duration-700 \${item.percentual === 100 ? 'bg-green-500' : 'bg-blue-400'}\`} 
                          style={{ width: \`\${item.percentual}%\` }}
                        ></div>
                      </div>

                      {/* Lista de Comentários */}
                      {item.comentarios.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-2">
                          {item.comentarios.map((c: any) => (
                            <div key={c.id} className="text-sm">
                              <span className="font-bold text-gray-700">{c.autor}:</span> <span className="text-gray-600">{c.texto}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Caixa de Comentário Nova */}
                      {itemComentarioAtivo === item.id && (
                        <div className="mt-4 flex gap-2 animate-fade-in-up">
                          <input 
                            type="text" 
                            placeholder="Dúvida ou comentário sobre este serviço..." 
                            className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                            value={comentarioTexto}
                            onChange={e => setComentarioTexto(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleEnviarComentario(item.id)}
                            autoFocus
                          />
                          <button 
                            onClick={() => handleEnviarComentario(item.id)}
                            disabled={enviando || !comentarioTexto.trim()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all"
                          >
                            {enviando ? "..." : "Enviar"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      
    </div>
  );
}
