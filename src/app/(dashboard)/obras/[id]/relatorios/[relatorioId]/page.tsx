"use client"

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  atualizarRelatoEngenheiro,
  criarSecao,
  deletarSecao,
  adicionarFoto,
  deletarFoto,
} from "../actions";

// Tipos simplificados para uso no client
type Foto = { id: number; secaoId: number; base64Data: string; dataFoto: string | null; tipoEvolucao: string | null };
type Secao = { id: number; titulo: string; tipo: string; ordem: number; fotos: Foto[] };
type Relatorio = { id: number; obraId: number; mesReferencia: string; relatoEngenheiro: string; secoes: Secao[] };

export default function BuilderRelatorioPage() {
  const params = useParams();
  const router = useRouter();
  const obraId = parseInt(params.id as string);
  const relatorioId = parseInt(params.relatorioId as string);

  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados dos forms
  const [relato, setRelato] = useState("");
  const [mesRef, setMesRef] = useState("");
  const [novaSecaoTitulo, setNovaSecaoTitulo] = useState("");
  const [novaSecaoTipo, setNovaSecaoTipo] = useState<"FOTOS" | "ANTES_DEPOIS">("FOTOS");

  useEffect(() => {
    fetch(`/api/relatorios/${relatorioId}`)
      .then(res => res.json())
      .then(data => {
        setRelatorio(data);
        setRelato(data.relatoEngenheiro);
        setMesRef(data.mesReferencia);
        setLoading(false);
      });
  }, [relatorioId]);

  const handleSalvarCabecalho = async () => {
    await atualizarRelatoEngenheiro(relatorioId, relato, mesRef);
    alert("Cabeçalho salvo!");
  };

  const handleAddSecao = async () => {
    if (!novaSecaoTitulo) return;
    const ordem = relatorio ? relatorio.secoes.length : 0;
    const secao = await criarSecao(relatorioId, novaSecaoTitulo, novaSecaoTipo, ordem);
    setRelatorio(prev => prev ? { ...prev, secoes: [...prev.secoes, { ...secao, fotos: [] }] } : null);
    setNovaSecaoTitulo("");
  };

  const handleDeleteSecao = async (secaoId: number) => {
    if (!confirm("Deletar seção?")) return;
    await deletarSecao(secaoId);
    setRelatorio(prev => prev ? { ...prev, secoes: prev.secoes.filter(s => s.id !== secaoId) } : null);
  };

  const handleUploadFoto = async (secaoId: number, file: File, tipoEvolucao?: "ANTES" | "DEPOIS") => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const dataFoto = new Date().toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: '2-digit' });
      const foto = await adicionarFoto(secaoId, base64, dataFoto, tipoEvolucao);
      
      setRelatorio(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          secoes: prev.secoes.map(s => {
            if (s.id === secaoId) {
              return { ...s, fotos: [...s.fotos, foto] };
            }
            return s;
          })
        };
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteFoto = async (secaoId: number, fotoId: number) => {
    if (!confirm("Deletar foto?")) return;
    await deletarFoto(fotoId);
    setRelatorio(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        secoes: prev.secoes.map(s => {
          if (s.id === secaoId) {
            return { ...s, fotos: s.fotos.filter(f => f.id !== fotoId) };
          }
          return s;
        })
      };
    });
  };

  if (loading) return <div className="p-6">Carregando...</div>;
  if (!relatorio) return <div className="p-6">Relatório não encontrado.</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Construtor de Relatório</h1>
        <div className="flex gap-4">
          <Link href={`/obras/${obraId}/relatorios`} className="px-4 py-2 bg-gray-200 rounded">Voltar</Link>
          <Link href={`/obras/${obraId}/relatorios/${relatorioId}/print`} target="_blank" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
            Imprimir / PDF
          </Link>
        </div>
      </div>

      {/* Cabeçalho */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border">
        <h2 className="text-lg font-semibold mb-4">Informações Gerais</h2>
        <div className="grid grid-cols-1 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Mês de Referência</label>
            <input 
              value={mesRef} onChange={e => setMesRef(e.target.value)} 
              className="w-full border rounded p-2" 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Parecer Técnico (Relato do Engenheiro)</label>
            <textarea 
              value={relato} onChange={e => setRelato(e.target.value)} 
              className="w-full border rounded p-2 h-32" 
            />
          </div>
        </div>
        <button onClick={handleSalvarCabecalho} className="bg-green-600 text-white px-4 py-2 rounded">
          Salvar Cabeçalho
        </button>
      </div>

      {/* Seções */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Seções de Fotos</h2>
        
        {relatorio.secoes.map(secao => (
          <div key={secao.id} className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-semibold text-lg">{secao.titulo} <span className="text-sm text-gray-400 font-normal ml-2">({secao.tipo})</span></h3>
              <button onClick={() => handleDeleteSecao(secao.id)} className="text-red-500 hover:underline text-sm">Remover Seção</button>
            </div>

            {secao.tipo === "FOTOS" && (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {secao.fotos.map(foto => (
                    <div key={foto.id} className="relative group rounded overflow-hidden border">
                      <img src={foto.base64Data} alt="Foto" className="w-full h-32 object-cover" />
                      <button 
                        onClick={() => handleDeleteFoto(secao.id, foto.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >×</button>
                      {foto.dataFoto && <div className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1 w-full">{foto.dataFoto}</div>}
                    </div>
                  ))}
                </div>
                <div>
                  <label className="bg-gray-100 border border-gray-300 rounded px-4 py-2 cursor-pointer text-sm font-medium hover:bg-gray-200">
                    + Adicionar Foto
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      if (e.target.files?.[0]) handleUploadFoto(secao.id, e.target.files[0]);
                    }} />
                  </label>
                </div>
              </div>
            )}

            {secao.tipo === "ANTES_DEPOIS" && (
              <div className="grid grid-cols-2 gap-6">
                {/* ANTES */}
                <div className="border rounded p-4 text-center">
                  <h4 className="font-semibold text-gray-700 mb-2">FOTO ANTES</h4>
                  {secao.fotos.filter(f => f.tipoEvolucao === "ANTES").map(foto => (
                    <div key={foto.id} className="relative group rounded overflow-hidden border mb-2">
                      <img src={foto.base64Data} alt="Antes" className="w-full h-40 object-cover" />
                      <button 
                        onClick={() => handleDeleteFoto(secao.id, foto.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >×</button>
                    </div>
                  ))}
                  {secao.fotos.filter(f => f.tipoEvolucao === "ANTES").length === 0 && (
                    <label className="block bg-gray-100 border-2 border-dashed border-gray-300 rounded p-6 cursor-pointer text-sm text-gray-500 hover:bg-gray-200 transition">
                      + Adicionar "Antes"
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        if (e.target.files?.[0]) handleUploadFoto(secao.id, e.target.files[0], "ANTES");
                      }} />
                    </label>
                  )}
                </div>

                {/* DEPOIS */}
                <div className="border rounded p-4 text-center">
                  <h4 className="font-semibold text-gray-700 mb-2">FOTO DEPOIS</h4>
                  {secao.fotos.filter(f => f.tipoEvolucao === "DEPOIS").map(foto => (
                    <div key={foto.id} className="relative group rounded overflow-hidden border mb-2">
                      <img src={foto.base64Data} alt="Depois" className="w-full h-40 object-cover" />
                      <button 
                        onClick={() => handleDeleteFoto(secao.id, foto.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >×</button>
                    </div>
                  ))}
                  {secao.fotos.filter(f => f.tipoEvolucao === "DEPOIS").length === 0 && (
                    <label className="block bg-gray-100 border-2 border-dashed border-gray-300 rounded p-6 cursor-pointer text-sm text-gray-500 hover:bg-gray-200 transition">
                      + Adicionar "Depois"
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        if (e.target.files?.[0]) handleUploadFoto(secao.id, e.target.files[0], "DEPOIS");
                      }} />
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Adicionar Nova Seção */}
        <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Título da Nova Seção</label>
            <input 
              value={novaSecaoTitulo} 
              onChange={e => setNovaSecaoTitulo(e.target.value)}
              placeholder="Ex: Cozinha, Quarto Helena, Evolução Varanda..."
              className="w-full border rounded p-2" 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Tipo</label>
            <select 
              value={novaSecaoTipo} 
              onChange={e => setNovaSecaoTipo(e.target.value as any)}
              className="border rounded p-2 bg-white"
            >
              <option value="FOTOS">Galeria Comum</option>
              <option value="ANTES_DEPOIS">Comparativo Antes/Depois</option>
            </select>
          </div>
          <button onClick={handleAddSecao} className="bg-gray-800 text-white px-4 py-2 rounded font-medium">
            Adicionar Seção
          </button>
        </div>
      </div>
    </div>
  );
}
