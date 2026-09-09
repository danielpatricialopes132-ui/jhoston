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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Agenda Integrada</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie seus contatos e compromissos com facilidade</p>
        </div>
        <div className="flex bg-slate-100/80 backdrop-blur-sm p-1 rounded-xl shadow-inner border border-slate-200/60">
          <button
            onClick={() => setActiveTab("CONTATOS")}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === "CONTATOS" ? "bg-white text-slate-800 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
          >
            <Users size={18} /> Contatos
          </button>
          <button
            onClick={() => setActiveTab("COMPROMISSOS")}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === "COMPROMISSOS" ? "bg-white text-slate-800 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
          >
            <Calendar size={18} /> Compromissos
          </button>
        </div>
      </div>

      {activeTab === "CONTATOS" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Users size={20} className="text-teal-600" /> Seus Contatos
              </h2>
              <button onClick={() => openContatoModal()} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-all shadow-sm hover:shadow-md active:scale-95">
                <Plus size={18} /> Novo Contato
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar contatos..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                {["TODAS", "CLIENTE", "FORNECEDOR", "EQUIPE"].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setFilterCategoria(cat)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors border ${filterCategoria === cat ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                  >
                    {cat === "TODAS" ? "Todos" : cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50/50 min-h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredContatos.map(c => (
                <div key={c.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-5 group flex flex-col h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={() => openContatoModal(c)} className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"><Edit size={14} /></button>
                    <button onClick={() => handleDeleteContato(c.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"><Trash2 size={14} /></button>
                  </div>
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 text-lg font-bold shadow-inner">
                      {c.nome.charAt(0).toUpperCase()}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${getCategoriaColor(c.categoria)}`}>
                      {getCategoriaIcon(c.categoria)} {c.categoria}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-slate-800 text-lg mb-1 line-clamp-1">{c.nome}</h3>
                  {c.categoria === 'FORNECEDOR' && c.tipoFornecedor && (
                    <p className="text-xs font-medium text-amber-600 mb-3 flex items-center gap-1">
                      <Tag size={12} /> {c.tipoFornecedor}
                    </p>
                  )}
                  
                  <div className="mt-auto space-y-2.5 pt-4 border-t border-slate-100">
                    <a href={`https://wa.me/${c.telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-slate-600 hover:text-emerald-600 group/link transition-colors">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover/link:bg-emerald-100 transition-colors">
                        <Phone size={14} />
                      </div>
                      <span className="font-medium">{c.telefone}</span>
                    </a>
                    
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-3 text-sm text-slate-600 hover:text-blue-600 group/link transition-colors">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover/link:bg-blue-100 transition-colors">
                          <Mail size={14} />
                        </div>
                        <span className="truncate">{c.email}</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredContatos.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Search size={24} className="text-slate-300" />
                  </div>
                  <p className="font-medium text-slate-600 mb-1">Nenhum contato encontrado</p>
                  <p className="text-sm">Tente ajustar seus filtros ou adicione um novo contato.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "COMPROMISSOS" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
               <Calendar size={20} className="text-teal-600" /> Calendário de Compromissos
            </h2>
            <button onClick={() => openCompromissoModal()} className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-all shadow-sm hover:shadow-md active:scale-95">
              <Plus size={18} /> Novo Compromisso
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-slate-50/50 p-4 -mx-6 -mb-6 rounded-b-2xl min-h-[400px]">
            {filteredCompromissos.map(c => (
              <div key={c.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-md transition-all relative group flex flex-col">
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={() => openCompromissoModal(c)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors"><Edit size={14} /></button>
                  <button onClick={() => handleDeleteCompromisso(c.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"><Trash2 size={14} /></button>
                </div>
                
                <h3 className="font-bold text-slate-800 text-lg mb-2 pr-16 line-clamp-2">{c.titulo}</h3>
                
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-sm font-medium mb-3 self-start">
                  <Calendar size={14} />
                  {format(new Date(c.dataHora), "dd/MM, HH:mm", { locale: ptBR })}
                </div>
                
                {c.descricao && <p className="text-sm text-slate-500 mb-4 line-clamp-3">{c.descricao}</p>}
                
                {c.contato && (
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                        {c.contato.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-sm">
                        <p className="font-semibold text-slate-800 line-clamp-1">{c.contato.nome}</p>
                        <p className="text-slate-500 text-xs">{c.contato.telefone}</p>
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
                    }} className="w-10 h-10 flex items-center justify-center text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors" title="Notificar via WhatsApp">
                      <Bell size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {filteredCompromissos.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Calendar size={24} className="text-slate-300" />
                </div>
                <p className="font-medium text-slate-600 mb-1">Nenhum compromisso</p>
                <p className="text-sm">Seu calendário está livre no momento.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CONTATO */}
      {isContatoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">{editingContato ? 'Editar Contato' : 'Novo Contato'}</h2>
              <button onClick={() => setIsContatoModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSaveContato} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome Completo</label>
                  <input required value={cNome} onChange={e => setCNome(e.target.value)} type="text" placeholder="João da Silva" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">WhatsApp</label>
                  <input required value={cTelefone} onChange={e => setCTelefone(e.target.value)} type="text" placeholder="5511999999999" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-mail (Opcional)</label>
                  <input value={cEmail} onChange={e => setCEmail(e.target.value)} type="email" placeholder="joao@exemplo.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Categoria</label>
                  <select value={cCategoria} onChange={e => setCCategoria(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all">
                    <option value="CLIENTE">Cliente</option>
                    <option value="FORNECEDOR">Fornecedor</option>
                    <option value="EQUIPE">Equipe</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>

                {cCategoria === 'FORNECEDOR' && (
                  <div className="sm:col-span-2 animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tipo de Fornecedor</label>
                    <input value={cTipoFornecedor} onChange={e => setCTipoFornecedor(e.target.value)} type="text" placeholder="Ex: Material, Serviço, Concreto, Locação..." className="w-full bg-amber-50/50 border border-amber-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all" />
                  </div>
                )}
              </div>
              
              <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsContatoModalOpen(false)} className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 text-white bg-teal-600 hover:bg-teal-700 rounded-xl font-medium transition-all shadow-sm active:scale-95">Salvar Contato</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL COMPROMISSO */}
      {isCompromissoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">{editingCompromisso ? 'Editar Compromisso' : 'Novo Compromisso'}</h2>
              <button onClick={() => setIsCompromissoModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSaveCompromisso} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Título</label>
                <input required value={coTitulo} onChange={e => setCoTitulo(e.target.value)} type="text" placeholder="Reunião de Alinhamento" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Data e Hora</label>
                <input required value={coDataHora} onChange={e => setCoDataHora(e.target.value)} type="datetime-local" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contato Relacionado (Opcional)</label>
                <select value={coContatoId} onChange={e => setCoContatoId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all">
                  <option value="">Nenhum contato selecionado</option>
                  {filteredContatos.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} ({c.categoria})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descrição</label>
                <textarea value={coDescricao} onChange={e => setCoDescricao(e.target.value)} rows={3} placeholder="Detalhes sobre o compromisso..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all resize-none" />
              </div>
              
              <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCompromissoModalOpen(false)} className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 text-white bg-teal-600 hover:bg-teal-700 rounded-xl font-medium transition-all shadow-sm active:scale-95">Salvar Compromisso</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
