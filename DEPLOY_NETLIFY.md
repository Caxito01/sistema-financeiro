# 🚀 Guia de Deploy no Netlify

Este arquivo contém as instruções passo-a-passo para fazer deploy do Sistema Financeiro no Netlify.

## 📋 Pré-requisitos

- Conta no GitHub (✅ Você já tem)
- Conta no Netlify (gratuita em https://netlify.com)
- Conta no Supabase (✅ Você já tem)

## 🔧 Passo 1: Preparar o Repositório

1. Certifique-se de que todos os commits estão enviados para GitHub:
```bash
git status
git push origin main
```

## 📱 Passo 2: Conectar ao Netlify

### Opção A: Usando a Interface Web (Recomendado)

1. Acesse https://app.netlify.com
2. Clique em **"New site from Git"**
3. Selecione **GitHub**
4. Procure por **"sistema-financeiro"**
5. Clique em **"Deploy site"**

### Opção B: Usando Netlify CLI

```bash
# Instale o Netlify CLI globalmente
npm install -g netlify-cli

# Faça login no Netlify
netlify login

# Deploy do projeto
cd c:\luan_projeto
netlify deploy --prod
```

## 🔐 Passo 3: Configurar Variáveis de Ambiente

### No Dashboard do Netlify:

1. Acesse seu site no Netlify
2. Vá para **Site settings** → **Build & deploy** → **Environment**
3. Clique em **Edit variables**
4. Adicione as seguintes variáveis:

```
NEXT_PUBLIC_SUPABASE_URL = sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY = sua_chave_anonima
```

**Como encontrar estas chaves:**
- Acesse https://app.supabase.com
- Selecione seu projeto
- Vá para **Settings** → **API**
- Copie:
  - **Project URL** → Cole em `NEXT_PUBLIC_SUPABASE_URL`
  - **anon (public)** → Cole em `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## ⚙️ Passo 4: Configurar Supabase (IMPORTANTE!)

### Adicionar URL do Netlify aos Redirects Autorizados do Supabase:

1. No dashboard do Supabase
2. Vá para **Authentication** → **Providers** → **Email**
3. Adicione em "Redirect URLs":
   - `https://seu-site.netlify.app/auth/callback`
   - `https://seu-site.netlify.app/`

## 🔄 Passo 5: Fazer Deploy

Depois de configurar as variáveis:

1. Vá para **Deploys** no dashboard do Netlify
2. Clique em **Trigger deploy** → **Deploy site**
3. Ou faça um novo push para GitHub (deploy automático)

## ✅ Passo 6: Testar

Após o deploy completar:

1. Clique no URL do site (ex: `https://seu-site.netlify.app`)
2. Teste o login
3. Crie um novo lançamento
4. Verifique os relatórios

## 🐛 Solução de Problemas

### "Build failed"
- Verifique os logs do Netlify
- Certifique-se de que `npm run build` funciona localmente

### "Database connection error"
- Verifique se as variáveis de ambiente estão corretas
- Teste em `http://localhost:3000` localmente

### "Authentication not working"
- Adicione o URL do Netlify aos redirect URLs do Supabase
- Verifique as variáveis de ambiente

### "Página 404 ao recarregar"
- Isso está resolvido no `netlify.toml`
- Se persistir, limpe o cache do navegador

## 📊 Monitoramento

No dashboard do Netlify você pode:

- 📈 Ver analytics de visitantes
- 🚀 Acompanhar builds
- ⚡ Verificar performance
- 🔍 Ver logs de deployment
- 🔄 Fazer rollback de versões anteriores

## 💡 Dicas

1. **Domínio Personalizado**: Acesse **Site settings** → **Domain management**
2. **HTTPS Automático**: Netlify configura automaticamente
3. **Deploy Preview**: Cada Pull Request gera uma preview automática
4. **Variáveis de Staging**: Use diferentes variáveis por ambiente

## 🔗 Links Úteis

- Netlify Dashboard: https://app.netlify.com
- Supabase Console: https://app.supabase.com
- GitHub Repo: https://github.com/Caxito01/sistema-financeiro
- Next.js Deployment: https://nextjs.org/docs/deployment/netlify

---

**Dúvidas?** Consulte a documentação oficial ou abra uma issue no GitHub.
