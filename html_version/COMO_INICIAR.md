# 🚀 Como Iniciar o Sistema Financeiro

## ⚠️ IMPORTANTE: Use o servidor local!

O sistema precisa rodar em um servidor HTTP (não pode abrir direto do explorador de arquivos) devido às políticas de segurança do navegador.

---

## 🟢 MÉTODO 1: Servidor Python (RECOMENDADO)

### Passo 1: Duplo clique no arquivo:
```
INICIAR_SERVIDOR.bat
```

### Passo 2: Abra no navegador:
```
http://localhost:8000
```

**Pronto!** 🎉

---

## 🔵 MÉTODO 2: PowerShell (Alternativa)

Abra o PowerShell nesta pasta e execute:

```powershell
python -m http.server 8000
```

Depois acesse: `http://localhost:8000`

---

## 🟡 MÉTODO 3: Node.js (Se tiver instalado)

```powershell
npx http-server -p 8000
```

Depois acesse: `http://localhost:8000`

---

## 🟠 MÉTODO 4: Visual Studio Code

1. Instale a extensão **"Live Server"**
2. Clique com botão direito em `index.html`
3. Selecione **"Open with Live Server"**

---

## ❌ POR QUE NÃO FUNCIONA DIRETO?

Quando você abre o arquivo `.html` direto (duplo clique), o navegador usa o protocolo `file://` que:
- ❌ Bloqueia acesso ao Supabase (CORS)
- ❌ Bloqueia localStorage (Tracking Prevention)
- ❌ Bloqueia CDNs externos

Com servidor HTTP (`http://localhost:8000`):
- ✅ Tudo funciona normalmente!
- ✅ Supabase conecta
- ✅ localStorage funciona
- ✅ CDNs carregam

---

## 🆘 PROBLEMAS?

### "Python não encontrado"
Instale o Python: https://www.python.org/downloads/

### Porta 8000 já está em uso
Use outra porta:
```powershell
python -m http.server 8001
```
E acesse: `http://localhost:8001`

---

## 📝 NOTA

Este é um requisito de **segurança do navegador**, não é um bug do sistema!

Todos os sistemas web modernos precisam rodar em um servidor HTTP.
