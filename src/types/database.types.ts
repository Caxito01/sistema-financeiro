export type Grupo = {
  id: number;
  codigo: number;
  nome: string;
  tipo: 'DESPESA' | 'RECEITA';
  ativo: boolean;
  created_at: string;
};

export type Subgrupo = {
  id: number;
  grupo_id: number;
  codigo: number;
  nome: string;
  ativo: boolean;
  created_at: string;
};

export type Classe = {
  id: number;
  subgrupo_id: number;
  codigo: string;
  descricao: string;
  palavras_chave: string[];
  ativo: boolean;
  created_at: string;
};

export type Lancamento = {
  id: string;
  user_id: string;
  classe_id: number;
  descricao_complementar?: string;
  valor: number;
  data: string;
  tipo: 'DESPESA' | 'RECEITA';
  comprovante_url?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
};

export type LancamentoCompleto = Lancamento & {
  classe: Classe & {
    subgrupo: Subgrupo & {
      grupo: Grupo;
    };
  };
};