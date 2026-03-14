-- =============================================
-- migration_cartoes.sql
-- Módulo de Controle de Cartão de Crédito
-- Execute no SQL Editor do Supabase Dashboard
-- =============================================

-- 1. Tabela de cartões
CREATE TABLE IF NOT EXISTS cartoes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alias           text NOT NULL,
  bandeira        text,
  numero_masked   text,
  limite          numeric(12,2) DEFAULT 0,
  vencimento_dia  int CHECK (vencimento_dia BETWEEN 1 AND 31),
  vencimento_mes  int CHECK (vencimento_mes BETWEEN 1 AND 12),
  vencimento_ano  int CHECK (vencimento_ano >= 2020),
  ativo           boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 2. Novas colunas em lancamentos
ALTER TABLE lancamentos
  ADD COLUMN IF NOT EXISTS cartao_id  uuid REFERENCES cartoes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ofx_fitid  text;

-- 3. Índices de performance
CREATE INDEX IF NOT EXISTS idx_cartoes_user_id    ON cartoes(user_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_cartao ON lancamentos(cartao_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_fitid  ON lancamentos(ofx_fitid) WHERE ofx_fitid IS NOT NULL;

-- 4. RLS em cartoes
ALTER TABLE cartoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cartoes_select_own" ON cartoes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cartoes_insert_own" ON cartoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cartoes_update_own" ON cartoes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "cartoes_delete_own" ON cartoes
  FOR DELETE USING (auth.uid() = user_id);
