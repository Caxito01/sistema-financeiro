# Prompt de Integração — Controle de Faturas como Sub-página

## Instrução para o desenvolvedor / IA

Incorpore o módulo de **Controle de Faturas de Cartão de Crédito** ao sistema existente como uma sub-página navegável. O módulo deve ser preservado **exatamente como está** — sem alterar nenhuma lógica, nenhum estilo, nenhuma funcionalidade. Apenas adapte a estrutura de montagem (como o componente é instanciado e roteado) para encaixar no sistema.

---

## Regras de integração

### 1. Preservação total do código interno
- **Não altere** nenhuma função utilitária: `parseOFX`, `detectBrand`, `detectInstallment`, `luhn`, `cleanMemo`, `parseTrnBlock`, `getTag`, `parseOFXDate`, `addMonths`, `fmtDate`, `fmtDateShort`, `fmt`, `parseMoney`, `maskCard`
- **Não altere** nenhum componente interno: `BrandLogo`, `OFXImporter`, `CardSetupForm`, `BalanceStrip`, `LaunchForm`, `CardSection`
- **Não altere** nenhum objeto de estilo dentro do `const S = { ... }`
- **Não altere** a lógica de estado do `App` (useState, handlers, flows de setup/main)
- **Não altere** o parser OFX — ele suporta SGML e XML, charset latin1, e detecta parcelas automaticamente

### 2. Adaptações permitidas
Você pode (e deve) fazer **somente** as seguintes mudanças estruturais:

#### a) Renomear o export default
Se o sistema já usa `App` como nome do componente principal, renomeie o export deste módulo:
```jsx
// De:
export default function App() { ... }

// Para:
export default function CartaoFaturas() { ... }
// ou qualquer nome que não conflite com o sistema
```

#### b) Remover o wrapper de página inteira (se necessário)
O componente raiz usa `minHeight: "100vh"` e fundo `#080b12`. Se o sistema já provê um layout/wrapper de página, substitua apenas o `S.root` pelo container do seu sistema:
```jsx
// Estilo original (preservar em standalone):
root: { minHeight: "100vh", background: "#080b12", ... }

// Se integrado dentro de um layout existente, pode trocar por:
root: { width: "100%", background: "#080b12", ... }
// Mantenha o background escuro — o design foi construído para tema dark
```

#### c) Roteamento
Adicione a rota no sistema de navegação existente apontando para o componente. Exemplos:

**React Router:**
```jsx
import CartaoFaturas from "./pages/CartaoFaturas";

<Route path="/cartoes" element={<CartaoFaturas />} />
```

**Next.js (pages):**
```
// Salve como: pages/cartoes.jsx
// O componente já pode ser o default export do arquivo
```

**Next.js (app router):**
```
// Salve como: app/cartoes/page.jsx
```

**Menu/sidebar:**
```jsx
{ label: "💳 Cartões", path: "/cartoes", icon: "credit-card" }
```

#### d) Imports
O módulo usa apenas React hooks nativos. Certifique-se de que o arquivo importa:
```jsx
import { useState, useMemo, useRef } from "react";
```
Nenhuma biblioteca externa é necessária.

---

## O que o módulo faz (para documentação interna)

| Funcionalidade | Descrição |
|---|---|
| **Cadastro de cartões** | Apelido, número (detecta bandeira instantaneamente pelo prefixo + Luhn), limite, vencimento |
| **Bandeiras suportadas** | Visa, Mastercard, Amex, Elo, Hipercard, Diners (logos SVG inline, sem dependências externas) |
| **Lançamento manual** | Descrição, valor, cartão, parcelas (1–12x). Parcelas futuras criadas automaticamente com vencimentos calculados |
| **Importação OFX** | Arraste ou clique para subir `.ofx`. Parser suporta SGML e XML, charset latin1. Extrai banco, conta, período, saldo, transações |
| **Detecção de parcelas no OFX** | Lê o memo do banco e detecta padrões brasileiros: `01/06`, `PARC 01/06`, `1 DE 6`, `01-06` |
| **Trava anti-duplicidade** | Armazena FITIDs importados. Ao subir o mesmo extrato novamente, duplicatas são bloqueadas automaticamente com ícone ⊘ |
| **Controle por cartão** | Cada cartão tem seu próprio limite, barra de consumo e lista de lançamentos. Cálculos são independentes |
| **Parcelas futuras** | Agrupadas por mês com vencimento calculado a partir da data de vencimento do cartão |
| **Reiniciar** | Limpa cartões, lançamentos e FITIDs importados por completo |

---

## Estado gerenciado (referência)

```
cards[]          → cartões cadastrados { id, alias, number, brand, limit, dueDate }
entries[]        → todos os lançamentos { id, groupId, cardId, desc, value, total,
                   installment, month, dueDate, fromOFX?, ofxDate?, ofxFitid? }
importedFitids   → Set<string> de FITIDs já importados via OFX
step             → "setup" | "main"
showOFX          → boolean
showAddCard      → boolean
```

---

## Código-fonte completo do módulo

```jsx
import { useState, useMemo, useRef } from "react";

// ════════════════════════════════════════════════════════════════
// BRAND LOGOS
// ════════════════════════════════════════════════════════════════
function BrandLogo({ brand, size = 36 }) {
  if (brand === "Mastercard") return (
    <svg width={size} height={size * 0.62} viewBox="0 0 38 24">
      <circle cx="14" cy="12" r="11" fill="#EB001B" />
      <circle cx="24" cy="12" r="11" fill="#F79E1B" />
      <path d="M19 3.2a11 11 0 0 1 0 17.6A11 11 0 0 1 19 3.2z" fill="#FF5F00" />
    </svg>
  );
  if (brand === "Visa") return (
    <svg width={size * 1.4} height={size * 0.45} viewBox="0 0 68 22">
      <text x="0" y="18" fontFamily="Arial Black, sans-serif" fontSize="20" fontWeight="900" fontStyle="italic" fill="#1A1F71">VISA</text>
    </svg>
  );
  if (brand === "Amex") return (
    <svg width={size * 1.6} height={size * 0.55} viewBox="0 0 70 22">
      <rect width="70" height="22" rx="3" fill="#007BC1" />
      <text x="5" y="10" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="700" fill="white" letterSpacing="0.5">AMERICAN</text>
      <text x="5" y="18" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="700" fill="white" letterSpacing="0.5">EXPRESS</text>
    </svg>
  );
  if (brand === "Elo") return (
    <svg width={size} height={size * 0.5} viewBox="0 0 42 20">
      <rect width="42" height="20" rx="3" fill="#000" />
      <text x="6" y="15" fontFamily="Arial Black, sans-serif" fontSize="12" fontWeight="900" fill="#FFCB05">elo</text>
    </svg>
  );
  if (brand === "Hipercard") return (
    <svg width={size * 1.6} height={size * 0.5} viewBox="0 0 68 20">
      <rect width="68" height="20" rx="3" fill="#B3131A" />
      <text x="4" y="14" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="700" fill="white">HIPERCARD</text>
    </svg>
  );
  if (brand === "Diners") return (
    <svg width={size * 1.5} height={size * 0.5} viewBox="0 0 60 20">
      <rect width="60" height="20" rx="3" fill="#004B87" />
      <text x="4" y="13" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="700" fill="white">DINERS CLUB</text>
    </svg>
  );
  return <span style={{ color: "#556", fontSize: 11 }}>—</span>;
}

// ════════════════════════════════════════════════════════════════
// OFX PARSER
// ════════════════════════════════════════════════════════════════
function getTag(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>\\s*([^<\\n\\r]+)`, "i");
  const m = block.match(re);
  return m ? m[1].trim() : "";
}

function parseOFXDate(raw) {
  if (!raw) return null;
  const s = raw.replace(/\[.*\]/, "").trim();
  const y = parseInt(s.substring(0, 4));
  const mo = parseInt(s.substring(4, 6)) - 1;
  const d = parseInt(s.substring(6, 8));
  if (isNaN(y) || isNaN(mo) || isNaN(d)) return null;
  return new Date(y, mo, d);
}

function detectInstallment(memo) {
  if (!memo) return null;
  const u = memo.toUpperCase();
  const p1 = u.match(/(?:PARC(?:ELA)?\s+)?(\d{1,2})[\/\-](\d{1,2})(?:\s|$|[^0-9\/])/);
  if (p1) {
    const c = parseInt(p1[1]), t = parseInt(p1[2]);
    if (c >= 1 && t >= 2 && c <= t && t <= 72) return { current: c, total: t };
  }
  const p2 = u.match(/(\d{1,2})\s+DE\s+(\d{1,2})/);
  if (p2) {
    const c = parseInt(p2[1]), t = parseInt(p2[2]);
    if (c >= 1 && t >= 2 && c <= t && t <= 72) return { current: c, total: t };
  }
  return null;
}

function cleanMemo(memo) {
  return memo
    .replace(/\s*(?:PARC(?:ELA)?\s+)?\d{1,2}[\/\-]\d{1,2}/gi, "")
    .replace(/\s*\d{1,2}\s+DE\s+\d{1,2}/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseOFX(text) {
  const content = text.replace(/\r/g, "\n");
  const transactions = [];
  const xmlRe = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;
  while ((match = xmlRe.exec(content)) !== null) {
    const t = parseTrnBlock(match[1]);
    if (t) transactions.push(t);
  }
  if (transactions.length === 0) {
    const parts = content.split(/<STMTTRN>/i).slice(1);
    for (const part of parts) {
      const endRe = /<\/?(?:STMTTRN|BANKTRANLIST|CCSTMTRS|STMTRS|LEDGERBAL|AVAILBAL)/i;
      const endIdx = part.search(endRe);
      const block = endIdx > -1 ? part.substring(0, endIdx) : part;
      const t = parseTrnBlock(block);
      if (t) transactions.push(t);
    }
  }
  const acctId = getTag(content, "ACCTID") || getTag(content, "ACCTNUM") || "";
  const bankId = getTag(content, "BANKID") || getTag(content, "ORG") || "";
  const dtStart = parseOFXDate(getTag(content, "DTSTART"));
  const dtEnd = parseOFXDate(getTag(content, "DTEND"));
  const ledgerBal = parseFloat(getTag(content, "BALAMT")) || null;
  return {
    transactions: transactions.filter(t => t !== null),
    meta: { acctId, bankId, dtStart, dtEnd, ledgerBal },
  };
}

function parseTrnBlock(block) {
  const amountStr = getTag(block, "TRNAMT");
  const amount = parseFloat(amountStr.replace(",", "."));
  if (isNaN(amount) || amount === 0) return null;
  const memo = getTag(block, "MEMO") || getTag(block, "NAME") || "";
  const fitid = getTag(block, "FITID");
  const dtPosted = parseOFXDate(getTag(block, "DTPOSTED"));
  const trntype = getTag(block, "TRNTYPE").toUpperCase();
  const installment = detectInstallment(memo);
  const cleanDesc = cleanMemo(memo) || memo;
  return {
    fitid,
    amount: Math.abs(amount),
    isCredit: trntype === "CREDIT" || amount > 0,
    memo,
    cleanDesc,
    installment,
    date: dtPosted,
    trntype,
  };
}

// ════════════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════════════
function detectBrand(num) {
  const n = num.replace(/\D/g, "");
  if (!n) return null;
  if (/^4/.test(n)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^(636368|4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650[04]|6516|6550)/.test(n)) return "Elo";
  if (/^606282/.test(n)) return "Hipercard";
  if (/^(38|60)/.test(n)) return "Diners";
  return null;
}

function luhn(num) {
  const n = num.replace(/\D/g, "");
  if (n.length < 13) return null;
  let sum = 0;
  for (let i = 0; i < n.length; i++) {
    let d = parseInt(n[n.length - 1 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

function maskCard(val) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

const fmt = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const parseMoney = (v) => parseFloat((v || "").replace(",", ".")) || 0;

function addMonths(base, n) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + n);
  return d;
}

function fmtDate(d) {
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateShort(d) {
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const ACCENT = {
  Visa: "#1A6CFF", Mastercard: "#F79E1B", Amex: "#0099DD",
  Elo: "#FFCB05", Hipercard: "#ff4d4d", Diners: "#4B87CC",
  default: "#00e5a0",
};
const getAccent = (brand) => ACCENT[brand] || ACCENT.default;

// ════════════════════════════════════════════════════════════════
// [COLE AQUI O RESTANTE DO CÓDIGO: OFXImporter, CardSetupForm,
//  BalanceStrip, LaunchForm, CardSection, App + const S]
// ════════════════════════════════════════════════════════════════
// O arquivo completo está em: cartao-debitos.jsx
```

---

## Checklist de integração

- [ ] Arquivo copiado sem modificações internas
- [ ] Export renomeado se necessário (evitar conflito com `App`)
- [ ] Rota criada no sistema de navegação
- [ ] Link/botão no menu apontando para a rota
- [ ] Testado: cadastrar cartão → lançar → importar OFX → reimportar mesmo OFX (deve bloquear)
- [ ] Fundo dark (`#080b12`) preservado ou contido dentro do layout da sub-página
- [ ] Nenhuma dependência externa adicionada

---

## Observações importantes

1. **Sem backend** — o módulo é 100% frontend/in-memory. Se você precisar persistir dados entre sessões, adicione `localStorage` ou integração com Supabase **fora** do componente, lendo/gravando nos arrays `cards`, `entries` e no Set `importedFitids`.

2. **Charset OFX** — o parser lê o arquivo como `latin1` (ISO-8859-1), que é o padrão dos bancos brasileiros. Não troque para UTF-8.

3. **Tema dark** — todos os estilos foram calibrados para fundo escuro. Se o seu sistema usa tema claro, envolva o componente em um container com `background: #080b12`.

4. **FITIDs** — a trava anti-duplicidade funciona por sessão (in-memory). Se o usuário recarregar a página, o histórico de FITIDs é perdido. Para persistência, grave `importedFitids` no localStorage ao chamar `handleOFXImport`.
