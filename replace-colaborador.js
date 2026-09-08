const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/components/Sidebar.tsx',
  'src/app/(dashboard)/viagens/page.tsx',
  'src/app/(dashboard)/vales/page.tsx',
  'src/app/(dashboard)/relatorios/page.tsx',
  'src/app/(dashboard)/ponto/page.tsx',
  'src/app/(dashboard)/page.tsx',
  'src/app/(dashboard)/funcionarios/page.tsx',
  'src/app/(dashboard)/financeiro/page.tsx',
  'src/app/(dashboard)/ajuda/page.tsx',
];

filesToUpdate.forEach(filePath => {
  const absolutePath = path.join(__dirname, filePath);
  if (fs.existsSync(absolutePath)) {
    let content = fs.readFileSync(absolutePath, 'utf8');

    // Replace strict matches for UI elements
    // Warning: we should not replace "funcionarios" inside URLs or object properties like `funcionario.id` 
    // unless we know what we're doing. Let's do selective Regex.
    
    // Replace Capitalized words
    content = content.replace(/Funcionários/g, 'Colaboradores');
    content = content.replace(/Funcionário/g, 'Colaborador');
    
    // Replace lowercase words that are preceded by spaces, punctuation, or inside text (not part of camelCase like 'funcionarioId')
    // We avoid 'funcionarioId', 'funcionario.nome', etc by checking boundaries.
    content = content.replace(/([ \>'"\(])funcionários([ \<\.\,\)'"])/g, '$1colaboradores$2');
    content = content.replace(/([ \>'"\(])funcionário([ \<\.\,\)'"])/g, '$1colaborador$2');
    
    fs.writeFileSync(absolutePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});
