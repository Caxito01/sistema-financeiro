#!/usr/bin/env node
/**
 * Script de deploy automático:
 * 1. Copia config/ e css/ do html_version → docs/ (preserva assets)
 * 2. Corrige links lista-lancamentos.html em todos os HTMLs de docs/
 * 3. git add docs/
 * 4. git commit com mensagem automática
 * 5. git push
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

// 1. Recriar docs/config e docs/css a partir do html_version
const dirs = ['config', 'css'];
for (const dir of dirs) {
  const src = path.join(ROOT, 'html_version', dir);
  const dest = path.join(ROOT, 'docs', dir);
  if (fs.existsSync(src)) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      fs.copyFileSync(path.join(src, file), path.join(dest, file));
      console.log(`Copiado: ${dir}/${file}`);
    }
  }
}

// 2. Corrigir links lista-lancamentos.html nos HTMLs de docs/
const docsDir = path.join(ROOT, 'docs');
const htmlFiles = fs.readdirSync(docsDir).filter(f => f.endsWith('.html'));
let fixedCount = 0;
for (const file of htmlFiles) {
  const filePath = path.join(docsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('lista-lancamentos.html')) {
    fs.writeFileSync(filePath, content.replaceAll('lista-lancamentos.html', 'lancamentos/lista.html'));
    fixedCount++;
    console.log(`Link corrigido: ${file}`);
  }
}
if (fixedCount === 0) console.log('Nenhum link para corrigir.');

// 3-5. Git add + commit + push
const now = new Date().toLocaleString('pt-BR');
run('git add docs/');
try {
  run(`git commit -m "deploy: atualização automática - ${now}"`);
  run('git push origin main');
  console.log('\n✅ Deploy concluído!');
} catch {
  console.log('\nNada novo para commitar.');
}
