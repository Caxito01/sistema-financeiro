-- =============================================
-- migration_cartoes_v2.sql
-- Execute no SQL Editor do Supabase Dashboard
-- Adiciona colunas de agrupamento e parcelamento
-- =============================================

ALTER TABLE lancamentos
  ADD COLUMN IF NOT EXISTS group_id       text,
  ADD COLUMN IF NOT EXISTS parcela_numero int,
  ADD COLUMN IF NOT EXISTS total_parcelas int;

CREATE INDEX IF NOT EXISTS idx_lancamentos_group_id ON lancamentos(group_id) WHERE group_id IS NOT NULL;
