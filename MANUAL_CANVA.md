# Manual: Como Usar Modelos do Canva como Proposta Comercial

Este guia passo a passo orienta sobre como criar, diagramar, configurar e integrar propostas comerciais criadas no **Canva** para serem preenchidas automaticamente pelo sistema **JHOSTON TEC Piscinas**.

---

## Passo 1: Criar o Design no Canva
1. Acesse o [Canva](https://www.canva.com) e crie um novo design ou use um modelo existente de Proposta Comercial.
2. Diagrame todo o documento livremente com as cores, logotipos e fontes da sua empresa.

---

## Passo 2: Inserir as Variáveis (Placeholders)
Nos locais do documento onde devem aparecer os dados dinâmicos do cliente e os valores da proposta, adicione as variáveis exatamente no formato `{variavel}` (com chaves). O sistema lerá estes marcadores e substituirá pelos dados correspondentes:

### Variáveis Cadastrais:
*   `{propostaNumero}`: Número de identificação formatado da proposta (ex: `0042/2026`).
*   `{clienteNome}`: Nome completo ou Razão Social do cliente.
*   `{clienteEndereco}`: Endereço completo informado no cadastro do CRM.
*   `{dataProposta}`: Data atual de geração por extenso (ex: `16 de Julho de 2026`).

### Variáveis de Valores e Áreas:
*   `{areaPiscina}`: Área total em metros quadrados (m²).
*   `{precoUnitario}`: Preço do m² do produto (ex: `270,00` para Premium ou `350,00` para Super Premium).
*   `{precoAditivo}`: Preço do m² do aditivo de salinidade (ex: `25,00`).
*   `{valorProduto}`: Subtotal correspondente ao produto (Área x Preço Unitário).
*   `{valorAditivo}`: Subtotal correspondente ao aditivo (Área x Preço Aditivo).
*   `{valorTotal}`: Soma total dos valores da proposta comercial.

### Variáveis de Condições de Pagamento (Forma de Parcelamento):
*   `{valorEntrada}`: Valor de entrada correspondente a 50% do valor do produto.
*   `{valorIntermediaria}`: Parcela intermediária correspondente a 30% do valor do produto.
*   `{valorFinal}`: Parcela final na entrega correspondente a 20% do valor do produto.

---

## Passo 3: Exportar o Design em PDF
1. No Canva, clique no botão **Compartilhar** no canto superior direito.
2. Clique em **Baixar**.
3. No campo *Tipo de arquivo*, selecione **PDF padrão** ou **PDF para impressão**.
4. Clique em **Baixar** para salvar o arquivo em seu computador.

---

## Passo 4: Converter o PDF para Word (.docx)
Como o sistema processa modelos em formato Word (`.docx`), você deve converter o PDF exportado pelo Canva:
1. Acesse uma ferramenta de conversão online gratuita e confiável, como:
   *   [Adobe Acrobat PDF to Word Converter](https://www.adobe.com/acrobat/online/pdf-to-word.html)
   *   [ILovePDF (PDF para Word)](https://www.ilovepdf.com/pdf_to_word)
   *   [Smallpdf (PDF para Word)](https://smallpdf.com/pdf-to-word)
2. Faça o upload do arquivo PDF baixado do Canva.
3. Inicie a conversão de alta fidelidade e baixe o arquivo `.docx` gerado.

---

## Passo 5: Renomear e Instalar no Sistema
Substitua o arquivo de template correspondente na pasta de modelos do sistema (`src/templates/`) renomeando o arquivo baixado exatamente para um dos nomes abaixo, dependendo da linha do produto:

*   Para propostas da linha **Premium**: `Proposta_Premium_Template.docx`
*   Para propostas da linha **Super Premium**: `Proposta_Super_Premium_Template.docx`
*   Para propostas da linha **Cascata**: `Proposta_Cascata_Template.docx`

---

## Passo 6: Testar e Validar
Acesse a aba **CRM / Oportunidades** no painel do escritório, crie uma oportunidade de teste com o produto configurado e clique no botão **Proposta**. Abra o arquivo baixado e certifique-se de que a diagramação visual permaneceu intacta e todos os marcadores `{}` foram substituídos pelas informações do teste.
