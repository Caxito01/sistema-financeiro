// Script para adicionar coluna quitado na tabela lancamentos
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yjaalhjqbiyguktsfqtq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqYWFsaGpxYml5Z3VrdHNmcXRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUwNzI5NSwiZXhwIjoyMDc5MDgzMjk1fQ.gsrKWJ0yNgeCV-L4YYjPn68LK1122WbVR_J5mo7Yp5w';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addQuitadoColumn() {
  console.log('Executando migração: adicionando coluna quitado...');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE lancamentos 
        ADD COLUMN IF NOT EXISTS quitado BOOLEAN DEFAULT false;
      `
    });

    if (error) {
      console.error('Erro ao executar SQL:', error);
      console.log('\nTentando método alternativo...\n');
      
      // Método alternativo: atualizar schema através de uma query
      const { error: error2 } = await supabase
        .from('lancamentos')
        .select('quitado')
        .limit(1);
      
      if (error2 && error2.message.includes('column "quitado" does not exist')) {
        console.log('❌ A coluna quitado não existe e não pode ser criada automaticamente.');
        console.log('\n📝 EXECUTE MANUALMENTE NO SUPABASE:');
        console.log('\n1. Acesse: https://supabase.com/dashboard/project/yjaalhjqbiyguktsfqtq/editor');
        console.log('2. Vá em "SQL Editor"');
        console.log('3. Execute este SQL:\n');
        console.log('   ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS quitado BOOLEAN DEFAULT false;\n');
      } else {
        console.log('✅ A coluna quitado já existe!');
      }
    } else {
      console.log('✅ Migração executada com sucesso!');
    }
  } catch (err) {
    console.error('Erro:', err.message);
    console.log('\n📝 EXECUTE MANUALMENTE NO SUPABASE:');
    console.log('\n1. Acesse: https://supabase.com/dashboard/project/yjaalhjqbiyguktsfqtq/editor');
    console.log('2. Vá em "SQL Editor"');
    console.log('3. Execute este SQL:\n');
    console.log('   ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS quitado BOOLEAN DEFAULT false;\n');
  }
}

addQuitadoColumn();
