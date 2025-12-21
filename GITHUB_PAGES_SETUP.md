# 🚀 Guia de Deploy - GitHub Pages

## ✅ O que foi feito

1. **Configurado Next.js para exportação estática** (`next.config.ts`)
   - Output: `export` (gera HTML/CSS/JS estático)
   - Base path: `/sistema-financeiro` (para servir do subdiretório do GitHub Pages)
   - Imagens otimizadas desabilitadas (compatível com GitHub Pages)

2. **Criado workflow automático** (`.github/workflows/deploy.yml`)
   - Dispara automaticamente em cada push para main/master
   - Instala dependências
   - Faz build do projeto
   - Publica no GitHub Pages

## 📋 Passos para ativar

### 1️⃣ Push para GitHub (se ainda não fez)

```bash
git add .
git commit -m "feat: configurar para GitHub Pages"
git push origin main
```

### 2️⃣ Ativar GitHub Pages no repositório

1. Vá para **Settings** do repositório
2. Navegue até **Pages** (menu lateral)
3. Em "Source", selecione **Deploy from a branch**
4. Branch: **gh-pages**
5. Folder: **/ (root)**
6. Clique em **Save**

### 3️⃣ Aguarde o deploy automático

- O GitHub Actions executará automaticamente
- Verifique em **Actions** para monitorar o build
- Após sucesso, seu site estará em: https://caxito01.github.io/sistema-financeiro/

## 🔧 Se houver problemas

### Build falha?
```bash
npm install
npm run build
# Verifique se a pasta "out" foi criada
```

### GitHub Pages não atualiza?
- Aguarde 2-5 minutos após o push
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Verifique as Actions para erro no build

### Página carrega vazia?
- Abra o DevTools (F12) - Console
- Procure por erros de CORS ou caminho
- Certifique-se de que as variáveis de ambiente estão corretas

## 🌍 Variáveis de Ambiente

Se sua app usa variáveis secretas do Supabase, adicione no repositório:

1. **Settings** → **Secrets and variables** → **Actions**
2. Adicione secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, etc.
3. No workflow, use:
```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
```

## ✨ Próximos passos

- Teste a URL: https://caxito01.github.io/sistema-financeiro/
- Se funcionar, remova a pasta `html_version/` (não precisa mais)
- Atualize links em documentos que apontam para a versão antiga

---

**Status:** ✅ Pronto para deploy automático!
