// Script para verificar lançamentos quitados
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yjaalhjqbiyguktsfqtq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqYWFsaGpxYml5Z3VrdHNmcXRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUwNzI5NSwiZXhwIjoyMDc5MDgzMjk1fQ.gsrKWJ0yNgeCV-L4YYjPn68LK1122WbVR_J5mo7Yp5w';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verificarQuitados() {
  console.log('Verificando lançamentos quitados...\n');
  
  try {
    // Buscar todos os lançamentos
    const { data: todos, error: errorTodos } = await supabase
      .from('lancamentos')
      .select('id, descricao_complementar, valor, quitado, data');
    
    if (errorTodos) {
      console.error('Erro ao buscar lançamentos:', errorTodos);
      return;
    }

    console.log(`Total de lançamentos: ${todos.length}`);
    
    const quitados = todos.filter(l => l.quitado === true);
    console.log(`Lançamentos quitados: ${quitados.length}\n`);
    
    if (quitados.length > 0) {
      console.log('📋 Lançamentos marcados como quitados:');
      quitados.forEach(l => {
        console.log(`  - ID: ${l.id} | ${l.descricao_complementar} | R$ ${l.valor} | Data: ${l.data}`);
      });
    } else {
      console.log('⚠️  Nenhum lançamento está marcado como quitado.');
    }
    
    console.log('\n✓ Verificação concluída!');
  } catch (err) {
    console.error('Erro:', err.message);
  }
}

verificarQuitados();
