'use client';

import React, { useState } from 'react';

export default function MarketingDashboard() {
  const [activeTab, setActiveTab] = useState('TOUR360');
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Marketing & Tour 360</h1>
          <p className="text-gray-500 mt-1 text-sm">Ferramentas de IA para impulsionar suas vendas</p>
        </div>
        <button 
          onClick={() => setShowHelp(!showHelp)}
          className="btn btn-secondary shadow-sm hover:shadow-md"
        >
          {showHelp ? 'Ocultar Ajuda' : 'Ajuda Detalhada 💡'}
        </button>
      </div>

      {showHelp && (
        <div className="mb-8 glass-card border border-teal-200 p-6 rounded-2xl text-teal-900 shadow-sm animate-fade-in">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span> Como utilizar as Ferramentas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="bg-white/50 p-4 rounded-xl">
              <p className="font-bold text-teal-950 mb-2">📸 Tour 360 & Nadir Patching</p>
              <p className="text-teal-800 leading-relaxed">Use para corrigir fotos 360 cobrindo a marca do tripé (Nadir) com a logo da Jhoston. Oculte imperfeições antes de enviar para plataformas de visualização como o Kuula.</p>
              
              <p className="font-bold text-teal-950 mb-2 mt-4">✨ Antes e Depois</p>
              <p className="text-teal-800 leading-relaxed">Faça o upload do estado original da obra e do resultado final. O sistema mesclará as imagens e a IA escreverá uma legenda de Instagram focada em vendas.</p>
            </div>
            <div className="bg-white/50 p-4 rounded-xl">
              <p className="font-bold text-teal-950 mb-2">⭐ Provas Sociais</p>
              <p className="text-teal-800 leading-relaxed">Cole o feedback recebido via WhatsApp. A IA criará uma legenda de agradecimento para postar junto com o print e, internamente, extrairá reclamações.</p>
              
              <p className="font-bold text-teal-950 mb-2 mt-4">🚧 Bastidores (Diário de Obra)</p>
              <p className="text-teal-800 leading-relaxed">Transforma relatos técnicos da obra em histórias cativantes ("Por trás das câmeras") para engajar seu público e mostrar autoridade.</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex space-x-2 border-b border-gray-200/60 pb-4 mb-6 overflow-x-auto hide-scrollbar">
        <TabButton active={activeTab === 'TOUR360'} onClick={() => setActiveTab('TOUR360')} label="Tour 360" />
        <TabButton active={activeTab === 'ANTES_DEPOIS'} onClick={() => setActiveTab('ANTES_DEPOIS')} label="Antes e Depois" />
        <TabButton active={activeTab === 'PROVAS_SOCIAIS'} onClick={() => setActiveTab('PROVAS_SOCIAIS')} label="Provas Sociais" />
        <TabButton active={activeTab === 'DIARIO_OBRA'} onClick={() => setActiveTab('DIARIO_OBRA')} label="Bastidores (Diário)" />
        <TabButton active={activeTab === 'BIO_LINK'} onClick={() => setActiveTab('BIO_LINK')} label="Link na Bio" />
      </div>

      <div className="glass-card p-8 rounded-2xl min-h-[400px]">
        {activeTab === 'TOUR360' && <Tour360Tab />}
        {activeTab === 'ANTES_DEPOIS' && <AntesDepoisTab />}
        {activeTab === 'PROVAS_SOCIAIS' && <ProvasSociaisTab />}
        {activeTab === 'DIARIO_OBRA' && <DiarioObraMktTab />}
        {activeTab === 'BIO_LINK' && <BioLinkTab />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-all rounded-full \${
        active 
          ? 'bg-[var(--primary)] text-white shadow-md shadow-teal-900/20 transform scale-105' 
          : 'bg-white/50 text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm'
      }`}
    >
      {label}
    </button>
  );
}

// STUBS DAS ABAS
function Tour360Tab() {
  return <div>Ferramenta de Nadir Patching e Iframe de Obras em desenvolvimento.</div>;
}

function AntesDepoisTab() {
  const [legenda, setLegenda] = useState('');
  const [loading, setLoading] = useState(false);

  const gerarLegenda = async () => {
    setLoading(true);
    const res = await fetch('/api/marketing/gemini', {
      method: 'POST',
      body: JSON.stringify({ action: 'ANTES_DEPOIS' })
    });
    const data = await res.json();
    setLegenda(data.result || 'Erro ao gerar');
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-gray-800">Gerador de Antes e Depois</h2>
      <p className="text-gray-500 mb-6">Faça o upload de duas fotos para mesclar com uma moldura de marcação e gerar a legenda IA.</p>
      
      <div className="flex flex-wrap gap-6 mb-6">
        <div className="w-40 h-40 bg-gray-100/50 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-[var(--primary)] transition-all cursor-pointer">
          <span className="text-2xl mb-2">📸</span>
          <span className="font-medium text-sm">Antes</span>
        </div>
        <div className="w-40 h-40 bg-gray-100/50 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-[var(--primary)] transition-all cursor-pointer">
          <span className="text-2xl mb-2">📸</span>
          <span className="font-medium text-sm">Depois</span>
        </div>
      </div>
      
      <button onClick={gerarLegenda} disabled={loading} className="btn btn-primary mb-6">
        {loading ? '✨ Processando com IA...' : '✨ Gerar Post e Legenda'}
      </button>
      
      {legenda && (
        <div className="animate-slide-up">
          <label className="block text-sm font-bold text-gray-700 mb-2">Legenda Gerada:</label>
          <textarea className="w-full p-4 border border-gray-200 rounded-xl h-40 bg-white/50 focus:bg-white transition-colors focus:ring-2 focus:ring-[var(--primary)] outline-none resize-none" value={legenda} readOnly />
        </div>
      )}
    </div>
  );
}

function ProvasSociaisTab() {
  return <div>Processador de Feedbacks com extração JSON em desenvolvimento.</div>;
}

function DiarioObraMktTab() {
  return <div>Conversão de Diário de Obra em Post em desenvolvimento.</div>;
}

function BioLinkTab() {
  return <div>Gerenciador do Linktree Interno em desenvolvimento.</div>;
}
