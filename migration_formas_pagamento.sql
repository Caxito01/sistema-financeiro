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

-- Comentários
COMMENT ON TABLE formas_pagamento IS 'Tabela de formas de pagamento disponíveis';
COMMENT ON COLUMN formas_pagamento.nome IS 'Nome da forma de pagamento';
COMMENT ON COLUMN formas_pagamento.ativo IS 'Indica se a forma de pagamento está ativa';
