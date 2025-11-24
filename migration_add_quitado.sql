-- Script SQL para adicionar coluna 'quitado' na tabela lancamentos

-- Adicionar coluna quitado (boolean) com valor padrão false
ALTER TABLE lancamentos 
ADD COLUMN IF NOT EXISTS quitado BOOLEAN DEFAULT false;

-- Comentário explicativo
COMMENT ON COLUMN lancamentos.quitado IS 'Indica se o lançamento foi quitado/pago';
