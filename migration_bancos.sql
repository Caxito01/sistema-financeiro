-- Criação da tabela bancos
CREATE TABLE IF NOT EXISTS bancos (
  id         BIGSERIAL PRIMARY KEY,
  nome       TEXT NOT NULL,
  agencia    TEXT NOT NULL,
  conta      TEXT NOT NULL,
  tipo_conta TEXT NOT NULL DEFAULT 'Corrente' CHECK (tipo_conta IN ('Corrente', 'Poupança')),
  saldo      NUMERIC(15,2) NOT NULL DEFAULT 0,
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna saldo se a tabela já existir
ALTER TABLE bancos ADD COLUMN IF NOT EXISTS saldo NUMERIC(15,2) NOT NULL DEFAULT 0;

-- Índice para buscas por usuário
CREATE INDEX IF NOT EXISTS idx_bancos_user_id ON bancos(user_id);

-- Row Level Security
ALTER TABLE bancos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê apenas seus bancos"
  ON bancos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere seus bancos"
  ON bancos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza seus bancos"
  ON bancos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário deleta seus bancos"
  ON bancos FOR DELETE
  USING (auth.uid() = user_id);
