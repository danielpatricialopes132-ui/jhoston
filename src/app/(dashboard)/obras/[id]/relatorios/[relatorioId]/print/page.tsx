import { getRelatorio } from "../../actions";
import Script from "next/script";

export default async function PrintRelatorioPage(props: { params: Promise<{ id: string, relatorioId: string }> }) {
  const params = await props.params;
  const relatorio = await getRelatorio(parseInt(params.relatorioId));

  if (!relatorio) return <div>Relatório não encontrado</div>;

  return (
    <div className="bg-white min-h-screen text-gray-900 print:bg-white pb-20">
      
      <button 
        id="print-btn"
        className="fixed bottom-8 right-8 bg-black text-white px-6 py-3 rounded-full shadow-lg print:hidden font-medium z-50 hover:bg-gray-800"
      >
        Imprimir PDF
      </button>
      <Script id="print-script" strategy="afterInteractive">
        {`
          document.getElementById('print-btn').addEventListener('click', function() {
            window.print();
          });
        `}
      </Script>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { break-after: page; page-break-after: always; }
          .no-break { break-inside: avoid; page-break-inside: avoid; }
        }
      `}} />

      {/* CAPA */}
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-900 text-white page-break relative">
        <div className="text-center">
          <div className="w-32 h-32 bg-zinc-800 rounded mx-auto mb-8 flex items-center justify-center font-bold text-xl">
            {relatorio.obra.empresa}
          </div>
          <h1 className="text-6xl font-extrabold tracking-tight mb-6">RESUMO DO MÊS</h1>
          <div className="w-32 h-1 bg-yellow-500 mx-auto mb-6"></div>
          <h2 className="text-4xl font-semibold text-gray-300 mb-8">{relatorio.obra.nome}</h2>
          <div className="bg-white text-zinc-900 font-bold px-8 py-3 rounded-full text-lg uppercase tracking-wider inline-block">
            {relatorio.mesReferencia}
          </div>
        </div>
      </div>

      {/* RESUMO EXECUTIVO */}
      {relatorio.relatoEngenheiro && (
        <div className="w-full min-h-screen p-12 page-break bg-white">
          <div className="flex justify-between items-start border-b pb-4 mb-8">
            <div>
              <p className="text-gray-500 font-medium mb-1">{relatorio.obra.nome} - DADOS DA OBRA & RESUMO EXECUTIVO</p>
              <h2 className="text-3xl font-bold text-zinc-900">RELATÓRIO DE PROGRESSO MENSAL</h2>
              <p className="text-gray-500">Parecer Técnico e Acompanhamento da Engenharia</p>
            </div>
            <div className="bg-blue-600 text-white font-bold px-6 py-2 rounded-full uppercase">
              {relatorio.mesReferencia}
            </div>
          </div>

          <div className="border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
              <h3 className="text-xl font-bold text-blue-800 uppercase tracking-wide">RELATO DO ENGENHEIRO RESPONSÁVEL</h3>
              <div className="ml-auto text-sm text-gray-400 italic">Visão Geral Consolidada</div>
            </div>
            <div className="text-gray-700 leading-relaxed space-y-4 whitespace-pre-wrap text-lg">
              {relatorio.relatoEngenheiro}
            </div>
          </div>
          <div className="mt-8 text-xs text-gray-400">Nota: Resumo mensal gerado pelo sistema.</div>
        </div>
      )}

      {/* SEÇÕES DE FOTOS */}
      {relatorio.secoes.map((secao: any) => (
        <div key={secao.id} className="w-full min-h-screen p-12 page-break bg-white relative">
          <div className="flex justify-between items-center border-b pb-4 mb-8">
            <p className="text-gray-500 font-medium">{relatorio.obra.nome} - REGISTRO FOTOGRÁFICO</p>
            <div className="font-bold text-lg text-gray-300">{relatorio.obra.empresa}</div>
          </div>

          <h2 className="text-2xl font-bold text-blue-800 uppercase tracking-wide mb-8">
            {secao.tipo === 'ANTES_DEPOIS' ? `${secao.titulo} - EVOLUÇÃO (ANTES E DEPOIS)` : `FOTOS DO MÊS - ${secao.titulo}`}
          </h2>

          {secao.tipo === 'FOTOS' ? (
            <div className="grid grid-cols-2 gap-8">
              {secao.fotos.map((foto: any, index: number) => (
                <div key={index} className="no-break border rounded-2xl overflow-hidden bg-gray-50 p-2 shadow-sm">
                  <img src={foto.base64Data} alt="" className="w-full h-[400px] object-cover rounded-xl mb-4" />
                  <div className="flex justify-between items-center px-2 pb-2">
                    <span className="bg-blue-600 text-white font-semibold px-4 py-1 rounded-full text-sm">
                      {secao.titulo.toUpperCase()}
                    </span>
                    <span className="text-gray-500 text-sm">{foto.dataFoto}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-8 h-[700px]">
              {/* Coluna ANTES */}
              <div className="no-break border rounded-2xl overflow-hidden bg-gray-50 p-2 shadow-sm flex flex-col">
                <div className="bg-red-700 text-white text-center font-bold py-3 text-lg rounded-t-xl mb-2">ANTES</div>
                <div className="flex-1 space-y-4">
                  {secao.fotos.filter((f: any) => f.tipoEvolucao === "ANTES").map((foto: any, index: number) => (
                    <img key={index} src={foto.base64Data} alt="Antes" className="w-full h-[550px] object-cover rounded-xl" />
                  ))}
                </div>
                <div className="flex justify-between items-center px-2 py-3">
                  <span className="bg-blue-600 text-white font-semibold px-4 py-1 rounded-full text-sm">
                    {secao.titulo.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Coluna DEPOIS */}
              <div className="no-break border rounded-2xl overflow-hidden bg-gray-50 p-2 shadow-sm flex flex-col">
                <div className="bg-green-700 text-white text-center font-bold py-3 text-lg rounded-t-xl mb-2">DEPOIS</div>
                <div className="flex-1 space-y-4">
                  {secao.fotos.filter((f: any) => f.tipoEvolucao === "DEPOIS").map((foto: any, index: number) => (
                    <img key={index} src={foto.base64Data} alt="Depois" className="w-full h-[550px] object-cover rounded-xl" />
                  ))}
                </div>
                <div className="flex justify-between items-center px-2 py-3">
                  <span className="bg-blue-600 text-white font-semibold px-4 py-1 rounded-full text-sm">
                    {secao.titulo.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-12 left-12 text-xs text-gray-400">Nota: Resumo mensal gerado pelo sistema.</div>
        </div>
      ))}

    </div>
  );
}
