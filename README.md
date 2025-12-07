# 💰 Sistema Financeiro

Um sistema completo de gerenciamento financeiro construído com **Next.js**, **TypeScript**, **Supabase** e **Tailwind CSS**.

## 🎯 Funcionalidades Principais

### 📊 Relatórios
- Visualização hierárquica de receitas e despesas
- Filtros avançados (tipo, data, categoria)
- Cálculo automático de saldos (Receitas - Despesas)
- Acompanhamento de quitações
- Busca por palavras-chave

### 💰 Lançamentos
- **Novo Lançamento**: Adicione receitas e despesas rapidamente
- **Lista de Lançamentos**: Visualize todos os registros com filtros
- Edição e exclusão de lançamentos
- Marcação de status de quitação
- Impressão de relatórios
- Ocultar valores para privacidade

### ⚙️ Configurações
- **Hierarquia de Categorias**: Organize em Grupos → Subgrupos → Classes
- **Formas de Pagamento**: Gerencie as formas de pagamento disponíveis
- Ativação/Desativação de itens
- Palavras-chave para busca automática

### 🎨 Recursos Adicionais
- **Dashboard**: Acesso rápido a todas as funcionalidades
- **Autenticação**: Login seguro com Supabase
- **Design Responsivo**: Funciona em desktop e mobile
- **Ajuda Integrada**: Guias em cada página do sistema
- **Exportação**: (Em desenvolvimento)

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+ instalado
- NPM ou Yarn
- Variáveis de ambiente configuradas

### Instalação

```bash
# Clone o repositório
git clone https://github.com/Caxito01/sistema-financeiro.git
cd sistema-financeiro

# Instale as dependências
npm install

# Configure as variáveis de ambiente
# Crie um arquivo .env.local com:
# NEXT_PUBLIC_SUPABASE_URL=sua_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave

# Inicie o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) para ver a aplicação.

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/          # Páginas de autenticação
│   ├── (dashboard)/     # Dashboard e configurações
│   ├── lancamentos/     # Novo lançamento e lista
│   ├── relatorios/      # Página de relatórios
│   └── layout.tsx       # Layout principal
├── components/
│   ├── ui/              # Componentes reutilizáveis
│   ├── forms/           # Formulários
│   ├── tables/          # Tabelas
│   └── layout/          # Layout
├── lib/
│   └── supabase/        # Configuração Supabase
└── types/
    └── database.types.ts # Tipos do banco de dados
```

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 14+ (App Router)
- **Linguagem**: TypeScript
- **Estilo**: Tailwind CSS
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Ícones**: Lucide React
- **Utilitários**: clsx, tailwind-merge

## 📝 Scripts Disponíveis

```bash
npm run dev      # Inicia o servidor de desenvolvimento
npm run build    # Cria a build para produção
npm run start    # Inicia o servidor de produção
npm run lint     # Executa o linter
```

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

## 📚 Guias de Uso

### Como Adicionar um Lançamento
1. Clique em "💰 Novo Lançamento"
2. Escolha o tipo (Despesa ou Receita)
3. Selecione Grupo → Subgrupo → Classe
4. Preencha a data e valor
5. Clique em "Adicionar Lançamento"

### Como Criar uma Categoria
1. Vá para "⚙️ Configurações"
2. Na seção "Seleção Hierárquica", use os dropdowns
3. Clique no botão "+" para criar um novo item
4. Preencha os dados e clique em "Salvar"

### Como Visualizar Relatórios
1. Clique em "📊 Relatórios"
2. Use os filtros para refinar a busca
3. Visualize o resumo financeiro (4 cards)
4. Analise a tabela hierárquica

## 🐛 Suporte

Se encontrar algum bug ou tiver dúvidas:
1. Clique no botão **❓ Ajuda** em qualquer página
2. Verifique os logs no console do navegador
3. Abra uma issue no GitHub

## 📄 Licença

Este projeto está sob a licença MIT.

## 👤 Autor

Desenvolvido por **Luan** - Sistema Financeiro

---

**Última atualização:** Dezembro de 2025

