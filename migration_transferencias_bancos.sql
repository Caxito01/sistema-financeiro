-- Criação da tabela de log de transferências entre bancos
CREATE TABLE IF NOT EXISTS transferencias_bancos (
  id                BIGSERIAL PRIMARY KEY,
  banco_origem_id   BIGINT NOT NULL REFERENCES bancos(id) ON DELETE CASCADE,
  banco_destino_id  BIGINT NOT NULL REFERENCES bancos(id) ON DELETE CASCADE,
  valor             NUMERIC(15,2) NOT NULL CHECK (valor > 0),
  data              DATE NOT NULL DEFAULT CURRENT_DATE,
  observacao        TEXT,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_transf_bancos_user_id ON transferencias_bancos(user_id);
CREATE INDEX IF NOT EXISTS idx_transf_bancos_data ON transferencias_bancos(data);

-- Row Level Security
ALTER TABLE transferencias_bancos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê apenas suas transferências"
  ON transferencias_bancos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere suas transferências"
  ON transferencias_bancos FOR INSERT
  WITH CHECK (auth.uid() = user_id);
