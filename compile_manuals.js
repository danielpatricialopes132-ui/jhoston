const fs = require("fs");
const path = require("path");

function markdownToHtml(mdText) {
  // Regex compiler para converter Markdown simples em HTML
  let html = mdText;

  // Escapar HTML básico
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Código em bloco
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Tabelas
  // Regex simples para converter tabelas Markdown em HTML tables
  const lines = html.split("\n");
  let inTable = false;
  let tableHeader = true;
  let tableRows = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("|") && line.endsWith("|")) {
      inTable = true;
      // Pular a linha divisora | :--- | :--- |
      if (line.includes("---") || line.includes("===")) {
        lines[i] = "";
        continue;
      }
      const cells = line.split("|").slice(1, -1).map(c => c.trim());
      if (tableHeader) {
        lines[i] = `<thead><tr>${cells.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>`;
        tableHeader = false;
      } else {
        lines[i] = `<tr>${cells.map(c => `<td>${c}</td>`).join("")}</tr>`;
      }
    } else {
      if (inTable) {
        lines[i] = "</tbody></table>\n" + lines[i];
        inTable = false;
        tableHeader = true;
      }
    }
  }
  
  html = lines.join("\n");
  // Envolver tabelas remanescentes
  html = html.replace(/(<thead>[\s\S]*?<\/tbody>)/g, '<table class="table">$1</table>');

  // Cabeçalhos
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Links do tipo [texto](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Negrito e Itálico
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Listas não ordenadas
  html = html.replace(/^\s*[\*\-]\s+(.*$)/gim, "<li>$1</li>");
  // Ajustar múltiplos <li> seguidos em <ul>
  html = html.replace(/(<li>.*<\/li>)/g, "<ul>$1</ul>");
  // Limpar tags <ul> coladas
  html = html.replace(/<\/ul>\s*<ul>/g, "");

  // Listas ordenadas
  html = html.replace(/^\s*\d+\.\s+(.*$)/gim, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/g, "<ol>$1</ol>");
  html = html.replace(/<\/ol>\s*<ol>/g, "");
  // Ajustar colisão entre ul e ol
  html = html.replace(/<ul>(<ol>[\s\S]*?<\/ol>)<\/ul>/g, "$1");
  html = html.replace(/<ol>(<ul>[\s\S]*?<\/ul>)<\/ol>/g, "$1");

  // Linhas horizontais
  html = html.replace(/^\s*---+\s*$/gim, "<hr />");

  // Parágrafos (linhas não vazias e que não começam com tags HTML)
  const blockTags = ["<h", "<ul", "<ol", "<li", "<pre", "<table", "<tr", "<td", "<th", "<thead", "<tbody", "<hr", "<a", "<div"];
  const finalLines = html.split("\n").map(line => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    const isBlock = blockTags.some(tag => trimmed.startsWith(tag));
    if (isBlock) return line;
    return `<p>${line}</p>`;
  });

  return finalLines.join("\n");
}

function compileFile(inputFileName, title) {
  const filePath = path.join(__dirname, inputFileName);
  if (!fs.existsSync(filePath)) {
    console.error(`Erro: Arquivo ${inputFileName} não encontrado.`);
    return;
  }

  const markdown = fs.readFileSync(filePath, "utf-8");
  const bodyContent = markdownToHtml(markdown);

  const htmlTemplate = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    :root {
      --primary: #0284c7;
      --text-main: #334155;
      --text-heading: #0f172a;
      --border-color: #e2e8f0;
      --bg-pre: #f1f5f9;
    }

    body {
      font-family: 'Inter', sans-serif;
      line-height: 1.6;
      color: var(--text-main);
      max-width: 900px;
      margin: 40px auto;
      padding: 0 24px;
      background-color: #ffffff;
    }

    h1, h2, h3, h4 {
      color: var(--text-heading);
      font-weight: 700;
      margin-top: 1.8em;
      margin-bottom: 0.6em;
    }

    h1 {
      font-size: 32px;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 12px;
      margin-top: 0;
    }

    h2 {
      font-size: 22px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 6px;
    }

    h3 {
      font-size: 18px;
    }

    p {
      margin-bottom: 16px;
    }

    a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 500;
    }

    a:hover {
      text-decoration: underline;
    }

    ul, ol {
      margin-bottom: 16px;
      padding-left: 24px;
    }

    li {
      margin-bottom: 6px;
    }

    pre {
      background-color: var(--bg-pre);
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: monospace;
      font-size: 13px;
      border: 1px solid var(--border-color);
      margin-bottom: 16px;
      white-space: pre-wrap;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 14px;
    }

    th, td {
      border: 1px solid var(--border-color);
      padding: 12px;
      text-align: left;
    }

    th {
      background-color: #f8fafc;
      color: var(--text-heading);
      font-weight: 600;
    }

    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    hr {
      border: 0;
      border-top: 1px solid var(--border-color);
      margin: 40px 0;
    }

    .no-print-btn {
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: var(--primary);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      font-family: 'Inter', sans-serif;
    }

    .no-print-btn:hover {
      background-color: #0369a1;
    }

    @media print {
      body {
        margin: 20px auto;
        padding: 0;
      }
      .no-print-btn {
        display: none;
      }
    }
  </style>
</head>
<body>
  <button class="no-print-btn" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
  ${bodyContent}
</body>
</html>`;

  const outputFileName = inputFileName.replace(".md", ".html");
  fs.writeFileSync(path.join(__dirname, outputFileName), htmlTemplate, "utf-8");
  console.log(`Sucesso: ${inputFileName} compilado para ${outputFileName}`);
}

compileFile("MANUAL_USUARIO.md", "Manual do Usuário - JHOSTON TEC");
compileFile("PLANO_TREINAMENTO.md", "Plano de Treinamento - JHOSTON TEC");
