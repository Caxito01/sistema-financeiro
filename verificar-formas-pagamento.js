const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Ler variáveis do .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const SUPABASE_KEY = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verificarFormasPagamento() {
  console.log('🔍 Verificando formas de pagamento...\n');

  try {
    // Tentar buscar formas de pagamento
    const { data, error } = await supabase
      .from('formas_pagamento')
      .select('*')
      .order('nome');

    if (error) {
      console.log('❌ Erro ao buscar formas de pagamento:', error.message);
      console.log('\n⚠️  A tabela "formas_pagamento" provavelmente NÃO EXISTE no banco de dados.');
      console.log('\n📋 AÇÃO NECESSÁRIA:');
      console.log('1. Acesse: https://supabase.com/dashboard');
      console.log('2. Vá em SQL Editor');
      console.log('3. Execute o conteúdo do arquivo: migration_formas_pagamento.sql');
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  A tabela existe mas está VAZIA.');
      console.log('\n📊 Registros encontrados: 0');
      console.log('\n💡 Execute a migration SQL para inserir as formas padrão.');
    } else {
      console.log('✅ Formas de pagamento encontradas!\n');
      console.log('📊 Total de registros:', data.length);
      console.log('\n📋 Lista:');
      data.forEach((forma, index) => {
        console.log(`${index + 1}. ${forma.nome} - ${forma.ativo ? '✅ Ativo' : '❌ Inativo'}`);
      });
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

verificarFormasPagamento();
