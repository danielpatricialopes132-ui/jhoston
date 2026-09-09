"use client";

import { useEffect, useState, startTransition } from "react";
import { getContatos, salvarContato, deletarContato, getCompromissos, salvarCompromisso, deletarCompromisso } from "./actions";
import { getSession } from "@/app/login/actions";
import { Search, Plus, Edit, Trash2, Calendar, Users, Phone, Bell, Mail, Tag, Briefcase, User, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Contato {
  id: number;
  nome: string;
  telefone: string;
  email?: string | null;
  tipoFornecedor?: string | null;
  categoria: string;
  empresa: string;
}

interface Compromisso {
  id: number;
  titulo: string;
  descricao: string | null;
  dataHora: Date;
  contatoId: number | null;
  contato?: Contato | null;
  status: string;
  empresa: string;
}

export default function AgendaPage() {
  const [activeTab, setActiveTab] = useState<"CONTATOS" | "COMPROMISSOS">("CONTATOS");
  const [activeContext, setActiveContext] = useState("TODAS");
  const [filterCategoria, setFilterCategoria] = useState<string>("TODAS");
  const [searchTerm, setSearchTerm] = useState("");

  const [contatos, setContatos] = useState<Contato[]>([]);
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);

  // Modal Contato
  const [isContatoModalOpen, setIsContatoModalOpen] = useState(false);
  const [editingContato, setEditingContato] = useState<Contato | null>(null);
  const [cNome, setCNome] = useState("");
  const [cTelefone, setCTelefone] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cCategoria, setCCategoria] = useState("CLIENTE");
  const [cTipoFornecedor, setCTipoFornecedor] = useState("");

  // Modal Compromisso
  const [isCompromissoModalOpen, setIsCompromissoModalOpen] = useState(false);
  const [editingCompromisso, setEditingCompromisso] = useState<Compromisso | null>(null);
  const [coTitulo, setCoTitulo] = useState("");
  const [coDescricao, setCoDescricao] = useState("");
  const [coDataHora, setCoDataHora] = useState("");
  const [coContatoId, setCoContatoId] = useState("");

  const refreshData = async () => {
    const [ctos, comps] = await Promise.all([getContatos(), getCompromissos()]);
    setContatos(ctos as any);
    setCompromissos(comps as any);
  };

  useEffect(() => {
    refreshData();
    getSession().then((sess) => {
      if (sess?.userEmpresa && sess.userEmpresa !== "AMBAS") {
        setActiveContext(sess.userEmpresa);
      } else {
        setActiveContext("TODAS");
      }
    });

    const handleContextChange = (e: CustomEvent<string>) => {
      if (e.detail && e.detail !== "AMBAS") {
        setActiveContext(e.detail);
      } else {
        setActiveContext("TODAS");
      }
    };
    window.addEventListener("empresaContextChanged" as any, handleContextChange);
    return () => {
      window.removeEventListener("empresaContextChanged" as any, handleContextChange);
    };
  }, []);

  // --- Contatos Handlers ---
  const handleSaveContato = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await salvarContato({
        id: editingContato?.id,
        nome: cNome,
        telefone: cTelefone,
        categoria: cCategoria,
        email: cEmail,
        tipoFornecedor: cCategoria === "FORNECEDOR" ? cTipoFornecedor : undefined,
      });
      setIsContatoModalOpen(false);
      refreshData();
    });
  };

  const openContatoModal = (c?: Contato) => {
    if (c) {
      setEditingContato(c);
      setCNome(c.nome);
      setCTelefone(c.telefone);
      setCEmail(c.email || "");
      setCCategoria(c.categoria);
      setCTipoFornecedor(c.tipoFornecedor || "");
    } else {
      setEditingContato(null);
      setCNome("");
      setCTelefone("");
      setCEmail("");
      setCCategoria("CLIENTE");
      setCTipoFornecedor("");
    }
    setIsContatoModalOpen(true);
  };

  const handleDeleteContato = async (id: number) => {
    if (confirm("Excluir este contato?")) {
      await deletarContato(id);
      refreshData();
    }
  };

  // --- Compromissos Handlers ---
  const handleSaveCompromisso = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await salvarCompromisso({
        id: editingCompromisso?.id,
        titulo: coTitulo,
        descricao: coDescricao,
        dataHora: new Date(coDataHora),
        contatoId: coContatoId ? parseInt(coContatoId) : undefined
      });
      setIsCompromissoModalOpen(false);
      refreshData();
    });
  };

  const openCompromissoModal = (c?: Compromisso) => {
    if (c) {
      setEditingCompromisso(c);
      setCoTitulo(c.titulo);
      setCoDescricao(c.descricao || "");
      const d = new Date(c.dataHora);
      const iso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      setCoDataHora(iso);
      setCoContatoId(c.contatoId ? c.contatoId.toString() : "");
    } else {
      setEditingCompromisso(null);
      setCoTitulo("");
      setCoDescricao("");
      setCoDataHora("");
      setCoContatoId("");
    }
    setIsCompromissoModalOpen(true);
  };

  const handleDeleteCompromisso = async (id: number) => {
    if (confirm("Excluir este compromisso?")) {
      await deletarCompromisso(id);
      refreshData();
    }
  };

  let filteredContatos = activeContext === "TODAS" ? contatos : contatos.filter(c => c.empresa === activeContext);
  
  if (filterCategoria !== "TODAS") {
    filteredContatos = filteredContatos.filter(c => c.categoria === filterCategoria);
  }

  if (searchTerm) {
    const lower = searchTerm.toLowerCase();
    filteredContatos = filteredContatos.filter(c => 
      c.nome.toLowerCase().includes(lower) || 
      c.telefone.includes(lower) ||
      (c.email && c.email.toLowerCase().includes(lower)) ||
      (c.tipoFornecedor && c.tipoFornecedor.toLowerCase().includes(lower))
    );
  }

  const filteredCompromissos = activeContext === "TODAS" ? compromissos : compromissos.filter(c => c.empresa === activeContext);

  const getCategoriaIcon = (cat: string) => {
    switch (cat) {
      case "CLIENTE": return <User size={16} />;
      case "FORNECEDOR": return <Briefcase size={16} />;
      case "EQUIPE": return <Users size={16} />;
      default: return <Tag size={16} />;
    }
  };

  const getCategoriaColor = (cat: string) => {
    switch (cat) {
      case "CLIENTE": return "bg-blue-100 text-blue-700 border-blue-200";
      case "FORNECEDOR": return "bg-amber-100 text-amber-700 border-amber-200";
      case "EQUIPE": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12 animate-in fade-in duration-500">
      {/* HEADER PREMIUM */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 sm:p-10 shadow-2xl border border-slate-700/50">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-teal-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wider mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span> Sistema Premium
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Agenda <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-400">Inteligente</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-3 max-w-xl leading-relaxed">
              Gestão centralizada de relacionamentos e compromissos. Notifique contatos instantaneamente e organize sua rotina com excelência.
            </p>
          </div>
          
          <div className="flex bg-slate-900/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/50 shadow-inner w-full lg:w-auto">
            <button
              onClick={() => setActiveTab("CONTATOS")}
              className={`flex-1 lg:flex-none px-6 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 ${activeTab === "CONTATOS" ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            >
              <Users size={18} /> Contatos
            </button>
            <button
              onClick={() => setActiveTab("COMPROMISSOS")}
              className={`flex-1 lg:flex-none px-6 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 ${activeTab === "COMPROMISSOS" ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            >
              <Calendar size={18} /> Compromissos
            </button>
          </div>
        </div>
      </div>

      {activeTab === "CONTATOS" && (
        <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 border-b border-slate-100/80 bg-white/40">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 shadow-sm border border-teal-100">
                  <Users size={22} />
                </div>
                Seus Contatos
              </h2>
              <button onClick={() => openContatoModal()} className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95 group">
                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> Novo Contato
              </button>
            </div>
            
            <div className="flex flex-col xl:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Pesquisar por nome, telefone ou tipo..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/80 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all text-sm shadow-sm"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 xl:pb-0 hide-scrollbar bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
                {["TODAS", "CLIENTE", "FORNECEDOR", "EQUIPE"].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setFilterCategoria(cat)}
                    className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${filterCategoria === cat ? 'bg-white text-teal-700 shadow-sm border border-slate-200/80 scale-100' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50 border border-transparent scale-95'}`}
                  >
                    {cat === "TODAS" ? "Todos os Filtros" : cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-8 bg-slate-50/30 min-h-[500px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredContatos.map(c => (
                <div key={c.id} className="bg-white rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 group flex flex-col h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 flex gap-2">
                    <button onClick={() => openContatoModal(c)} className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit size={16} /></button>
                    <button onClick={() => handleDeleteContato(c.id)} className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                  </div>
                  
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      {c.nome.charAt(0).toUpperCase()}
                    </div>
                    <span className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5 shadow-sm ${getCategoriaColor(c.categoria)}`}>
                      {getCategoriaIcon(c.categoria)} {c.categoria}
                    </span>
                  </div>
                  
                  <h3 className="font-extrabold text-slate-800 text-xl mb-1.5 line-clamp-1 group-hover:text-teal-600 transition-colors">{c.nome}</h3>
                  {c.categoria === 'FORNECEDOR' && c.tipoFornecedor && (
                    <p className="text-xs font-bold text-amber-600 mb-4 flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg w-fit">
                      <Tag size={12} /> {c.tipoFornecedor}
                    </p>
                  )}
                  
                  <div className="mt-auto space-y-3 pt-5 border-t border-slate-100">
                    <a href={`https://wa.me/${c.telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3.5 text-sm text-slate-600 hover:text-emerald-600 group/link transition-colors p-2 -mx-2 rounded-xl hover:bg-emerald-50/50">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center group-hover/link:bg-emerald-100 group-hover/link:text-emerald-600 transition-colors shadow-sm">
                        <Phone size={14} />
                      </div>
                      <span className="font-semibold">{c.telefone}</span>
                    </a>
                    
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-3.5 text-sm text-slate-600 hover:text-blue-600 group/link transition-colors p-2 -mx-2 rounded-xl hover:bg-blue-50/50">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center group-hover/link:bg-blue-100 group-hover/link:text-blue-600 transition-colors shadow-sm">
                          <Mail size={14} />
                        </div>
                        <span className="truncate font-medium">{c.email}</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredContatos.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-20 h-20 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-5 animate-pulse">
                    <Search size={32} className="text-slate-300" />
                  </div>
                  <p className="text-lg font-bold text-slate-700 mb-1">Nenhum contato encontrado</p>
                  <p className="text-sm text-slate-500">Tente ajustar seus filtros ou adicione um novo registro.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "COMPROMISSOS" && (
        <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 border-b border-slate-100/80 bg-white/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shadow-sm border border-blue-100">
                <Calendar size={22} />
              </div>
              Calendário de Compromissos
            </h2>
            <button onClick={() => openCompromissoModal()} className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95 group">
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> Novo Compromisso
            </button>
          </div>
          
          <div className="p-8 bg-slate-50/30 min-h-[500px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCompromissos.map(c => (
                <div key={c.id} className="bg-white border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 rounded-3xl p-6 transition-all duration-300 relative group flex flex-col">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 flex gap-2">
                    <button onClick={() => openCompromissoModal(c)} className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit size={16} /></button>
                    <button onClick={() => handleDeleteCompromisso(c.id)} className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                  </div>
                  
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50/80 text-blue-700 text-xs font-extrabold mb-4 self-start border border-blue-100">
                    <Calendar size={14} />
                    {format(new Date(c.dataHora), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                  </div>

                  <h3 className="font-extrabold text-slate-800 text-xl mb-3 pr-16 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{c.titulo}</h3>
                  
                  {c.descricao && <p className="text-sm text-slate-500 mb-6 line-clamp-3 leading-relaxed">{c.descricao}</p>}
                  
                  {c.contato && (
                    <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold shadow-inner">
                          {c.contato.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm line-clamp-1">{c.contato.nome}</p>
                          <p className="text-slate-500 text-xs font-medium">{c.contato.telefone}</p>
                        </div>
                      </div>
                      <button onClick={() => {
                        if (confirm('Enviar lembrete via WhatsApp para ' + c.contato!.nome + '?')) {
                          import('./actions').then(m => {
                            m.notificarCompromisso(c.id).then(() => {
                              alert('Notificação enviada!');
                            }).catch(e => {
                              alert('Erro ao enviar notificação.');
                              console.error(e);
                            });
                          });
                        }
                      }} className="w-11 h-11 flex items-center justify-center text-emerald-600 bg-emerald-50 hover:bg-emerald-500 hover:text-white rounded-2xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5" title="Notificar via WhatsApp">
                        <Bell size={18} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {filteredCompromissos.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-20 h-20 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-5">
                    <Calendar size={32} className="text-slate-300" />
                  </div>
                  <p className="text-lg font-bold text-slate-700 mb-1">Nenhum compromisso</p>
                  <p className="text-sm text-slate-500">Seu calendário está livre no momento.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONTATO */}
      {isContatoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600"><User size={20}/></div>
                {editingContato ? 'Editar Contato' : 'Novo Contato'}
              </h2>
              <button onClick={() => setIsContatoModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-full p-2 transition-all shadow-sm">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSaveContato} className="flex-1 overflow-y-auto p-8 space-y-6 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nome Completo</label>
                  <input required value={cNome} onChange={e => setCNome(e.target.value)} type="text" placeholder="Ex: João da Silva" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all shadow-sm" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">WhatsApp</label>
                  <input required value={cTelefone} onChange={e => setCTelefone(e.target.value)} type="text" placeholder="5511999999999" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all shadow-sm" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">E-mail (Opcional)</label>
                  <input value={cEmail} onChange={e => setCEmail(e.target.value)} type="email" placeholder="joao@exemplo.com" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all shadow-sm" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Categoria</label>
                  <select value={cCategoria} onChange={e => setCCategoria(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all shadow-sm appearance-none cursor-pointer">
                    <option value="CLIENTE">Cliente</option>
                    <option value="FORNECEDOR">Fornecedor</option>
                    <option value="EQUIPE">Equipe</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>

                {cCategoria === 'FORNECEDOR' && (
                  <div className="sm:col-span-2 animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Fornecedor</label>
                    <input value={cTipoFornecedor} onChange={e => setCTipoFornecedor(e.target.value)} type="text" placeholder="Ex: Material, Serviço, Concreto, Locação..." className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all shadow-sm" />
                  </div>
                )}
              </div>
              
              <div className="pt-8 mt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsContatoModalOpen(false)} className="px-6 py-3.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-bold transition-colors shadow-sm">Cancelar</button>
                <button type="submit" className="px-6 py-3.5 text-white bg-slate-900 hover:bg-slate-800 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95">Salvar Contato</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL COMPROMISSO */}
      {isCompromissoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><Calendar size={20}/></div>
                {editingCompromisso ? 'Editar Compromisso' : 'Novo Compromisso'}
              </h2>
              <button onClick={() => setIsCompromissoModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-full p-2 transition-all shadow-sm">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSaveCompromisso} className="flex-1 overflow-y-auto p-8 space-y-6 bg-white">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Título do Compromisso</label>
                <input required value={coTitulo} onChange={e => setCoTitulo(e.target.value)} type="text" placeholder="Ex: Reunião de Alinhamento" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Data e Hora</label>
                <input required value={coDataHora} onChange={e => setCoDataHora(e.target.value)} type="datetime-local" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Contato Relacionado (Opcional)</label>
                <select value={coContatoId} onChange={e => setCoContatoId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm appearance-none cursor-pointer">
                  <option value="">Nenhum contato selecionado</option>
                  {filteredContatos.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} ({c.categoria})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Descrição</label>
                <textarea value={coDescricao} onChange={e => setCoDescricao(e.target.value)} rows={3} placeholder="Detalhes adicionais sobre o compromisso..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none shadow-sm" />
              </div>
              
              <div className="pt-8 mt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCompromissoModalOpen(false)} className="px-6 py-3.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-bold transition-colors shadow-sm">Cancelar</button>
                <button type="submit" className="px-6 py-3.5 text-white bg-slate-900 hover:bg-slate-800 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95">Salvar Compromisso</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
