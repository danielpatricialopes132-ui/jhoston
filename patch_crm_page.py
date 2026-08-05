import re
import os

file_path = 'src/app/(dashboard)/crm/page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update import
content = content.replace(
    'import { getOportunidadesList, salvarOportunidade, deleteOportunidade, converterParaObra, getActiveContasBancarias } from "./actions";',
    'import { getOportunidadesList, salvarOportunidade, deleteOportunidade, converterParaObra, getActiveContasBancarias, getProdutosAtivos } from "./actions";'
)

# 2. Add itensAdicionais to Oportunidade interface
content = content.replace(
    '  areasResina?: any;\n}',
    '  areasResina?: any;\n  itensAdicionais?: any;\n}'
)

# 3. Add states for produtos and itensAdicionais
states_to_add = '''
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<any[]>([]);
  const [itensAdicionais, setItensAdicionais] = useState<any[]>([]);
  
  // Modal states para Itens Adicionais
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<any>(null);
  const [itemQuantidade, setItemQuantidade] = useState<number>(1);
  const [itemValorUnitario, setItemValorUnitario] = useState<number>(0);
'''
content = content.replace(
    '  const [areasResina, setAreasResina] = useState<{ descricao: string; area: number }[]>([]);',
    '  const [areasResina, setAreasResina] = useState<{ descricao: string; area: number }[]>([]);\n' + states_to_add
)

# 4. Update refreshData
refresh_data_replacement = '''  const refreshData = () => {
    getOportunidadesList().then((data) => {
      setOportunidades(data as any);
    });
    getActiveContasBancarias().then((data) => {
      setContasBancarias(data as any);
    });
    getProdutosAtivos().then((data) => {
      setProdutosDisponiveis(data as any);
    });
  };'''
content = content.replace(
    '''  const refreshData = () => {
    getOportunidadesList().then((data) => {
      setOportunidades(data as any);
    });
    getActiveContasBancarias().then((data) => {
      setContasBancarias(data as any);
    });
  };''',
    refresh_data_replacement
)

# 5. Update openNewModal & openEditModal
content = content.replace(
    '    setAreasResina([]);\n    setErrorMsg("");',
    '    setAreasResina([]);\n    setItensAdicionais([]);\n    setErrorMsg("");'
)
content = content.replace(
    '    setAreasResina(op.areasResina || []);\n    setErrorMsg("");',
    '    setAreasResina(op.areasResina || []);\n    setItensAdicionais(op.itensAdicionais || []);\n    setErrorMsg("");'
)

# 6. Update payload in handleSubmit
content = content.replace(
    '      areasResina: areasResina.length > 0 ? areasResina : null,\n    };',
    '      areasResina: areasResina.length > 0 ? areasResina : null,\n      itensAdicionais: itensAdicionais.length > 0 ? itensAdicionais : null,\n    };'
)

# 7. Add UI for itens adicionais before form actions/footer
ui_to_add = '''
                {/* INICIO - Itens Adicionais */}
                <div style={{ marginTop: "20px", marginBottom: "20px", padding: "16px", backgroundColor: "rgba(0,0,0,0.02)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h5 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--text-heading)" }}>Itens e Serviços Adicionais</h5>
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => { setItemSelecionado(produtosDisponiveis[0] || null); setItemQuantidade(1); setItemValorUnitario(0); setIsItemModalOpen(true); }}>
                      + Adicionar Item
                    </button>
                  </div>
                  
                  {itensAdicionais.length === 0 ? (
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "12px 0" }}>Nenhum item adicional incluído.</div>
                  ) : (
                    <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                          <th style={{ padding: "8px" }}>Item</th>
                          <th style={{ padding: "8px", textAlign: "center" }}>Qtd</th>
                          <th style={{ padding: "8px", textAlign: "right" }}>V. Unitário</th>
                          <th style={{ padding: "8px", textAlign: "right" }}>Total</th>
                          <th style={{ padding: "8px", textAlign: "center" }}>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itensAdicionais.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                            <td style={{ padding: "8px" }}>{item.nome}</td>
                            <td style={{ padding: "8px", textAlign: "center" }}>{item.quantidade}</td>
                            <td style={{ padding: "8px", textAlign: "right" }}>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.valorUnitario)}</td>
                            <td style={{ padding: "8px", textAlign: "right", fontWeight: 600 }}>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.valorTotal)}</td>
                            <td style={{ padding: "8px", textAlign: "center" }}>
                              <button type="button" className="btn btn-sm btn-danger" style={{ padding: "2px 6px" }} onClick={() => setItensAdicionais(itensAdicionais.filter((_, i) => i !== idx))}>X</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                {/* FIM - Itens Adicionais */}
'''
content = content.replace(
    '              </div>\n              <div className="modal-footer">',
    ui_to_add + '\n              </div>\n              <div className="modal-footer">'
)

# 8. Add modal for ItemSelecionado outside the main form loop
modal_to_add = '''
      {/* MODAL DE ITEM ADICIONAL */}
      {isItemModalOpen && (
        <div className="modal-backdrop" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: "500px", width: "95%" }}>
            <div className="modal-header">
              <h4 style={{ fontSize: "16px", color: "var(--text-heading)" }}>Adicionar Item Adicional</h4>
              <button className="close-btn" onClick={() => setIsItemModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="form-label">Selecione o Produto/Serviço</label>
                <select className="form-control" value={itemSelecionado?.id || ""} onChange={(e) => {
                  const p = produtosDisponiveis.find(p => p.id === parseInt(e.target.value));
                  setItemSelecionado(p);
                }}>
                  <option value="">-- Selecione --</option>
                  {produtosDisponiveis.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div className="grid-cols-2" style={{ gap: "12px", marginBottom: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Quantidade</label>
                  <input type="number" step="0.01" className="form-control" value={itemQuantidade} onChange={(e) => setItemQuantidade(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Valor Unitário (R$)</label>
                  <input type="number" step="0.01" className="form-control" value={itemValorUnitario} onChange={(e) => setItemValorUnitario(parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              <div style={{ textAlign: "right", fontWeight: 700, marginTop: "16px", marginBottom: "8px" }}>
                Total: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(itemQuantidade * itemValorUnitario)}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsItemModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => {
                if(itemSelecionado && itemQuantidade > 0) {
                  setItensAdicionais([...itensAdicionais, {
                    produtoId: itemSelecionado.id,
                    nome: itemSelecionado.nome,
                    quantidade: itemQuantidade,
                    valorUnitario: itemValorUnitario,
                    valorTotal: itemQuantidade * itemValorUnitario
                  }]);
                  setIsItemModalOpen(false);
                }
              }}>Adicionar</button>
            </div>
          </div>
        </div>
      )}
'''

content = content.replace(
    '      {/* MODAL DE CADASTRO/EDIÇÃO */}',
    modal_to_add + '\n      {/* MODAL DE CADASTRO/EDIÇÃO */}'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
