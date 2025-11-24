const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Ler variáveis do .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const SUPABASE_KEY = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verificarCamposQuitacao() {
  console.log('🔍 Verificando campos de quitação na tabela lancamentos...\n');

  try {
    // Tentar buscar um lançamento com os novos campos
    const { data, error } = await supabase
      .from('lancamentos')
      .select('id, quitado, data_quitacao, forma_pagamento_id')
      .limit(1);

    if (error) {
      console.log('❌ Erro:', error.message);
      if (error.message.includes('data_quitacao') || error.message.includes('forma_pagamento_id')) {
        console.log('\n⚠️  Os campos data_quitacao e/ou forma_pagamento_id NÃO EXISTEM na tabela lancamentos.');
        console.log('\n📋 AÇÃO NECESSÁRIA:');
        console.log('1. Acesse: https://supabase.com/dashboard');
        console.log('2. Vá em SQL Editor');
        console.log('3. Execute o conteúdo do arquivo: migration_add_quitacao_fields.sql');
      }
      return;
    }

    console.log('✅ Campos verificados com sucesso!');
    console.log('\n📊 Estrutura da tabela:');
    console.log('- quitado: ✓');
    console.log('- data_quitacao: ✓');
    console.log('- forma_pagamento_id: ✓');
    console.log('\n💡 Tudo pronto para usar a funcionalidade de quitação!');

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

verificarCamposQuitacao();
