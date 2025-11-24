# 📋 Instruções - Modal de Quitação com Forma de Pagamento

## ✨ Funcionalidades Implementadas

### 1. **Modal de Quitação**
- Ao clicar em "✓ Quitado", abre um popup no centro da tela
- Campos do modal:
  - **Data da Quitação**: Data em que o pagamento foi realizado (padrão: hoje)
  - **Forma de Pagamento**: Dropdown com opções do banco de dados
- Botões:
  - **Cancelar**: Fecha o modal sem salvar
  - **✓ Confirmar Quitação**: Salva os dados

### 2. **Reabertura de Lançamento**
- Lançamentos quitados mostram botão "↻ Aberto" (amarelo)
- Ao clicar, pergunta confirmação e reabre o lançamento
- Remove data de quitação e forma de pagamento

### 3. **Validação**
- Obrigatório selecionar forma de pagamento
- Data de quitação obrigatória

## 🗄️ Migrações Necessárias

### Passo 1: Criar Tabela de Formas de Pagamento

**Se ainda não executou**, rode esta migration primeiro:

```sql
-- Criar tabela de formas de pagamento
CREATE TABLE IF NOT EXISTS formas_pagamento (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inserir formas de pagamento padrão
INSERT INTO formas_pagamento (nome, ativo) VALUES
  ('Dinheiro', true),
  ('Cartão de Crédito', true),
  ('Cartão de Débito', true),
  ('PIX', true),
  ('Transferência Bancária', true)
ON CONFLICT (nome) DO NOTHING;
```

### Passo 2: Adicionar Campos na Tabela Lançamentos

**Execute esta migration agora**:

```sql
-- Adicionar campos de quitação na tabela lancamentos
ALTER TABLE lancamentos 
ADD COLUMN IF NOT EXISTS data_quitacao DATE,
ADD COLUMN IF NOT EXISTS forma_pagamento_id INTEGER REFERENCES formas_pagamento(id);

-- Comentários
COMMENT ON COLUMN lancamentos.data_quitacao IS 'Data em que o lançamento foi quitado';
COMMENT ON COLUMN lancamentos.forma_pagamento_id IS 'Forma de pagamento utilizada na quitação';
```

## 🚀 Como Executar as Migrations

1. **Acesse o Supabase Dashboard**: https://supabase.com/dashboard
2. **Selecione seu projeto**
3. **Vá em "SQL Editor"** (menu lateral esquerdo)
4. **Clique em "New Query"**
5. **Cole o SQL** (primeiro a tabela formas_pagamento, depois os campos de quitação)
6. **Clique em "RUN"** ou pressione Ctrl+Enter
7. **Aguarde a confirmação de sucesso**

## ✅ Verificação

Para verificar se tudo está correto, execute no PowerShell:

```powershell
node verificar-campos-quitacao.js
```

Se aparecer:
- ✅ **Sucesso**: Tudo pronto para usar!
- ❌ **Erro**: Execute a migration SQL no Supabase

## 🎯 Fluxo de Uso

1. **Quitar um lançamento**:
   - Vá em Lançamentos > Lista
   - Clique no botão verde "✓ Quitado"
   - Preencha a data de quitação
   - Selecione a forma de pagamento
   - Clique em "✓ Confirmar Quitação"

2. **Reabrir um lançamento**:
   - Lançamentos quitados aparecem com botão amarelo "↻ Aberto"
   - Clique no botão
   - Confirme a ação
   - O lançamento volta para status aberto

## 📊 Estrutura dos Dados

Após a quitação, o lançamento terá:
- `quitado`: `true`
- `data_quitacao`: Data informada no modal
- `forma_pagamento_id`: ID da forma de pagamento selecionada

Ao reabrir:
- `quitado`: `false`
- `data_quitacao`: `null`
- `forma_pagamento_id`: `null`
