"use client";

import { useEffect, useState, startTransition } from "react";
import { getContatos, salvarContato, deletarContato, getCompromissos, salvarCompromisso, deletarCompromisso } from "./actions";
import { getSession } from "@/app/login/actions";
import { Search, Plus, Edit, Trash2, Calendar, Users, Phone, Bell } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Contato {
  id: number;
  nome: string;
  telefone: string;
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

  const [contatos, setContatos] = useState<Contato[]>([]);
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);

  // Modal Contato
  const [isContatoModalOpen, setIsContatoModalOpen] = useState(false);
  const [editingContato, setEditingContato] = useState<Contato | null>(null);
  const [cNome, setCNome] = useState("");
  const [cTelefone, setCTelefone] = useState("");
  const [cCategoria, setCCategoria] = useState("CLIENTE");

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
        categoria: cCategoria
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
      setCCategoria(c.categoria);
    } else {
      setEditingContato(null);
      setCNome("");
      setCTelefone("");
      setCCategoria("CLIENTE");
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
      // Formata a data para input datetime-local: YYYY-MM-DDTHH:mm
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

  const filteredContatos = activeContext === "TODAS" ? contatos : contatos.filter(c => c.empresa === activeContext);
  const filteredCompromissos = activeContext === "TODAS" ? compromissos : compromissos.filter(c => c.empresa === activeContext);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agenda Integrada</h1>
          <p className="text-slate-500 text-sm">Gerencie seus contatos e compromissos</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("CONTATOS")}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === "CONTATOS" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Users size={16} /> Contatos
          </button>
          <button
            onClick={() => setActiveTab("COMPROMISSOS")}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === "COMPROMISSOS" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Calendar size={16} /> Compromissos
          </button>
        </div>
      </div>

      {activeTab === "CONTATOS" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Seus Contatos</h2>
            <button onClick={() => openContatoModal()} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
              <Plus size={16} /> Novo Contato
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Nome</th>
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Categoria</th>
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Telefone (WhatsApp)</th>
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase">Empresa</th>
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredContatos.map(c => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-3 text-sm font-medium text-slate-800">{c.nome}</td>
                    <td className="p-3 text-sm text-slate-500">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                        {c.categoria}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-slate-600 flex items-center gap-2">
                      <Phone size={14} className="text-emerald-500" /> {c.telefone}
                    </td>
                    <td className="p-3 text-sm text-slate-500">{c.empresa}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => openContatoModal(c)} className="text-slate-400 hover:text-blue-500 p-1"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteContato(c.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                {filteredContatos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">Nenhum contato encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "COMPROMISSOS" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Calendário de Compromissos</h2>
            <button onClick={() => openCompromissoModal()} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
              <Plus size={16} /> Novo Compromisso
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompromissos.map(c => (
              <div key={c.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-800">{c.titulo}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => openCompromissoModal(c)} className="text-slate-400 hover:text-blue-500"><Edit size={14} /></button>
                    <button onClick={() => handleDeleteCompromisso(c.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="text-sm text-slate-500 mb-3 flex items-center gap-1">
                  <Calendar size={14} />
                  {format(new Date(c.dataHora), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                </div>
                {c.descricao && <p className="text-sm text-slate-600 mb-3">{c.descricao}</p>}
                
                {c.contato && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <Users size={14} />
                      </div>
                      <div className="text-xs">
                        <p className="font-medium text-slate-800">{c.contato.nome}</p>
                        <p className="text-slate-500">{c.contato.telefone}</p>
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
                    }} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-full transition-colors" title="Notificar via WhatsApp">
                      <Bell size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {filteredCompromissos.length === 0 && (
              <div className="col-span-full p-8 text-center text-slate-500 text-sm">
                Nenhum compromisso agendado.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CONTATO */}
      {isContatoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{editingContato ? 'Editar Contato' : 'Novo Contato'}</h2>
            <form onSubmit={handleSaveContato} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                <input required value={cNome} onChange={e => setCNome(e.target.value)} type="text" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone (WhatsApp)</label>
                <input required value={cTelefone} onChange={e => setCTelefone(e.target.value)} type="text" placeholder="Ex: 5511999999999" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                <select value={cCategoria} onChange={e => setCCategoria(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none">
                  <option value="CLIENTE">Cliente</option>
                  <option value="FORNECEDOR">Fornecedor</option>
                  <option value="EQUIPE">Equipe</option>
                  <option value="OUTROS">Outros</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsContatoModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-white bg-teal-600 hover:bg-teal-700 rounded-lg font-medium">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL COMPROMISSO */}
      {isCompromissoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{editingCompromisso ? 'Editar Compromisso' : 'Novo Compromisso'}</h2>
            <form onSubmit={handleSaveCompromisso} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                <input required value={coTitulo} onChange={e => setCoTitulo(e.target.value)} type="text" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data e Hora</label>
                <input required value={coDataHora} onChange={e => setCoDataHora(e.target.value)} type="datetime-local" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contato Relacionado (Opcional)</label>
                <select value={coContatoId} onChange={e => setCoContatoId(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none">
                  <option value="">Nenhum contato selecionado</option>
                  {filteredContatos.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} ({c.categoria})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <textarea value={coDescricao} onChange={e => setCoDescricao(e.target.value)} rows={3} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCompromissoModalOpen(false)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-white bg-teal-600 hover:bg-teal-700 rounded-lg font-medium">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
