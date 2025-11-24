-- Adicionar campos de quitação na tabela lancamentos
ALTER TABLE lancamentos 
ADD COLUMN IF NOT EXISTS data_quitacao DATE,
ADD COLUMN IF NOT EXISTS forma_pagamento_id INTEGER REFERENCES formas_pagamento(id);

-- Comentários
COMMENT ON COLUMN lancamentos.data_quitacao IS 'Data em que o lançamento foi quitado';
COMMENT ON COLUMN lancamentos.forma_pagamento_id IS 'Forma de pagamento utilizada na quitação';
