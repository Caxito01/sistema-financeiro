// Script para criar a coluna quitado usando HTTP direto
const https = require('https');

const supabaseUrl = 'yjaalhjqbiyguktsfqtq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqYWFsaGpxYml5Z3VrdHNmcXRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUwNzI5NSwiZXhwIjoyMDc5MDgzMjk1fQ.gsrKWJ0yNgeCV-L4YYjPn68LK1122WbVR_J5mo7Yp5w';

const sqlQuery = `ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS quitado BOOLEAN DEFAULT false;`;

const data = JSON.stringify({ query: sqlQuery });

const options = {
  hostname: supabaseUrl,
  port: 443,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'Content-Length': data.length
  }
};

console.log('🔄 Tentando criar coluna quitado...\n');
console.log('❌ ERRO: Não é possível criar colunas via API REST do Supabase.\n');
console.log('📝 VOCÊ PRECISA EXECUTAR MANUALMENTE:\n');
console.log('1. Acesse: https://supabase.com/dashboard/project/yjaalhjqbiyguktsfqtq/editor');
console.log('2. Clique em "SQL Editor" no menu lateral');
console.log('3. Clique em "+ New query"');
console.log('4. Cole este SQL:\n');
console.log('   ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS quitado BOOLEAN DEFAULT false;\n');
console.log('5. Clique em "Run" (ou pressione Ctrl+Enter)\n');
console.log('✅ Depois disso, a funcionalidade de "Quitado" funcionará perfeitamente!\n');
