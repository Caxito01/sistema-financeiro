# 📁 Sistema Financeiro - Versão HTML Puro

Este é o seu sistema financeiro convertido para **HTML, CSS e JavaScript puro**, mantendo todas as funcionalidades e conexão com o Supabase.

## 🚀 Como Usar

### 1. ⚠️ IMPORTANTE: Iniciar Servidor Local

**NÃO abra o arquivo diretamente!** Use um servidor HTTP:

#### Opção 1: Servidor Python (Mais Fácil)
1. **Duplo clique** em `INICIAR_SERVIDOR.bat`
2. Abra o navegador em: `http://localhost:8000`

#### Opção 2: PowerShell
```powershell
cd C:\ProjetoHTML\Html_projeto\html_version
python -m http.server 8000
```
Depois acesse: `http://localhost:8000`

#### Opção 3: Node.js
```powershell
npx http-server -p 8000
```

> **Por quê?** Navegadores bloqueiam Supabase e localStorage quando aberto com `file://`

### 2. Estrutura de Arquivos

```
html_version/
├── index.html              # Página inicial (redireciona para login/dashboard)
├── login.html              # Página de login
├── register.html           # Página de cadastro
├── dashboard.html          # Dashboard principal com gráficos
├── lancamentos.html        # Formulário de novo lançamento
├── lista-lancamentos.html  # Lista e gerenciamento de lançamentos
├── relatorios.html         # Relatórios e análises
├── config/
│   └── supabase-config.js  # Configuração e funções do Supabase
└── css/
    └── styles.css          # Estilos globais do sistema
```

## ✨ Funcionalidades

### ✅ Autenticação
- Login com email e senha
- Registro de novos usuários
- Logout
- Proteção de páginas (requer login)

### 📊 Dashboard
- Cards com totais de despesas, receitas e saldo
- Gráfico de pizza: Despesas por subgrupo
- Gráfico de barras: Top 10 classes com maiores despesas
- Botão para ocultar/mostrar valores

### 💰 Lançamentos
- Criar novos lançamentos (despesas/receitas)
- Seleção hierárquica: Grupo → Subgrupo → Classe
- Validação de formulário
- Data pré-preenchida com data atual

### 📋 Lista de Lançamentos
- Visualizar todos os lançamentos
- Filtros por: tipo, status (quitadas/abertas), data
- **Quitar despesas** com forma de pagamento
- **Reabrir** lançamentos quitados
- **Deletar** lançamentos
- **Exportar** para CSV (Excel)
- **Imprimir** relatório
- Cards com totais

### 📈 Relatórios
- Gráfico de linha: Evolução mensal (despesas vs receitas)
- Gráfico de pizza: Despesas por categoria
- Resumo anual

## 🔧 Tecnologias Utilizadas

- **HTML5** - Estrutura das páginas
- **CSS3** - Estilização moderna e responsiva
- **JavaScript Vanilla** - Lógica e interatividade
- **Supabase JS SDK** - Conexão com banco de dados
- **Chart.js** - Gráficos interativos

## 🌐 Dependências Externas (CDN)

O sistema usa CDNs para bibliotecas externas, portanto **precisa de internet**:
- Supabase JS: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- Chart.js: `https://cdn.jsdelivr.net/npm/chart.js@4.4.0`

## 🔐 Configuração do Supabase

As credenciais do Supabase já estão configuradas em `config/supabase-config.js`:
- URL: `https://yjaalhjqbiyguktsfqtq.supabase.co`
- Chave pública já incluída
- **Nenhuma alteração no banco de dados foi feita**

## 📱 Responsividade

O sistema é **totalmente responsivo** e funciona em:
- 💻 Desktop
- 📱 Tablet
- 📱 Mobile

## ⚡ Vantagens da Versão HTML

1. ✅ **Não precisa de Node.js** ou servidor
2. ✅ **Abrir direto no navegador**
3. ✅ **Mesmas funcionalidades** do Next.js
4. ✅ **Supabase intacto** (mesmos dados)
5. ✅ **Mais leve e rápido**
6. ✅ **Fácil de compartilhar** (basta enviar a pasta)

## 🎯 Próximos Passos

Se quiser hospedar online gratuitamente:
- **Netlify**: Arraste a pasta `html_version` no site
- **Vercel**: Upload da pasta
- **GitHub Pages**: Commit e ativar Pages

## 📝 Notas Importantes

- ⚠️ O Next.js **NÃO foi removido** do computador
- ⚠️ O Supabase **NÃO foi alterado**
- ⚠️ Esta é uma **versão paralela** em HTML puro
- ⚠️ Os **dados são os mesmos** (mesmo banco de dados)

## 🆘 Suporte

Se tiver problemas:
1. Verifique se tem internet (precisa para Supabase e Chart.js)
2. Abra o Console do navegador (F12) para ver erros
3. Confira se as credenciais do Supabase estão corretas

---

**Desenvolvido com ❤️ - Versão HTML Pura**
