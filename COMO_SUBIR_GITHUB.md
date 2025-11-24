# Como Subir o Projeto para o GitHub

## Passo 1: Criar o Repositório no GitHub

1. Abra seu navegador e acesse: https://github.com/new
2. Preencha os campos:
   - **Repository name:** `sistema-financeiro`
   - **Description:** Sistema Financeiro com Next.js e Supabase
   - Escolha **Public** (público) ou **Private** (privado)
   - ⚠️ **IMPORTANTE:** NÃO marque nenhuma dessas opções:
     - [ ] Add a README file
     - [ ] Add .gitignore
     - [ ] Choose a license
3. Clique no botão verde **"Create repository"**

## Passo 2: Enviar o Código

Após criar o repositório, o GitHub mostrará uma página com instruções.

**Abra o PowerShell** nesta pasta (`c:\luan_projeto`) e execute:

```powershell
git push -u origin main
```

Se pedir usuário e senha:
- **Username:** Caxito01
- **Password:** Use um Personal Access Token (não é a senha do GitHub!)

### Como Criar um Personal Access Token

Se o push pedir senha e você não tiver um token:

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Preencha:
   - **Note:** Token para sistema-financeiro
   - **Expiration:** 90 days (ou o que preferir)
   - **Scopes:** Marque apenas **repo** (todas as opções dentro de repo)
4. Clique em **"Generate token"**
5. **COPIE O TOKEN** (você só verá uma vez!)
6. Use esse token como senha quando o Git pedir

## Passo 3: Verificar

Após o push, acesse:
https://github.com/Caxito01/sistema-financeiro

Você verá todos os arquivos do projeto lá! 🎉

## Problemas Comuns

### Erro "repository not found"
- O repositório não foi criado no GitHub. Volte ao Passo 1.

### Erro de autenticação
- Você precisa de um Personal Access Token (veja acima)
- OU configure SSH: https://docs.github.com/pt/authentication/connecting-to-github-with-ssh

### Push travou ou não fez nada
- Aperte Ctrl+C e tente novamente
- Verifique sua conexão com internet

---

**✅ Status Atual:**
- ✅ Código commitado localmente
- ✅ Repositório remoto configurado
- ⏳ Aguardando push para o GitHub
