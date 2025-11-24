# Instruções para Adicionar Formas de Pagamento

## Passo 1: Executar a Migration no Supabase

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo `migration_formas_pagamento.sql`
6. Clique em **Run** para executar a migration

## Passo 2: Verificar a Criação

Após executar a migration, você pode verificar se tudo funcionou:

1. Vá em **Table Editor** no Supabase
2. Procure pela tabela `formas_pagamento`
3. Você deve ver 5 registros padrão:
   - Dinheiro
   - Cartão de Crédito
   - Cartão de Débito
   - PIX
   - Transferência Bancária

## Passo 3: Testar no Sistema

1. Execute o sistema localmente: `npm run dev`
2. Acesse a página de **Configurações**
3. Role até a seção **💳 Formas de Pagamento**
4. Você verá as formas de pagamento cadastradas
5. Teste adicionar, editar e excluir formas de pagamento

## Funcionalidades Implementadas

✅ Listagem de formas de pagamento
✅ Adicionar nova forma de pagamento
✅ Editar forma de pagamento existente
✅ Ativar/Desativar forma de pagamento
✅ Excluir forma de pagamento
✅ Indicação visual de formas inativas (vermelho)

## Estrutura da Tabela

```sql
CREATE TABLE formas_pagamento (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Observações

- Formas inativas aparecem em vermelho com a marcação "(inativo)"
- O campo "nome" é único, não permitindo duplicatas
- Todas as formas vêm ativas por padrão
