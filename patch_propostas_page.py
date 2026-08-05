import os

file_path = 'src/app/(dashboard)/crm/propostas/[id]/page.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add itensAdicionais to interface
content = content.replace(
    '  areasResina?: any;\n}',
    '  areasResina?: any;\n  itensAdicionais?: any;\n}'
)

# 2. Add calculations
calc_search = '''  // Cálculos base do display
  const displayValorProduto = oportunidade.areaPiscina * displayUnitPrice;
  const displayValorAditivo = oportunidade.areaPiscina * displayAditivoPrice;
  const displaySubTotal = displayValorProduto + displayValInsumos + displayValEstadia;

  const displayValorTotal = displayProduct === "REVESTIMENTO"
    ? displaySubTotal + displayImposto - displayDesconto
    : displayValorProduto + displayValorAditivo;'''

calc_replace = '''  // Cálculos base do display
  const itensAdicionais = oportunidade.itensAdicionais || [];
  const valorItensAdicionais = itensAdicionais.reduce((acc: number, curr: any) => acc + (curr.valorTotal || 0), 0);

  const displayValorProduto = oportunidade.areaPiscina * displayUnitPrice;
  const displayValorAditivo = oportunidade.areaPiscina * displayAditivoPrice;
  const displaySubTotal = displayValorProduto + displayValInsumos + displayValEstadia + valorItensAdicionais;

  const displayValorTotal = displayProduct === "REVESTIMENTO"
    ? displaySubTotal + displayImposto - displayDesconto
    : displayValorProduto + displayValorAditivo + valorItensAdicionais;'''

content = content.replace(calc_search, calc_replace)

# 3. Add rows in REVESTIMENTO table
# Search for Sub-Total row and insert before it
revest_subtotal_search = '''                <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                  <td colSpan={3} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#64748b" }}>Sub-Total:</td>'''

revest_items_replace = '''                {itensAdicionais.map((item: any, idx: number) => (
                  <tr key={`revest-add-${idx}`} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px", color: "#475569" }}>{item.nome}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{item.quantidade}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>Und</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>{formatCurrency(item.valorUnitario)}</td>
                    <td style={{ padding: "12px", textAlign: "right", fontWeight: 500 }}>{formatCurrency(item.valorTotal)}</td>
                  </tr>
                ))}
                <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                  <td colSpan={3} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#64748b" }}>Sub-Total:</td>'''

content = content.replace(revest_subtotal_search, revest_items_replace)

# 4. Add rows in CASCATA table
cascata_nota_search = '''                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <td colSpan={1} style={{ padding: "12px" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
                      * Nota: O valor a ser contratado diretamente com a ECO STONE BRASIL é de {formatCurrency(displayValorTotal)}, chave na mão.
                    </span>'''

cascata_items_replace = '''                {itensAdicionais.map((item: any, idx: number) => (
                  <tr key={`casc-add-${idx}`} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px", color: "#475569" }}>{item.nome}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{item.quantidade}</td>
                    <td style={{ padding: "12px", textAlign: "right", fontWeight: 500 }}>{formatCurrency(item.valorTotal)}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <td colSpan={1} style={{ padding: "12px" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
                      * Nota: O valor a ser contratado diretamente com a ECO STONE BRASIL é de {formatCurrency(displayValorTotal)}, chave na mão.
                    </span>'''

content = content.replace(cascata_nota_search, cascata_items_replace)

# 5. Add rows in PREMIUM / SUPER_PREMIUM table
premium_total_search = '''                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <td colSpan={2} style={{ padding: "12px" }}></td>
                  <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>Total Geral:</td>'''

premium_items_replace = '''                {itensAdicionais.map((item: any, idx: number) => (
                  <tr key={`prem-add-${idx}`} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "12px", color: "#475569" }}>{item.nome}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{item.quantidade}</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>{formatCurrency(item.valorUnitario)}</td>
                    <td style={{ padding: "12px", textAlign: "right", fontWeight: 500 }}>{formatCurrency(item.valorTotal)}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <td colSpan={2} style={{ padding: "12px" }}></td>
                  <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>Total Geral:</td>'''

content = content.replace(premium_total_search, premium_items_replace)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
